import { join, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat, watch } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { inspectGameEntry } from "@/lib/game-metadata";
import { stringifyError } from "@/lib/utils/error";
import { isZarPath } from "@/lib/utils/game-path";
import type { Callback } from "@/lib/utils/types";
import type { JotaiStore } from "@/store";
import { db } from "@/store/db";
import {
    atomGameLibrary,
    atomGameLibraryIsIndexing,
} from "@/store/game-library";

export type GameLibraryIndexer = {
    stop: () => Promise<void>;
};

export function startGameLibraryIndexer(
    store: JotaiStore,
    listenGamesPath: (callback: Callback<[string]>) => Callback,
): GameLibraryIndexer {
    const gameRegisterQueue: string[] = [];
    let gameRegisterQueueIsUse = false;
    const knownPaths = new Set<string>();
    let pathUnsub: Callback | undefined;
    let cancelWatch: (() => Promise<void>) | undefined;

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
            let gameData = await inspectGameEntry(path);
            if (gameData.id === -1) {
                if (!("error" in gameData)) {
                    gameData = await db.addGame(gameData);
                }
                knownPaths.add(path);
                store.set(atomGameLibrary, (prev) =>
                    prev.filter((e) => e.path !== path).concat(gameData),
                );
            }
        }
        gameRegisterQueueIsUse = false;
    }

    function unregisterGamePathPrefix(pathPrefix: string) {
        store.set(atomGameLibrary, (prev) =>
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
        unknownPaths: Set<string>,
        signal: AbortSignal,
        recursionLevel: number,
    ) {
        try {
            if (recursionLevel > 3 || signal.aborted) {
                return;
            }
            if (knownPaths.has(path)) {
                unknownPaths.delete(path);
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
                        unknownPaths,
                        signal,
                        recursionLevel + 1,
                    );
                } else if (c.isFile && isZarPath(c.name)) {
                    const childPath = await join(path, c.name);
                    if (knownPaths.has(childPath)) {
                        unknownPaths.delete(childPath);
                    } else {
                        void registerGamePath(childPath);
                    }
                }
            }
        } catch (e: unknown) {
            console.error(`Error discovering game at "${path}"`, e);
        }
    }

    let prevPath: string | null = null;

    const onChange = (path: string) => {
        const c = cancelWatch;
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
                    prevPath = path;
                    store.set(atomGameLibraryIsIndexing, true);
                    store.set(atomGameLibrary, []);
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
                    const unknownPaths = new Set<string>(knownPaths);
                    await scanDirectory(path, unknownPaths, signal, 0);
                    if (signal.aborted) {
                        return;
                    }
                    unknownPaths.forEach((p) => {
                        unregisterGamePathPrefix(p);
                    });
                    unsub = await watch(path, async (e) => {
                        if (typeof e.type === "object") {
                            if ("create" in e.type) {
                                const newPath = e.paths[0];
                                if (!newPath) {
                                    return;
                                }
                                const newPathStat = await stat(newPath);
                                if (newPathStat.isDirectory) {
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
                                    store.set(atomGameLibraryIsIndexing, true);
                                    await scanDirectory(
                                        newPath,
                                        new Set<string>(),
                                        signal,
                                        1,
                                    );
                                    store.set(atomGameLibraryIsIndexing, false);
                                } else if (
                                    newPathStat.isFile &&
                                    isZarPath(newPath)
                                ) {
                                    store.set(atomGameLibraryIsIndexing, true);
                                    await registerGamePath(newPath);
                                    store.set(atomGameLibraryIsIndexing, false);
                                }
                            } else if ("remove" in e.type) {
                                const newPath = e.paths[0];
                                if (newPath) {
                                    unregisterGamePathPrefix(newPath);
                                }
                            }
                        }
                    });
                    store.set(atomGameLibraryIsIndexing, false);
                }
            } catch (e: unknown) {
                console.error("error watching path", stringifyError(e));
                toast.error(`Error watching games path: ${stringifyError(e)}`);
            }
        })();
        cancelWatch = () => {
            abortController.abort();
            unsub?.();
            return prom;
        };
    };

    void (async () => {
        const cachedGames = await db.listGames();
        store.set(atomGameLibrary, cachedGames);
        for (const e of cachedGames) {
            knownPaths.add(e.path);
        }
    })();

    pathUnsub = listenGamesPath(onChange);

    return {
        stop: async () => {
            pathUnsub?.();
            if (cancelWatch) {
                await cancelWatch();
            }
        },
    };
}
