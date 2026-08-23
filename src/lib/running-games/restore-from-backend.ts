import { basename, dirname } from "@tauri-apps/api/path";
import { toast } from "sonner";
import { connectEmulatorIpc } from "@/lib/emulator-ipc";
import { launch } from "@/lib/game-launch";
import {
    GameProcess,
    type RunningProcessInfo,
} from "@/lib/native/game-process";
import { stringifyError } from "@/lib/utils/error";
import { isZarPath } from "@/lib/utils/game-path";
import type { JotaiStore } from "@/store";
import type { Version } from "@/store/common";
import { type GameEntry, isSameGame } from "@/store/db";
import { atomGameLibrary } from "@/store/game-library";
import {
    atomRunningGames,
    type Capabilities,
    createGameProcesState,
    type GameProcessState,
} from "@/store/running-games";

function resolveGameBinaryFromArgs(args: string[]): string | undefined {
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-p") {
            i++;
            continue;
        }
        return args[i];
    }
    return undefined;
}

function normalizePath(path: string): string {
    return path.replace(/\\/g, "/").toLowerCase();
}

function matchesGameBinary(game: GameEntry, gameBinary: string): boolean {
    const normalizedBinary = normalizePath(gameBinary);
    const normalizedPath = normalizePath(game.path);

    if (isZarPath(game.path)) {
        return normalizedBinary === normalizedPath;
    }

    if (normalizedBinary === normalizedPath) {
        return true;
    }

    return (
        normalizedBinary.endsWith("/eboot.bin") &&
        normalizedBinary.startsWith(`${normalizedPath}/`)
    );
}

function matchGameFromProcess(
    library: GameEntry[],
    info: RunningProcessInfo,
): GameEntry | undefined {
    const gameBinary = resolveGameBinaryFromArgs(info.args);
    if (!gameBinary) {
        return undefined;
    }

    return library.find((game) => matchesGameBinary(game, gameBinary));
}

async function fallbackGameEntry(info: RunningProcessInfo): Promise<GameEntry> {
    const gameBinary = resolveGameBinaryFromArgs(info.args) ?? info.exe;
    const path = isZarPath(gameBinary) ? gameBinary : await dirname(gameBinary);

    return {
        id: -1,
        path,
        cusa: "N/A",
        title: await basename(path),
        version: "N/A" as Version,
        fw_version: "",
        sfo: null,
    };
}

function isPidAlreadyTracked(store: JotaiStore, pid: number): boolean {
    return store.get(atomRunningGames).some((state) => {
        return store.get(state.atomProcess).pid === pid;
    });
}

function createRestartHandler(
    store: JotaiStore,
    state: GameProcessState,
    game: GameEntry,
) {
    return (overrideArgs: string[]) => {
        const currentProcess = store.get(state.atomProcess);
        launch(store, game, {
            existingState: state,
            overrideExe: currentProcess.exe,
            overrideWorkDir: currentProcess.workingDir,
            overrideArgs,
        })
            .catch((e: unknown) => {
                console.error("Unknown restart error", e);
                toast.error(`Unknown restart error: ${stringifyError(e)}`);
                store.set(state.atomRunning, -1);
                store.set(state.atomError, stringifyError(e));
            })
            .finally(() => {
                currentProcess.kill();
                currentProcess.delete();
            });
    };
}

async function restoreSingleProcess(
    store: JotaiStore,
    info: RunningProcessInfo,
    library: GameEntry[],
): Promise<void> {
    if (isPidAlreadyTracked(store, info.pid)) {
        return;
    }

    const process = (await GameProcess.attach(info)).match(
        (p) => p,
        (err) => {
            console.warn(
                `Could not attach to running process pid=${info.pid}:`,
                err,
            );
            return null;
        },
    );

    if (!process) {
        return;
    }

    const game =
        matchGameFromProcess(library, info) ?? (await fallbackGameEntry(info));

    const state = createGameProcesState(game, process, store);

    const existingLog = await process
        .getLog()
        .catch(() => [] as Awaited<ReturnType<typeof process.getLog>>);
    if (existingLog.length > 0) {
        const classes = [...new Set(existingLog.map((entry) => entry.class))];
        store.set(state.log.atomClassList, classes);
    }

    connectEmulatorIpc(
        process,
        state,
        store,
        createRestartHandler(store, state, game),
        {
            reconnected: true,
            ipcReady: info.ipcReady,
            capabilities: info.capabilities as Capabilities[],
        },
    );
}

export async function restoreRunningGamesFromBackend(
    store: JotaiStore,
): Promise<void> {
    const processes = (await GameProcess.listRunning()).match(
        (entries) => entries,
        (err) => {
            console.warn("Could not list running emulator processes:", err);
            return [];
        },
    );

    if (processes.length === 0) {
        return;
    }

    const library = store.get(atomGameLibrary);

    for (const info of processes) {
        await restoreSingleProcess(store, info, library);
    }

    store.set(atomRunningGames, (current) => {
        const seenGames: GameEntry[] = [];
        return current.filter((state) => {
            const duplicate = seenGames.some((game) =>
                isSameGame(game, state.game),
            );
            if (!duplicate) {
                seenGames.push(state.game);
            }
            return !duplicate;
        });
    });
}
