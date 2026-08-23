import type { ResultAsync } from "neverthrow";
import type { GameEvent, GameProcess } from "@/lib/native/game-process";
import { makeDeferred } from "@/lib/utils/events";
import type { JotaiStore } from "@/store";
import type { CheatFileMod } from "@/store/cheats-and-patches";
import type { Capabilities, GameProcessState } from "@/store/running-games";

export type EmulatorIpcSession = {
    onReady: ResultAsync<void, never>;
    applyCheats: (mods: CheatFileMod[]) => void;
};

export type ConnectEmulatorIpcOptions = {
    reconnected?: boolean;
    ipcReady?: boolean;
    capabilities?: Capabilities[];
};

export function connectEmulatorIpc(
    process: GameProcess,
    state: GameProcessState,
    store: JotaiStore,
    onRestart: (args: string[]) => void,
    options: ConnectEmulatorIpcOptions = {},
): EmulatorIpcSession {
    const {
        reconnected = false,
        ipcReady = false,
        capabilities = [],
    } = options;
    const emuRunEvent = makeDeferred<void, never>();
    const { atomProcess } = state;

    if (reconnected) {
        if (ipcReady) {
            state.hasIpc = true;
            store.set(state.atomCapabilities, capabilities);
        }
        emuRunEvent.resolve();
    }

    const addCapability = (capability: Capabilities) => {
        store.set(state.atomCapabilities, (prev) =>
            prev.includes(capability) ? prev : [...prev, capability],
        );
    };

    let isReadingCapabilities = false;
    let isFirstLine = !(reconnected && ipcReady);

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
            const currentProcess = store.get(atomProcess);
            // biome-ignore lint/suspicious/noEmptyBlockStatements: clear listener before restart
            currentProcess.onMessage = () => {};
            console.debug("Restarting emulator with the args", args.slice(1));
            currentProcess.send("STOP");
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

    process.onMessage = onMessage;
    store.sub(atomProcess, () => {
        store.get(atomProcess).onMessage = onMessage;
    });

    return {
        onReady: emuRunEvent.result,
        applyCheats(mods) {
            const capabilities = store.get(state.atomCapabilities);
            if (!capabilities.includes("ENABLE_MEMORY_PATCH")) {
                return;
            }
            const currentProcess = store.get(atomProcess);
            for (const mod of mods) {
                const isOffset = !mod.hint;
                for (const mem of mod.memory) {
                    currentProcess.send_patch_memory(
                        mod.name,
                        mem.offset,
                        mem.on,
                        "",
                        "",
                        isOffset,
                    );
                }
            }
        },
    };
}
