import { atom, type PrimitiveAtom } from "jotai";
import type { GameProcess, LogEntry } from "@/lib/native/game-process";
import type { Callback } from "@/lib/utils/types";
import { defaultStore, type JotaiStore } from ".";
import type { GameEntry } from "./db";

export type Capabilities = "ENABLE_MEMORY_PATCH";

export type GameProcessState = {
    game: GameEntry;
    process: GameProcess;
    hasIpc: boolean;
    atomRunning: PrimitiveAtom<true | number>; // true or exit code
    atomError: PrimitiveAtom<string | null>;
    log: {
        atomCallback: PrimitiveAtom<Callback<[LogEntry]>[]>;
        atomClassList: PrimitiveAtom<string[]>;
    };
    atomCapabilities: PrimitiveAtom<Capabilities[]>;
};

export const atomRunningGames = atom<GameProcessState[]>([]);
export const atomShowingRunningGame = atom<GameProcessState | null>(null);

export function createGameProcesState(
    game: GameEntry,
    process: GameProcess,
    store: JotaiStore = defaultStore,
): GameProcessState {
    const atomRunning = atom<true | number>(true);
    const atomError = atom<string | null>(null);
    const atomLogCallback = atom<Callback<[LogEntry]>[]>([]);
    const atomLogClassList = atom<string[]>(["STDERR"]);
    const atomCapabilities = atom<Capabilities[]>([]);

    const runningGame = {
        game: game,
        process: process,
        hasIpc: false,
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

export function removeRunningGame(state: GameProcessState) {
    state.process.delete();
    delete (state as Partial<GameProcessState>).log;
    delete (state as Partial<GameProcessState>).process;
    defaultStore.set(atomRunningGames, (prev) =>
        prev.filter((e) => e !== state),
    );
}
