import type { Update } from "@tauri-apps/plugin-updater";
import { atom } from "jotai";
import type { GameEntry } from "./db";

export type CUSA = "N/A" | `N/A - ${string}` | `CUSA${string}`;

export type Version = "N/A" | `${number}.${number}`;

export type CUSAVersion = `${CUSA}_${Version}`;

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

export const atomShowingGameDetails = atom<GameEntry | null>(null);
