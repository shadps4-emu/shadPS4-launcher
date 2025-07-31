import { dirname, join } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { ok, safeTry } from "neverthrow";
import { toast } from "sonner";
import { GameProcess } from "@/lib/native/game-process";
import { withTimeout } from "@/lib/nt/timeout";
import { errWarning, stringifyError, WarningError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import {
    atomAvailablePatches,
    atomPatchRepoEnabledByGame,
} from "@/store/cheats-and-patches";
import type { GameEntry } from "@/store/db";
import { atomEmuUserPath, atomPatchPath } from "@/store/paths";
import {
    createGameProcesState,
    type GameProcessState,
    removeRunningGame,
} from "@/store/running-games";
import { atomSelectedVersion } from "@/store/version-manager";
import { handleGameProcess } from "./game-process";

export async function startGame(
    store: JotaiStore,
    game: GameEntry,
): Promise<GameProcessState | null> {
    const result = await safeTry(async function* () {
        const emu = store.get(atomSelectedVersion);
        if (!emu) {
            return errWarning("No emulator selected");
        }

        const userBaseDir = store.get(atomEmuUserPath);

        const gameDir = game.path;
        const gameBinary = await join(gameDir, "eboot.bin");
        if (!(await exists(gameBinary))) {
            return errWarning("Game binary (eboot.bin) not found");
        }

        if (!(await exists(emu.path))) {
            return errWarning("Emulator binary not found");
        }

        const workDir =
            typeof userBaseDir === "string"
                ? userBaseDir
                : await dirname(emu.path);

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

        const args = [];

        if (patchFile) {
            args.push("-p", patchFile);
        }

        args.push(gameBinary);

        const process = yield* await GameProcess.startGame(
            emu.path,
            workDir,
            args,
        );

        const state = createGameProcesState(game, process, store);

        const { onEmuRun } = handleGameProcess(state);
        // FIXME Remove this 1e6
        yield* await withTimeout(onEmuRun, 5000 * 1e6).orTee(() => {
            removeRunningGame(state);
        });

        if (state.hasIpc) {
            // TODO Send Memory Patches here

            process.send("START");
        }

        toast.info("Game started");

        return ok(state);
    });

    if (result.isErr()) {
        const err = result.error;
        if (err instanceof WarningError) {
            toast.warning(err.message);
            console.warn(err.message);
        } else {
            const msg = `Couldn't start the game: ${stringifyError(err)}`;
            toast.error(msg);
            console.error("Couldn't start the game:", err);
        }
        return null;
    }

    return result.value;
}
