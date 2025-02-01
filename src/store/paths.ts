import { appDataDir, join } from "@tauri-apps/api/path";
import { atomWithTauriStore } from "./store";

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
