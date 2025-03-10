import { atomWithTauriStore } from "@/utils/jotai/tauri-store";
import { appDataDir, join } from "@tauri-apps/api/path";

export const atomGamesPath = atomWithTauriStore("config.json", "games_path", {
  onMount: async () => join(await appDataDir(), "games"),
});

export const atomEmuInstallsPath = atomWithTauriStore(
  "config.json",
  "version_installs",
  {
    onMount: async () => join(await appDataDir(), "versions"),
  },
);
