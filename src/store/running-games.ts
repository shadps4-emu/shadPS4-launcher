import { type Atom, atom, type PrimitiveAtom } from "jotai";
import type { GameProcess, LogEntry } from "@/lib/native/game-process";
import type { Callback } from "@/lib/utils/types";
import { defaultStore } from ".";
import type { GameRow } from "./db";

export type RunningGame = {
    game: GameRow;
    process: GameProcess;
    atomRunning: Atom<true | number>; // true or exit code
    atomError: Atom<string | null>;
    log: {
        atomCount: Atom<number>;
        atomCallback: PrimitiveAtom<Callback<LogEntry>[]>;
    };
};

export const atomRunningGames = atom<RunningGame[]>([]);
export const atomShowingRunningGame = atom<RunningGame | null>(null);

export function addRunningGame(
    game: GameRow,
    process: GameProcess,
): RunningGame {
    const store = defaultStore;

    const atomRunning = atom<true | number>(true);
    const atomError = atom<string | null>(null);
    const atomLogCount = atom(0);
    const atomLogCallback = atom<Callback<LogEntry>[]>([]);

    const runningGame = {
        game: game,
        process: process,
        atomRunning,
        atomError,
        log: {
            atomCount: atomLogCount,
            atomCallback: atomLogCallback,
        },
    } satisfies RunningGame;

    store.set(atomRunningGames, (prev) => [...prev, runningGame]);

    process.onMessage = (ev) => {
        switch (ev.event) {
            case "log":
                store.set(atomLogCount, ev.rowId + 1);
                for (const c of store.get(atomLogCallback)) {
                    c(ev);
                }
                break;
            case "gameExit":
                store.set(atomRunning, ev.status);
                break;
            case "iOError":
                store.set(atomError, ev.err);
                break;
            default: {
                // exaustive switch
                const a: never = ev;
                return a;
            }
        }
    };

    return runningGame;
}

export function removeRunningGame(runningGame: RunningGame) {
    runningGame.process.delete();
    delete (runningGame as Partial<RunningGame>).log;
    delete (runningGame as Partial<RunningGame>).process;
    defaultStore.set(atomRunningGames, (prev) =>
        prev.filter((e) => e !== runningGame),
    );
}
