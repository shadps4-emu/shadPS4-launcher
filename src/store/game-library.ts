import { basename, join, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, watch } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import { toast } from "sonner";
import { readPsf } from "@/lib/native/psf";
import { stringifyError } from "@/lib/utils/error";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import { defaultStore } from ".";
import { db, type GameRow } from "./db";
import { atomGamesPath } from "./paths";

export enum SortType {
    NONE = "None",
    TITLE = "Title",
    CUSA = "CUSA",
}

export const atomGameLibrarySorting = atomWithTauriStore<SortType, false>(
    "config.json",
    "game_library_sort",
    { initialValue: SortType.NONE },
);

export const atomGameLibrary = atom<{
    indexing: boolean;
    games: (GameRow & { error?: Error })[];
}>({
    indexing: false,
    games: [],
});

async function loadGameData(
    path: string,
): Promise<GameRow & { error?: Error }> {
    try {
        const base = await basename(path);

        const paramSfo = await join(path, "sce_sys", "param.sfo");

        if (!(await exists(paramSfo))) {
            return {
                path: path,
                cusa: "N/A - " + base,
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
            cusa: e.TITLE_ID?.Text || base,
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

async function registerGamePath(path: string) {
    console.debug(`Loading game from ${path}`);
    const gameData = await loadGameData(path);
    if (!("error" in gameData)) {
        db.addGame(gameData);
    }
    defaultStore.set(atomGameLibrary, (prev) => ({
        ...prev,
        games: prev.games.filter((e) => e.path !== path).concat(gameData),
    }));
}

async function unregisterGamePathPrefix(
    pathPrefix: string,
    knownPaths: Set<string>,
) {
    defaultStore.set(atomGameLibrary, (prev) => {
        return {
            ...prev,
            games: prev.games.filter((e) => {
                const toRemove = e.path.startsWith(pathPrefix);
                if (toRemove) {
                    knownPaths.delete(e.path);
                    db.removeGame(e.path);
                }
                return !toRemove;
            }),
        };
    });
}

async function isGame(path: string) {
    const eBootPath = await join(path, "eboot.bin");
    return await exists(eBootPath);
}

let indexingCount = 0;

async function scanDirectory(
    path: string,
    knownPaths: Set<string>,
    signal: AbortSignal,
    recursionLevel: number,
) {
    try {
        indexingCount++;

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
            setTimeout(() => registerGamePath(path), 1);
            return;
        }
        const children = await readDir(path);
        for (const c of children) {
            if (c.isDirectory) {
                const childPath = await join(path, c.name);
                scanDirectory(
                    childPath,
                    knownPaths,
                    signal,
                    recursionLevel + 1,
                );
            }
        }
    } catch (e: unknown) {
        console.error(`Error discovering game at "${path}"`, e);
    } finally {
        indexingCount--;
        if (indexingCount === 0) {
            defaultStore.set(atomGameLibrary, (prev) => ({
                ...prev,
                indexing: false,
            }));
        }
    }
}

(async () => {
    const cachedGames = await db.listGames();
    defaultStore.set(atomGameLibrary, {
        indexing: true,
        games: cachedGames,
    });

    const knownPaths = new Set<string>();

    for (const e of cachedGames) {
        knownPaths.add(e.path);
    }

    let first = true;

    let cancel: (() => void) | undefined;
    defaultStore.sub(atomGamesPath, async () => {
        cancel?.();
        cancel = undefined;

        try {
            if (!first) {
                first = false;
                defaultStore.set(atomGameLibrary, {
                    indexing: true,
                    games: [],
                });
                knownPaths.clear();
            }
            indexingCount = 0;
            const path = defaultStore.get(atomGamesPath);
            if (path) {
                if (!(await exists(path))) {
                    await mkdir(path, { recursive: true });
                }
                const abortController = new AbortController();
                scanDirectory(path, knownPaths, abortController.signal, 0);
                const unsub = await watch(path, async (e) => {
                    if (typeof e.type === "object") {
                        if ("create" in e.type) {
                            const newPath = e.paths[0];
                            if (newPath && (await stat(newPath)).isDirectory) {
                                let idx = Number.POSITIVE_INFINITY;
                                while (true) {
                                    idx = newPath.lastIndexOf(sep(), idx - 1);
                                    if (idx === -1) {
                                        break;
                                    }
                                    if (knownPaths.has(newPath.slice(0, idx))) {
                                        return;
                                    }
                                }
                                scanDirectory(
                                    newPath,
                                    knownPaths,
                                    abortController.signal,
                                    1,
                                );
                            }
                        } else if ("remove" in e.type) {
                            const newPath = e.paths[0];
                            if (newPath) {
                                unregisterGamePathPrefix(newPath, knownPaths);
                            }
                        }
                    }
                });
                cancel = () => {
                    unsub();
                    abortController.abort();
                };
            }
        } catch (e: unknown) {
            console.error("error watching path", stringifyError(e));
            toast.error("Error watching games path: " + stringifyError(e));
        }
    });
})();
