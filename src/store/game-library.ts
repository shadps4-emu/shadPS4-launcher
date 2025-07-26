import { basename, join, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, watch } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import { toast } from "sonner";
import { readPsf } from "@/lib/native/psf";
import { stringifyError } from "@/lib/utils/error";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import type { Callback } from "@/lib/utils/types";
import { defaultStore } from ".";
import type { CUSA } from "./common";
import { db, type GameEntry } from "./db";
import { atomGamesPath } from "./paths";

export enum SortType {
    NONE = "None",
    TITLE = "Title",
    CUSA = "CUSA",
}

export const atomGameLibrarySorting = atomWithTauriStore<SortType>(
    "config.json",
    "game_library_sort",
    { initialValue: SortType.NONE },
);

export const atomGameLibraryIsIndexing = atom(false);
export const atomGameLibrary = atom<GameEntry[]>([]);

async function loadGameData(path: string): Promise<GameEntry> {
    try {
        const base = await basename(path);

        const paramSfo = await join(path, "sce_sys", "param.sfo");

        if (!(await exists(paramSfo))) {
            return {
                path: path,
                cusa: ("N/A - " + base) as CUSA,
                title: base,
                version: "N/A",
                fw_version: "N/A",
                sfo: null,
            };
        }

        const sfo = await readPsf(paramSfo);
        const e = sfo.entries;

        let fw_version = e.SYSTEM_VER?.Integer?.toString(16)
            .padStart(8, "0")
            .slice(0, 4);
        if (fw_version) {
            fw_version = `${fw_version.slice(0, 2).trimStart()}.${fw_version.slice(2)}`;
            if (fw_version.startsWith("0")) {
                fw_version = fw_version.slice(1);
            }
        }

        return {
            path: path,
            cusa: (e.TITLE_ID?.Text || base) as CUSA,
            title: e.TITLE?.Text || "Unknown",
            version: e.APP_VER?.Text || "UNK",
            fw_version: fw_version || "UNK",
            sfo,
        };
    } catch (e: unknown) {
        console.error(`could not read game info at: "${path}"`, e);
        return {
            path: path,
            cusa: "N/A",
            title: "N/A",
            version: "N/A",
            fw_version: "N/A",
            sfo: null,
            error: new Error(`game read info. ${stringifyError(e)}`, {
                cause: e,
            }),
        };
    }
}

const gameRegisterQueue: string[] = [];
let gameRegisterQueueIsUse = false;

async function registerGamePath(workPath: string) {
    console.debug(`Loading game from ${workPath}`);
    gameRegisterQueue.push(workPath);
    if (gameRegisterQueueIsUse) {
        return;
    }
    gameRegisterQueueIsUse = true;
    while (gameRegisterQueue.length > 0) {
        const path = gameRegisterQueue.shift();
        if (!path) {
            break;
        }
        const gameData = await loadGameData(path);
        if (!("error" in gameData)) {
            db.addGame(gameData);
        }
        defaultStore.set(atomGameLibrary, (prev) =>
            prev.filter((e) => e.path !== path).concat(gameData),
        );
    }
    gameRegisterQueueIsUse = false;
}

async function unregisterGamePathPrefix(
    pathPrefix: string,
    knownPaths: Set<string>,
) {
    defaultStore.set(atomGameLibrary, (prev) =>
        prev.filter((e) => {
            const toRemove = e.path.startsWith(pathPrefix);
            if (toRemove) {
                knownPaths.delete(e.path);
                db.removeGame(e.path);
            }
            return !toRemove;
        }),
    );
}

async function isGame(path: string) {
    const eBootPath = await join(path, "eboot.bin");
    return await exists(eBootPath);
}

async function scanDirectory(
    path: string,
    knownPaths: Set<string>,
    signal: AbortSignal,
    recursionLevel: number,
) {
    try {
        if (recursionLevel > 3 || signal.aborted) {
            return;
        }
        if (knownPaths.has(path)) {
            return;
        }
        if (path.endsWith("-UPDATE") || path.endsWith("-patch")) {
            return;
        }
        if (await isGame(path)) {
            void registerGamePath(path);
            return;
        }
        const children = await readDir(path);
        for (const c of children) {
            if (c.isDirectory) {
                const childPath = await join(path, c.name);
                await scanDirectory(
                    childPath,
                    knownPaths,
                    signal,
                    recursionLevel + 1,
                );
            }
        }
    } catch (e: unknown) {
        console.error(`Error discovering game at "${path}"`, e);
    }
}

(async () => {
    const cachedGames = await db.listGames();
    defaultStore.set(atomGameLibrary, cachedGames);

    const knownPaths = new Set<string>();

    for (const e of cachedGames) {
        knownPaths.add(e.path);
    }

    let prevPath: string | null = null;
    let cancel: (() => Promise<void>) | undefined;

    const onChange = (path: string) => {
        const c = cancel;
        let unsub: Callback | undefined;
        const abortController = new AbortController();
        const signal = abortController.signal;
        const prom = (async () => {
            if (c) {
                await c();
            }
            try {
                if (!path || path === prevPath) {
                    return;
                }
                console.log("Indexing games at", path);
                if (prevPath != null) {
                    prevPath = path; // set this before await
                    defaultStore.set(atomGameLibraryIsIndexing, true);
                    defaultStore.set(atomGameLibrary, []);
                    knownPaths.clear();
                    await db.removeAllGames();
                }
                prevPath = path;
                if (path) {
                    if (!(await exists(path))) {
                        await mkdir(path, { recursive: true });
                    }
                    if (signal.aborted) {
                        return;
                    }
                    await scanDirectory(path, knownPaths, signal, 0);
                    if (signal.aborted) {
                        return;
                    }
                    unsub = await watch(path, async (e) => {
                        if (typeof e.type === "object") {
                            if ("create" in e.type) {
                                const newPath = e.paths[0];
                                if (
                                    newPath &&
                                    (await stat(newPath)).isDirectory
                                ) {
                                    let idx = Number.POSITIVE_INFINITY;
                                    while (true) {
                                        idx = newPath.lastIndexOf(
                                            sep(),
                                            idx - 1,
                                        );
                                        if (idx === -1) {
                                            break;
                                        }
                                        if (
                                            knownPaths.has(
                                                newPath.slice(0, idx),
                                            )
                                        ) {
                                            return;
                                        }
                                    }
                                    defaultStore.set(
                                        atomGameLibraryIsIndexing,
                                        true,
                                    );
                                    await scanDirectory(
                                        newPath,
                                        knownPaths,
                                        signal,
                                        1,
                                    );
                                    defaultStore.set(
                                        atomGameLibraryIsIndexing,
                                        false,
                                    );
                                }
                            } else if ("remove" in e.type) {
                                const newPath = e.paths[0];
                                if (newPath) {
                                    unregisterGamePathPrefix(
                                        newPath,
                                        knownPaths,
                                    );
                                }
                            }
                        }
                    });
                    defaultStore.set(atomGameLibraryIsIndexing, false);
                }
            } catch (e: unknown) {
                console.error("error watching path", stringifyError(e));
                toast.error("Error watching games path: " + stringifyError(e));
            }
        })();
        cancel = () => {
            abortController.abort();
            unsub?.();
            return prom;
        };
    };
    atomGamesPath.listen(onChange);
})();
