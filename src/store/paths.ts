import { appDataDir, join } from "@tauri-apps/api/path";
import { type WritableAtom } from "jotai";
import { atomWithTauriStore } from "./store";

type watom<T> = WritableAtom<T, T[], void>;

interface PathPreferences {
  gamesPath: watom<string>;
}

export const PathPreferences: PathPreferences = Object.freeze({
  gamesPath: atomWithTauriStore("config.json", "games_path", "", async () =>
    join(await appDataDir(), "games"),
  ),
});
