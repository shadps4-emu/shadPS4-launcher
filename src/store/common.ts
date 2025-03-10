import { atom } from "jotai";

export const oficialRepo = "shadps4-emu/shadPS4";

export const atomModalConfigIsOpen = atom<boolean>(false);

export const atomDownloadingOverlay = atom<
  | ({
      message?: string;
    } & (
      | { percent: number }
      | { progress: number; total?: number }
      | { progress: "infinity" }
    ))
  | null
>(null);
