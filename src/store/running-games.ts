import { type Atom, atom } from "jotai";
import type { GameProcess } from "@/lib/native/game-process";
import { defaultStore } from ".";
import type { GameRow } from "./db";

export type Log = {
    entries: LogEntry[];
};

export type LogEntry = {
    time: Date;
    message: string;
};

export type RunningGame = {
    game: GameRow;
    process: GameProcess;
    atomRunning: Atom<true | number>;
    atomError: Atom<string | null>;
    atomLog: Atom<Log>;
};

export const atomRunningGames = atom<RunningGame[]>([]);
export const atomShowingRunningGame = atom<RunningGame | null>(null);

export function addRunningGame(
    game: GameRow,
    process: GameProcess,
): RunningGame {
    const atomRunning = atom<true | number>(true);
    const atomError = atom<string | null>(null);
    const atomLog = atom<Log>({ entries: [] });

    const runningGame = {
        game: game,
        process: process,
        atomRunning,
        atomError,
        atomLog,
    } satisfies RunningGame;

    defaultStore.set(atomRunningGames, (prev) => [...prev, runningGame]);

    process.onMessage = (ev) => {
        switch (ev.event) {
            case "logLine":
            case "errLogLine":
                {
                    defaultStore.set(atomLog, ({ entries }) => {
                        entries.push({
                            time: new Date(),
                            message: ev.line,
                        });
                        return {
                            entries,
                        };
                    });
                }
                break;
            case "gameExit":
                defaultStore.set(atomRunning, ev.status);
                break;
            case "iOError":
                defaultStore.set(atomError, ev.err);
                break;
        }
    };

    return runningGame;
}

export function removeRunningGame(runningGame: RunningGame) {
    delete (runningGame as Partial<RunningGame>).atomLog;
    delete (runningGame as Partial<RunningGame>).process;
    defaultStore.set(atomRunningGames, (prev) =>
        prev.filter((e) => e !== runningGame),
    );
}
