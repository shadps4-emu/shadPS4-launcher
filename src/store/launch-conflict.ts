import { atom } from "jotai";
import type { GameEntry } from "./db";
import type { GameProcessState } from "./running-games";

export type SameGameConflict = {
    kind: "same";
    game: GameEntry;
    runningGame: GameProcessState;
};

export type DifferentGameConflict = {
    kind: "different";
    game: GameEntry;
    runningGame: GameProcessState;
    step: "prompt" | "confirm";
};

export type LaunchConflict = SameGameConflict | DifferentGameConflict;

export const atomLaunchConflict = atom<LaunchConflict | null>(null);
