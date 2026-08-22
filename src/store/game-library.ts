import { atom } from "jotai";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import type { GameEntry } from "./db";

export enum SortType {
    NONE = "None",
    TITLE = "Title",
    CUSA = "CUSA",
}

export const atomGameLibrarySorting = atomWithTauriStore<SortType>(
    "config.json",
    "game_library_sort",
    { initialValue: SortType.NONE },
);

export const atomGameLibraryIsIndexing = atom(false);
export const atomGameLibrary = atom<GameEntry[]>([]);
