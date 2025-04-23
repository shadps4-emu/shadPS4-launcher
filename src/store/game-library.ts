import { convertFileSrc } from "@tauri-apps/api/core";
import { basename, join, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, watch } from "@tauri-apps/plugin-fs";
import { type Atom, atom } from "jotai";
import { toast } from "sonner";
import { type PSF, readPsf } from "@/lib/native/psf";
import { stringifyError } from "@/utils/error";
import { atomKeepLast } from "@/utils/jotai/atom-keep-last";
import { defaultStore } from ".";
import { atomGamesPath } from "./paths";

export type GameEntryData = {
    cusa: string;
    cover: string | null;
    title: string;
    version: string;
    fw_version: string;
    sfo: PSF | null;
};
export type GameEntry = {
    path: string;
    data: Atom<Promise<GameEntryData | Error>>;
};

const atomGameLibraryRaw = atom<GameEntry[]>([]);

export const atomGameLibrary = atomKeepLast(atomGameLibraryRaw);

async function loadGameData(path: string): Promise<GameEntryData | Error> {
    try {
        const base = await basename(path);

        const paramSfo = await join(path, "sce_sys", "param.sfo");

        if (!(await exists(paramSfo))) {
            return {
                cusa: "N/A - " + base,
                title: base,
                cover: null,
                version: "N/A",
                fw_version: "N/A",
                sfo: null,
            };
        }

        const sfo = await readPsf(paramSfo);
        const e = sfo.entries;

        let cover: string | null = await join(path, "sce_sys", "icon0.png");
        if (!(await exists(cover))) {
            cover = null;
        } else {
            cover = convertFileSrc(cover);
        }

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
            cusa: e.TITLE_ID?.Text || base,
            title: e.TITLE?.Text || "Unknown",
            cover,
            version: e.APP_VER?.Text || "UNK",
            fw_version: fw_version || "UNK",
            sfo,
        };
    } catch (e: unknown) {
        console.error(`could not read game info at: "${path}"`, e);
        return Error(`game read info. ${stringifyError(e)}`, {
            cause: e,
        });
    }
}

async function registerGamePath(path: string) {
    const s = sep();
    defaultStore.set(atomGameLibraryRaw, (prev) =>
        prev
            .filter((e) => e.path !== path)
            .concat({
                path,
                data: atom(async () => {
                    return await loadGameData(path);
                }),
            })
            .sort(
                (a, b) =>
                    a.path
                        .split(s)
                        .pop()
                        ?.localeCompare(b.path.split(s).pop() ?? "") ?? 0,
            ),
    );
}

async function unregisterGamePathPrefix(pathPrefix: string) {
    defaultStore.set(atomGameLibraryRaw, (prev) =>
        prev.filter((e) => !e.path.startsWith(pathPrefix)),
    );
}

async function isGame(path: string) {
    const eBootPath = await join(path, "eboot.bin");
    return await exists(eBootPath);
}

async function scanDirectory(
    path: string,
    signal: AbortSignal,
    recursionLevel: number,
) {
    if (recursionLevel > 3 || signal.aborted) {
        return;
    }
    try {
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
                setTimeout(
                    () => scanDirectory(childPath, signal, recursionLevel + 1),
                    1,
                );
            }
        }
    } catch (e: unknown) {
        console.error(`Error discovering game at "${path}"`, e);
    }
}

(() => {
    let cancel: (() => void) | undefined;
    defaultStore.sub(atomGamesPath, async () => {
        cancel?.();
        cancel = undefined;

        try {
            defaultStore.set(atomGameLibraryRaw, []);
            const path = defaultStore.get(atomGamesPath);
            if (path) {
                if (!(await exists(path))) {
                    await mkdir(path, { recursive: true });
                }
                const { abort, signal } = new AbortController();
                scanDirectory(path, signal, 0);
                const unsub = await watch(path, async (e) => {
                    if (typeof e.type === "object") {
                        if ("create" in e.type) {
                            const newPath = e.paths[0];
                            if (newPath && (await stat(newPath)).isDirectory) {
                                scanDirectory(newPath, signal, 1);
                            }
                        } else if ("remove" in e.type) {
                            const newPath = e.paths[0];
                            if (newPath) {
                                unregisterGamePathPrefix(newPath);
                            }
                        }
                    }
                });
                cancel = () => {
                    unsub();
                    abort();
                };
            }
        } catch (e: unknown) {
            console.error("error watching path", stringifyError(e));
            toast.error("Error watching games path: " + stringifyError(e));
        }
    });
})();
