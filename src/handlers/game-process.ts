import type { ResultAsync } from "neverthrow";
import { toast } from "sonner";
import type { GameEvent } from "@/lib/native/game-process";
import { stringifyError } from "@/lib/utils/error";
import { makeDeferred } from "@/lib/utils/events";
import { defaultStore, type JotaiStore } from "@/store";
import type { Capabilities, GameProcessState } from "@/store/running-games";
import { startGame } from "./run-emu";

export function handleGameProcess(
    state: GameProcessState,
    store: JotaiStore = defaultStore,
): {
    onEmuRun: ResultAsync<void, never>;
} {
    const emuRunEvent = makeDeferred();
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
            // biome-ignore lint/suspicious/noEmptyBlockStatements: Remove the current message listener before updating
            process.onMessage = () => {};
            console.debug("Restarting emulator with the args", args.slice(1));
            process.send("STOP");
            startGame(store, state.game, {
                existingState: state,
                overrideExe: process.exe,
                overrideWorkDir: process.workingDir,
                overrideArgs: args.slice(1),
            })
                .catch((e: unknown) => {
                    console.error("Unknown restart error", e);
                    toast.error("Unknown restart error: " + stringifyError(e));
                    store.set(state.atomRunning, -1);
                    store.set(state.atomError, stringifyError(e));
                })
                .finally(() => {
                    process.kill();
                    process.delete();
                });
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
                // exaustive switch
                const a: never = ev;
                return a;
            }
        }
    };
    store.get(atomProcess).onMessage = onMessage;
    store.sub(atomProcess, () => {
        store.get(atomProcess).onMessage = onMessage;
    });

    return {
        onEmuRun: emuRunEvent.result,
    };
}
