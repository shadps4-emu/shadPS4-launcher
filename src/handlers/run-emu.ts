import { dirname, join } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { GameProcess } from "@/lib/native/game-process";
import { stringifyError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import {
    atomAvailablePatches,
    atomPatchRepoEnabledByGame,
} from "@/store/cheats-and-patches";
import type { GameEntry } from "@/store/db";
import { atomEmuUserPath, atomPatchPath } from "@/store/paths";
import { addRunningGame, type RunningGame } from "@/store/running-games";
import { atomSelectedVersion } from "@/store/version-manager";

export async function startGame(
    store: JotaiStore,
    game: GameEntry,
): Promise<RunningGame | null> {
    const emu = store.get(atomSelectedVersion);
    if (!emu) {
        toast.warning("No emulator selected");
        return null;
    }

    const userBaseDir = store.get(atomEmuUserPath);

    const gameDir = game.path;
    const gameBinary = await join(gameDir, "eboot.bin");
    if (!(await exists(gameBinary))) {
        const msg = "Game binary (eboot.bin) not found";
        toast.error(msg);
        console.warn(msg);
        return null;
    }

    if (!(await exists(emu.path))) {
        const msg = "Emulator binary not found";
        toast.error(msg);
        console.warn(msg);
        return null;
    }

    const workDir =
        typeof userBaseDir === "string" ? userBaseDir : await dirname(emu.path);

    const userDir = await join(workDir, "user");
    if (!(await exists(userDir))) {
        await mkdir(userDir, { recursive: true });
    }

    let patchFile: string | undefined;
    const enabledRepo = store.get(atomPatchRepoEnabledByGame)[game.cusa];
    if (enabledRepo) {
        const availablePatches = store.get(atomAvailablePatches);
        patchFile = availablePatches[enabledRepo]?.[game.cusa];
        if (patchFile) {
            const patchFolder = await store.get(atomPatchPath);
            patchFile = await join(patchFolder, enabledRepo, patchFile);
        }
    }

    const args = [gameBinary];

    if (patchFile) {
        args.push("-p", patchFile);
    }

    try {
        const process = await GameProcess.startGame(emu.path, workDir, args);
        const r = addRunningGame(game, process);
        toast.success("Game started");
        return r;
    } catch (e) {
        const msg = `Couldn't start the game: ${stringifyError(e)}`;
        console.error(msg);
        toast.error(msg);
        return null;
    }
}
