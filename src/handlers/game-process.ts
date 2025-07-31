import type { ResultAsync } from "neverthrow";
import { makeDeferred } from "@/lib/utils/events";
import { defaultStore, type JotaiStore } from "@/store";
import type { Capabilities, GameProcessState } from "@/store/running-games";

export function handleGameProcess(
    state: GameProcessState,
    store: JotaiStore = defaultStore,
): {
    onEmuRun: ResultAsync<void, never>;
} {
    const emuRunEvent = makeDeferred();
    const { process } = state;

    const addCapability = (capability: Capabilities) => {
        store.set(state.atomCapabilities, (prev) => [...prev, capability]);
    };

    let isReadingCapabilities = false;
    let isFirstLine = true;
    const onIpc = (line: string) => {
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
                process.send("RUN");
                emuRunEvent.resolve();
                return;
            }
            addCapability(line as Capabilities);
            return;
        }
    };

    process.onMessage = (ev) => {
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

    return {
        onEmuRun: emuRunEvent.result,
    };
}
