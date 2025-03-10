import { atom } from "jotai";

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
