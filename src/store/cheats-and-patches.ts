import { atom } from "jotai";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import type { CUSA } from "./common";
import type { GameRow } from "./db";

export const atomShowingGameCheatAndPatch = atom<GameRow | null>(null);

export const patchRepositories = ["GoldHEN", "shadPS4"] as const;

export type PatchRepository = (typeof patchRepositories)[number];

export type PatchList = Partial<Record<CUSA, string>>; // CUSA -> File Path

export type PatchStore = Partial<Record<PatchRepository, PatchList>>;

export const atomAvailablePatches = atomWithTauriStore<PatchStore>(
    "patches.json",
    "store",
    {
        initialValue: {},
    },
);

export type PatchRepoEnabledByGame = Partial<Record<CUSA, PatchRepository>>;

export const atomPatchRepoEnabledByGame =
    atomWithTauriStore<PatchRepoEnabledByGame>("patches.json", "enabled_repo", {
        initialValue: {},
    });
