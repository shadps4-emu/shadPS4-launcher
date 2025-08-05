import { atom } from "jotai";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import type { CUSA, CUSAVersion } from "./common";
import type { GameEntry } from "./db";

export const atomShowingGameCheatAndPatch = atom<GameEntry | null>(null);

// Patches ----------------------------------

export const patchRepositories = ["shadPS4", "GoldHEN"] as const;

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

// Cheats -----------------------------------

export const cheatRepositories = ["shadPS4", "GoldHEN"] as const;

export type CheatRepository = (typeof cheatRepositories)[number];

export type CheatEnabledByGame = Partial<
    Record<CUSAVersion, Partial<Record<CheatRepository, string[]>>> // resolves to CUSA_version, Repo, Mod name
>;

export const atomCheatsEnabled = atomWithTauriStore<CheatEnabledByGame>(
    "cheats.json",
    "enabled",
    {
        initialValue: {},
    },
);

export type CheatFileMod = {
    name: string;
    hint: boolean | null;
    type: string;
    memory: {
        offset: string;
        on: string;
        off: string;
    }[];
};

export type CheatFileFormat = {
    name: string;
    id: CUSA; // CUSA
    version: string;
    process: string;
    credits: string[];
    mods: CheatFileMod[];
};
