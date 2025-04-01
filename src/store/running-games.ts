import { type Atom, atom } from "jotai";
import type { GameProcess } from "@/lib/native/game-process";
import { defaultStore } from ".";
import type { GameEntry } from "./game-library";

export type Log = {
    entries: LogEntry[];
};

export type LogEntry = {
    time: Date;
    message: string;
};

export type RunningGame = {
    game: GameEntry;
    process: GameProcess;
    atomRunning: Atom<true | number>;
    atomError: Atom<string | null>;
    atomLog: Atom<Log>;
};

export const atomRunningGames = atom<Atom<RunningGame>[]>([]);

export const addRunningGame = (game: GameEntry, process: GameProcess) => {
    const atomRunning = atom<true | number>(true);
    const atomError = atom<string | null>(null);
    const atomLog = atom<Log>({ entries: [] });

    defaultStore.set(atomRunningGames, (prev) => [
        ...prev,
        atom({
            game: game,
            process: process,
            atomRunning,
            atomError,
            atomLog,
        }),
    ]);

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
};
