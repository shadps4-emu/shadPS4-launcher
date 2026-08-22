import { ok, type ResultAsync, safeTry } from "neverthrow";
import { toast } from "sonner";
import type { GameEvent } from "@/lib/native/game-process";
import { GameProcess } from "@/lib/native/game-process";
import { withTimeout } from "@/lib/nt/timeout";
import { errWarning, stringifyError, WarningError } from "@/lib/utils/error";
import { makeDeferred } from "@/lib/utils/events";
import type { JotaiStore } from "@/store";
import type { GameEntry } from "@/store/db";
import {
    type Capabilities,
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

function attachIpcLifecycle(
    state: GameProcessState,
    store: JotaiStore,
    onRestart: (args: string[]) => void,
): { onEmuRun: ResultAsync<void, never> } {
    const emuRunEvent = makeDeferred<void, never>();
    const { atomProcess } = state;

    const addCapability = (capability: Capabilities) => {
        store.set(state.atomCapabilities, (prev) =>
            prev.includes(capability) ? prev : [...prev, capability],
        );
    };

    let isReadingCapabilities = false;
    let isFirstLine = true;

    let ipcState: null | keyof typeof ipcCommands = null;
    const ipcCommands = {
        RESTART: (args: string[]) => {
            if (args.length === 0) {
                return;
            }
            const argCount = Number(args[0]);
            if (argCount > args.length + 1) {
                return;
            }
            ipcState = null;
            const process = store.get(atomProcess);
            // biome-ignore lint/suspicious/noEmptyBlockStatements: clear listener before restart
            process.onMessage = () => {};
            console.debug("Restarting emulator with the args", args.slice(1));
            process.send("STOP");
            onRestart(args.slice(1));
        },
    } satisfies { [key: string]: (args: string[]) => void };

    const ipcArgs: string[] = [];
    const onIpc = (line: string) => {
        if (ipcState != null) {
            ipcArgs.push(line);
            ipcCommands[ipcState](ipcArgs);
            return;
        }
        if (isFirstLine) {
            isFirstLine = false;
            state.hasIpc = true;
        }
        if (line === "#IPC_ENABLED") {
            isReadingCapabilities = true;
            return;
        }
        if (isReadingCapabilities) {
            if (line === "#IPC_END") {
                isReadingCapabilities = false;
                store.get(atomProcess).send("RUN");
                emuRunEvent.resolve();
                return;
            }
            addCapability(line as Capabilities);
            return;
        }
        if (line in ipcCommands) {
            ipcState = line as keyof typeof ipcCommands;
            ipcArgs.length = 0;
        }
    };

    const onMessage = (ev: GameEvent) => {
        switch (ev.event) {
            case "log":
                for (const c of store.get(state.log.atomCallback)) {
                    c(ev);
                }
                break;
            case "addLogClass":
                if (isFirstLine) {
                    isFirstLine = false;
                    emuRunEvent.resolve();
                }
                store.set(state.log.atomClassList, (prev) => [
                    ...prev,
                    ev.value,
                ]);
                break;
            case "gameExit":
                store.set(state.atomRunning, ev.status);
                break;
            case "iOError":
                store.set(state.atomError, ev.err);
                break;
            case "ipcLine":
                onIpc(ev.value);
                break;
            default: {
                const a: never = ev;
                return a;
            }
        }
    };
    store.get(atomProcess).onMessage = onMessage;
    store.sub(atomProcess, () => {
        store.get(atomProcess).onMessage = onMessage;
    });

    return { onEmuRun: emuRunEvent.result };
}

function applyCheats(
    process: GameProcess,
    config: LaunchConfig,
    capabilities: Capabilities[],
) {
    if (!capabilities.includes("ENABLE_MEMORY_PATCH")) {
        return;
    }
    for (const mod of config.cheatMods) {
        const isOffset = !mod.hint;
        for (const mem of mod.memory) {
            process.send_patch_memory(
                mod.name,
                mem.offset,
                mem.on,
                "",
                "",
                isOffset,
            );
        }
    }
}

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

    const { onEmuRun } = attachIpcLifecycle(state, store, handleRestart);
    const handshake = await withTimeout(onEmuRun, 5000);
    if (handshake.isErr()) {
        removeRunningGame(state);
        return null;
    }

    const capabilities = store.get(state.atomCapabilities);
    if (state.hasIpc) {
        applyCheats(process, config, capabilities);
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
