import { ok, safeTry } from "neverthrow";
import { toast } from "sonner";
import { connectEmulatorIpc } from "@/lib/emulator-ipc";
import { GameProcess } from "@/lib/native/game-process";
import { withTimeout } from "@/lib/nt/timeout";
import { errWarning, stringifyError, WarningError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import type { GameEntry } from "@/store/db";
import {
    createGameProcesState,
    type GameProcessState,
    removeRunningGame,
} from "@/store/running-games";
import {
    type LaunchConfig,
    type LaunchOptions,
    resolveLaunchConfig,
} from "./resolve-config";

type FullLaunchOptions = LaunchOptions & {
    existingState?: GameProcessState;
};

async function launchWithConfig(
    store: JotaiStore,
    game: GameEntry,
    config: LaunchConfig,
    options: FullLaunchOptions,
): Promise<GameProcessState | null> {
    const previousAtomProcess = options.existingState?.atomProcess;
    let existingProcess: GameProcess | null = null;
    if (previousAtomProcess) {
        existingProcess = store.get(previousAtomProcess);
    }

    const process = (
        await GameProcess.startGame(
            config.emuPath,
            config.workDir,
            config.args,
            existingProcess,
        )
    ).match(
        (p) => p,
        (err) => {
            throw err;
        },
    );

    const state =
        options.existingState ?? createGameProcesState(game, process, store);
    if (state === options.existingState) {
        store.set(state.atomProcess, process);
    }

    const handleRestart = (overrideArgs: string[]) => {
        const currentProcess = store.get(state.atomProcess);
        launch(store, game, {
            existingState: state,
            overrideExe: currentProcess.exe,
            overrideWorkDir: currentProcess.workingDir,
            overrideArgs,
        })
            .catch((e: unknown) => {
                console.error("Unknown restart error", e);
                toast.error(`Unknown restart error: ${stringifyError(e)}`);
                store.set(state.atomRunning, -1);
                store.set(state.atomError, stringifyError(e));
            })
            .finally(() => {
                currentProcess.kill();
                currentProcess.delete();
            });
    };

    const session = connectEmulatorIpc(process, state, store, handleRestart);
    const handshake = await withTimeout(session.onReady, 5000);
    if (handshake.isErr()) {
        removeRunningGame(state);
        return null;
    }

    if (state.hasIpc) {
        session.applyCheats(config.cheatMods);
        process.send("START");
    }

    toast.info("Game started");
    return state;
}

export async function launch(
    store: JotaiStore,
    game: GameEntry,
    options: FullLaunchOptions = {},
): Promise<GameProcessState | null> {
    const result = await safeTry(async function* () {
        const config = yield* resolveLaunchConfig(store, game, options);
        const state = await launchWithConfig(store, game, config, options);
        if (!state) {
            return errWarning("Emulator handshake timed out");
        }
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
