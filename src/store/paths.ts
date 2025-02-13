import { atomWithTauriStore } from "@/utils/jotai/tauri-store";
import { appDataDir, join } from "@tauri-apps/api/path";

export const pathPreferences = Object.freeze({
  gamesPath: atomWithTauriStore("config.json", "games_path", "", async () =>
    join(await appDataDir(), "games"),
  ),
  emulatorPath: atomWithTauriStore(
    "config.json",
    "emulator_bin",
    "",
    async () => join(await appDataDir(), "bin", "shadps4.exe"),
  ),
});
