import type { ReactNode } from "react";
import { CheatAndPatchesModal } from "@/components/modals/cheats-and-patches-modal";
import { EmuConfigModal } from "@/components/modals/emu-config-modal";
import { FolderConfigModal } from "@/components/modals/folder-config-modal";
import { GameDetailsModal } from "@/components/modals/game-details-modal";
import { InputBindingsModal } from "@/components/modals/input-bindings-modal";
import { RunningGameModal } from "@/components/modals/running-game-modal";
import { VersionManagerModal } from "@/components/modals/version-manager-modal";
import type { ModalId, ModalParamsById } from "./types";

type ModalEntry<I extends ModalId> = {
    title: string;
    width: number;
    height: number;
    render: (params: ModalParamsById[I]) => ReactNode;
};

function defineModals<T extends { [I in ModalId]: ModalEntry<I> }>(
    registry: T,
) {
    return registry;
}

export const modalRegistry = defineModals({
    "emu-config": {
        title: "Emulator Settings",
        width: 960,
        height: 720,
        render: () => <EmuConfigModal />,
    },
    "input-bindings": {
        title: "Input Bindings",
        width: 1024,
        height: 780,
        render: () => <InputBindingsModal />,
    },
    "folder-config": {
        title: "Folder Settings",
        width: 560,
        height: 420,
        render: () => <FolderConfigModal />,
    },
    "version-manager": {
        title: "Version Manager",
        width: 720,
        height: 640,
        render: () => <VersionManagerModal />,
    },
    "game-details": {
        title: "Game Details",
        width: 900,
        height: 700,
        render: (params) => <GameDetailsModal gameData={params.gameData} />,
    },
    "cheats-and-patches": {
        title: "Cheats & Patches",
        width: 900,
        height: 700,
        render: (params) => <CheatAndPatchesModal gameData={params.gameData} />,
    },
    "running-game": {
        title: "Running Game",
        width: 900,
        height: 700,
        render: (params) => (
            <RunningGameModal runningGame={params.runningGame} />
        ),
    },
});

export function renderModal<I extends ModalId>(
    id: I,
    params: ModalParamsById[I],
): ReactNode {
    const render = modalRegistry[id].render as (
        p: ModalParamsById[I],
    ) => ReactNode;
    return render(params);
}
