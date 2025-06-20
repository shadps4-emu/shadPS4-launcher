import { dirname, join } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { GameProcess } from "@/lib/native/game-process";
import { stringifyError } from "@/lib/utils/error";
import type { GameRow } from "@/store/db";
import { addRunningGame, type RunningGame } from "@/store/running-games";
import type { EmulatorVersion } from "@/store/version-manager";

export async function startGame(
    emu: EmulatorVersion,
    game: GameRow,
    userBaseDir: string | true,
): Promise<RunningGame | null> {
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

    try {
        const process = await GameProcess.startGame(
            emu.path,
            workDir,
            gameBinary,
        );
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
