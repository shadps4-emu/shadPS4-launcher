import { atom, type PrimitiveAtom } from "jotai";
import type { GameProcess, LogEntry } from "@/lib/native/game-process";
import type { Callback } from "@/lib/utils/types";
import { defaultStore, type JotaiStore } from ".";
import { type GameEntry, isSameGame } from "./db";
import { atomGameLibrary } from "./game-library";
import { atomLaunchConflict } from "./launch-conflict";

export type Capabilities = "ENABLE_MEMORY_PATCH";

export type GameProcessState = {
    game: GameEntry;
    hasIpc: boolean;
    atomProcess: PrimitiveAtom<GameProcess>;
    atomRunning: PrimitiveAtom<true | number>; // true or exit code
    atomError: PrimitiveAtom<string | null>;
    log: {
        atomCallback: PrimitiveAtom<Callback<[LogEntry]>[]>;
        atomClassList: PrimitiveAtom<string[]>;
    };
    atomCapabilities: PrimitiveAtom<Capabilities[]>;
};

export const atomRunningGames = atom<GameProcessState[]>([]);

export function createGameProcesState(
    game: GameEntry,
    process: GameProcess,
    store: JotaiStore = defaultStore,
): GameProcessState {
    const atomProcess = atom(process);
    const atomRunning = atom<true | number>(true);
    const atomError = atom<string | null>(null);
    const atomLogCallback = atom<Callback<[LogEntry]>[]>([]);
    const atomLogClassList = atom<string[]>(["STDERR"]);
    const atomCapabilities = atom<Capabilities[]>([]);

    const runningGame = {
        game: game,
        hasIpc: false,
        atomProcess,
        atomRunning,
        atomError,
        log: {
            atomCallback: atomLogCallback,
            atomClassList: atomLogClassList,
        },
        atomCapabilities,
    } satisfies GameProcessState;

    store.set(atomRunningGames, (prev) => [...prev, runningGame]);

    return runningGame;
}

export function findActiveRunningGame(
    store: JotaiStore,
    game: GameEntry,
): GameProcessState | undefined {
    return store.get(atomRunningGames).find((state) => {
        if (store.get(state.atomRunning) !== true) {
            return false;
        }
        return isSameGame(state.game, game);
    });
}

export function findAnyActiveRunningGame(
    store: JotaiStore,
): GameProcessState | undefined {
    return store
        .get(atomRunningGames)
        .find((state) => store.get(state.atomRunning) === true);
}

export async function terminateRunningGame(
    state: GameProcessState,
    store: JotaiStore = defaultStore,
): Promise<void> {
    const process = store.get(state.atomProcess);
    await process.kill();
    removeRunningGame(state, store);
}

export function removeRunningGame(
    state: GameProcessState,
    store: JotaiStore = defaultStore,
) {
    store.get(state.atomProcess).delete();
    store.set(atomRunningGames, (prev) => prev.filter((e) => e !== state));

    delete (state as Partial<GameProcessState>).log;
    delete (state as Partial<GameProcessState>).atomProcess;
}

/** Closed = process no longer running (`atomRunning` holds exit code, not `true`). */
export function isRunningGameClosed(
    store: JotaiStore,
    state: GameProcessState,
): boolean {
    return store.get(state.atomRunning) !== true;
}

/**
 * When launching a new game, drop a lone stale toolbar entry whose process
 * has already exited (restore after reload, crash, or closed emulator window).
 */
export function removeSingleClosedRunningGameOnLaunch(
    store: JotaiStore,
    options: { excludeState?: GameProcessState } = {},
): void {
    const closedGames = store.get(atomRunningGames).filter((state) => {
        if (state === options.excludeState) {
            return false;
        }
        return isRunningGameClosed(store, state);
    });

    if (closedGames.length === 1) {
        const closedGame = closedGames[0];
        if (closedGame) {
            removeRunningGame(closedGame, store);
        }
    }
}

function findLibraryGame(
    library: GameEntry[],
    game: GameEntry,
): GameEntry | undefined {
    return library.find((entry) => isSameGame(entry, game));
}

export function reconcileRunningGamesWithLibrary(
    store: JotaiStore,
    library: GameEntry[],
): void {
    const runningGames = store.get(atomRunningGames);
    let runningGamesChanged = false;

    for (const state of runningGames) {
        const match = findLibraryGame(library, state.game);
        if (match && match !== state.game) {
            state.game = match;
            runningGamesChanged = true;
        }
    }

    if (runningGamesChanged) {
        store.set(atomRunningGames, [...runningGames]);
    }

    const conflict = store.get(atomLaunchConflict);
    if (!conflict) {
        return;
    }

    const game = findLibraryGame(library, conflict.game) ?? conflict.game;
    const runningGame =
        runningGames.find((state) => state === conflict.runningGame) ??
        runningGames.find((state) =>
            isSameGame(state.game, conflict.runningGame.game),
        ) ??
        conflict.runningGame;

    if (game !== conflict.game || runningGame !== conflict.runningGame) {
        store.set(atomLaunchConflict, {
            ...conflict,
            game,
            runningGame,
        });
    }
}

export function startRunningGamesSync(
    store: JotaiStore = defaultStore,
): Callback {
    return store.sub(atomGameLibrary, () => {
        reconcileRunningGamesWithLibrary(store, store.get(atomGameLibrary));
    });
}
