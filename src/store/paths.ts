import { join, appDataDir as pAppDataDir } from "@tauri-apps/api/path";
import { atom } from "jotai";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";

const appDataDir = pAppDataDir();

export const atomGamesPath = atomWithTauriStore("config.json", "games_path", {
    initialValue: "",
    queryInitialValue: async () => join(await appDataDir, "games"),
});

export const atomEmuInstallsPath = atomWithTauriStore(
    "config.json",
    "version_installs",
    {
        initialValue: "",
        queryInitialValue: async () => join(await appDataDir, "versions"),
    },
);

/**
 * `true` to use emulator binary path
 */
export const atomEmuUserPath = atomWithTauriStore<true | string>(
    "config.json",
    "user_path",
    {
        initialValue: "",
        queryInitialValue: async () => join(await appDataDir, "emu_data"),
    },
);

export const atomPatchPath = atom(async () =>
    join(await appDataDir, "patches"),
);

export const atomCheatPath = atom(async () => join(await appDataDir, "cheats"));
