import { convertFileSrc } from "@tauri-apps/api/core";
import { BaseDirectory, basename, join } from "@tauri-apps/api/path";
import {
    exists,
    mkdir,
    readDir,
    readTextFile,
    watch,
} from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import { toast } from "sonner";
import { type PSF, readPsf } from "@/lib/native/psf";
import { stringifyError } from "@/utils/error";
import { atomKeepLast } from "@/utils/jotai/atom-keep-last";
import { defaultStore, type JotaiStore } from ".";
import { atomGamesPath } from "./paths";

export interface GameEntry {
    path: string;
    id: string;
    title: string;
    cover: string | null;
    version: string;
    fw_version: string;
    sfo?: PSF;
}

const atomGameLibraryRefresh = atom(0);
export const atomGameLibraryRaw = atom(async (get) => {
    get(atomGameLibraryRefresh);
    if (import.meta.env.VITE_USE_MOCK) {
        await new Promise((resolve) => {
            // simulate some loading
            setTimeout(resolve, 1000);
        });
        const data = await readTextFile("mock/games.json", {
            baseDir: BaseDirectory.Resource,
        });

        return JSON.parse(data) as GameEntry[];
    }

    const knownPaths: string[] = [];

    async function isGame(path: string) {
        const paramSfoPath = await join(path, "sce_sys", "param.sfo");
        if (await exists(paramSfoPath)) {
            return true;
        }
        const eBootPath = await join(path, "eboot.bin");
        if (await exists(eBootPath)) {
            return true;
        }
        return false;
    }

    async function discoverGame(path: string, recursionLevel: number) {
        if (recursionLevel > 5) {
            return;
        }
        try {
            if (path.endsWith("-UPDATE") || path.endsWith("-patch")) {
                return;
            }
            if (await isGame(path)) {
                knownPaths.push(path);
                return;
            }
            void (await Promise.all(
                (
                    await readDir(path)
                ).map(async (child) => {
                    if (child.isDirectory) {
                        await discoverGame(
                            await join(path, child.name),
                            recursionLevel + 1,
                        );
                    }
                }),
            ));
        } catch (error) {
            console.error(`Error discovering game: ${path}. ${error}`);
        }
    }

    const v = get(atomGamesPath);
    if (!v || !(await exists(v))) {
        return [];
    }

    console.log("Refreshing game library");

    void (await discoverGame(v, 0));

    return await Promise.all(
        knownPaths.map(async (path): Promise<GameEntry | null> => {
            const b = await basename(path);

            const paramSfo = await join(path, "sce_sys", "param.sfo");

            if (!(await exists(paramSfo))) {
                return {
                    path,
                    id: "N/A - " + b,
                    title: b,
                    cover: null,
                    version: "N/A",
                    fw_version: "N/A",
                };
            }

            let sfo: PSF;
            try {
                sfo = await readPsf(paramSfo);
            } catch (e: unknown) {
                console.error(
                    "could not read sfo at:",
                    paramSfo,
                    stringifyError(e),
                );
                return null;
            }
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
                path,
                id: e.TITLE_ID?.Text || b,
                title: e.TITLE?.Text || "Unknown",
                cover,
                version: e.APP_VER?.Text || "UNK",
                fw_version: fw_version || "UNK",
                sfo,
            };
        }),
    ).then((e) => e.filter((e) => e != null));
});
export const atomGameLibrary = atomKeepLast(atomGameLibraryRaw);

export function refreshGameLibrary(s: JotaiStore) {
    s.set(atomGameLibraryRefresh, (prev) => prev + 1);
}

(() => {
    let unsub: (() => void) | undefined;
    defaultStore.sub(atomGamesPath, async () => {
        unsub?.();
        unsub = undefined;

        try {
            const path = defaultStore.get(atomGamesPath);
            if (path) {
                await mkdir(path, { recursive: true });
                unsub = await watch(path, (e) => {
                    if (typeof e.type === "object" && "access" in e.type) {
                        if (
                            e.type.access.kind === "open" &&
                            e.paths.length === 1 &&
                            e.paths[0] === path
                        ) {
                            return;
                        }
                    }
                    refreshGameLibrary(defaultStore);
                });
            }
        } catch (e: unknown) {
            console.error(e);
            toast.error("Error watching games path: " + stringifyError(e));
        }
    });
})();
