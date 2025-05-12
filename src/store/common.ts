import type { Update } from "@tauri-apps/plugin-updater";
import { atom } from "jotai";
import type { GameRow } from "./db";

export const oficialRepo = "shadps4-emu/shadPS4";

export const atomFolderConfigModalIsOpen = atom<boolean>(false);

export const atomDownloadingOverlay = atom<
    | ({
          message?: string;
      } & (
          | { percent: number }
          | { progress: number; total?: number; format?: "data" }
          | { progress: "infinity" }
      ))
    | null
>(null);

export const atomUpdateAvailable = atom<Update | null>(null);

export const atomShowingGameDetails = atom<GameRow | null>(null);
