import { dirname, join } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { ResultAsync } from "neverthrow";
import { resolveMods } from "@/lib/mod-repository";
import { WarningError } from "@/lib/utils/error";
import { isZarPath } from "@/lib/utils/game-path";
import type { JotaiStore } from "@/store";
import {
    atomAvailablePatches,
    atomPatchRepoEnabledByGame,
    type CheatFileMod,
} from "@/store/cheats-and-patches";
import type { CUSAVersion } from "@/store/common";
import type { GameEntry } from "@/store/db";
import { atomEmuUserPath, atomPatchPath } from "@/store/paths";
import { atomSelectedVersion } from "@/store/version-manager";

export type LaunchOptions = {
    overrideExe?: string;
    overrideWorkDir?: string;
    overrideArgs?: string[];
};

export type LaunchConfig = {
    emuPath: string;
    workDir: string;
    gameBinary: string;
    args: string[];
    cheatMods: CheatFileMod[];
};

async function resolveLaunchConfigInner(
    store: JotaiStore,
    game: GameEntry,
    options: LaunchOptions,
): Promise<LaunchConfig> {
    const gameKey: CUSAVersion = `${game.cusa}_${game.version}`;

    const emu = options.overrideExe ?? store.get(atomSelectedVersion)?.path;
    if (!emu) {
        throw new WarningError("No emulator selected");
    }

    const gameDir = game.path;
    const gameBinary = isZarPath(gameDir)
        ? gameDir
        : await join(gameDir, "eboot.bin");
    if (!(await exists(gameBinary))) {
        throw new WarningError(
            isZarPath(gameDir)
                ? "Game archive (.zar) not found"
                : "Game binary (eboot.bin) not found",
        );
    }

    if (!(await exists(emu))) {
        throw new WarningError("Emulator binary not found");
    }

    const userBaseDir = store.get(atomEmuUserPath);
    const workDir =
        options.overrideWorkDir ??
        (typeof userBaseDir === "string" ? userBaseDir : await dirname(emu));

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

    const args: string[] = [];
    if (options.overrideArgs != null) {
        args.push(...options.overrideArgs);
    } else {
        if (patchFile) {
            args.push("-p", patchFile);
        }
        args.push(gameBinary);
    }

    const cheatMods = await resolveMods(gameKey, store);

    return {
        emuPath: emu,
        workDir,
        gameBinary,
        args,
        cheatMods,
    };
}

export function resolveLaunchConfig(
    store: JotaiStore,
    game: GameEntry,
    options: LaunchOptions = {},
): ResultAsync<LaunchConfig, WarningError> {
    return ResultAsync.fromPromise(
        resolveLaunchConfigInner(store, game, options),
        (err) =>
            err instanceof WarningError ? err : new WarningError(String(err)),
    );
}
