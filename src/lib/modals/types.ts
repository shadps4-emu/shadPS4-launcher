import type { GameEntry } from "@/store/db";
import type { GameProcessState } from "@/store/running-games";

/** Where a modal is shown. Default is always `panel`. */
export type OpenMode = "panel" | "window";

/**
 * Params required to open each modal by id.
 * `undefined` means the modal takes no params.
 */
export type ModalParamsById = {
    "emu-config": undefined;
    "folder-config": undefined;
    "version-manager": undefined;
    "game-details": { gameData: GameEntry };
    "cheats-and-patches": { gameData: GameEntry };
    /** Live process state — panel only (not serializable across windows). */
    "running-game": { runningGame: GameProcessState };
};

export type ModalId = keyof ModalParamsById;

/** Modals whose params can cross the window boundary (JSON via SuperJSON). */
export type WindowableModalId = Exclude<ModalId, "running-game">;

export const WINDOWABLE_MODAL_IDS = new Set<WindowableModalId>([
    "emu-config",
    "folder-config",
    "version-manager",
    "game-details",
    "cheats-and-patches",
]);

export function isWindowableModalId(id: ModalId): id is WindowableModalId {
    return WINDOWABLE_MODAL_IDS.has(id as WindowableModalId);
}

export type OpenModalRequest<I extends ModalId = ModalId> = {
    id: I;
    mode?: I extends WindowableModalId ? OpenMode : "panel";
} & ([ModalParamsById[I]] extends [undefined]
    ? { params?: undefined }
    : { params: ModalParamsById[I] });
