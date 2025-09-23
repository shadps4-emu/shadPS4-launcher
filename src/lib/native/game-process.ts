import { Channel, invoke } from "@tauri-apps/api/core";
import { ResultAsync } from "neverthrow";

export class GameStartError extends Error {
    constructor(
        exe: string,
        workingDir: string,
        args: string[],
        cause?: unknown,
    ) {
        super(
            `Failed to start game process: ${exe} in ${workingDir} with args: ${args.join(
                " ",
            )}`,
        );
        this.name = "GameStartError";
        this.cause = cause;
        Object.setPrototypeOf(this, GameStartError.prototype);
    }
}

export enum LogLevel {
    UNKNOWN = "unknown",
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical",
}

export type LogEntry = {
    rowId: number;
    time: number;
    level: LogLevel;
    class: string;
    message: string;
};

export type GameEvent =
    | ({ event: "log" } & LogEntry)
    | { event: "addLogClass"; value: string }
    | { event: "gameExit"; status: number }
    | { event: "iOError"; err: string }
    | { event: "ipcLine"; value: string };

export class GameProcess {
    #exe: string;
    #workingDir: string;
    #args: string[];
    #pid: number;
    #ch: Channel<GameEvent>;

    private constructor(
        exe: string,
        workingDir: string,
        args: string[],
        pid: number,
        ch: Channel<GameEvent>,
    ) {
        this.#exe = exe;
        this.#workingDir = workingDir;
        this.#args = args;
        this.#pid = pid;
        this.#ch = ch;
    }

    static startGame(
        exe: string,
        workingDir: string,
        args: string[],
    ): ResultAsync<GameProcess, GameStartError> {
        return ResultAsync.fromPromise(
            (async () => {
                const ch = new Channel<GameEvent>();
                const pid = await invoke<number>("game_process_spawn", {
                    exe,
                    wd: workingDir,
                    args,
                    onEvent: ch,
                });
                return new GameProcess(exe, workingDir, args, pid, ch);
            })(),
            (err) => new GameStartError(exe, workingDir, args, err),
        );
    }

    get exe() {
        return this.#exe;
    }

    get workingDir() {
        return this.#workingDir;
    }

    get args() {
        return this.#args;
    }

    get pid() {
        return this.#pid;
    }

    set onMessage(listener: (ev: GameEvent) => void) {
        this.#ch.onmessage = listener;
    }

    async kill() {
        await invoke("game_process_kill", { pid: this.pid });
    }

    async delete() {
        await invoke("game_process_delete", { pid: this.#pid });
    }

    async send(value: string) {
        await invoke("game_process_send", { pid: this.pid, value });
    }

    async getLog({
        level,
        logClass,
    }: {
        level?: LogLevel[] | undefined;
        logClass?: string[] | undefined;
    } = {}): Promise<LogEntry[]> {
        return JSON.parse(
            await invoke("game_process_get_log", {
                pid: this.pid,
                level,
                logClass,
            }),
        );
    }

    send_patch_memory(
        modName: string,
        offset: string,
        value: string,
        target = "",
        size = "",
        isOffset = true,
        littleEndian = false,
        patchMask = 0,
        patchSize = 0,
    ) {
        return this.send(
            "PATCH_MEMORY\n" +
                `${modName}\n` +
                `${offset}\n` +
                `${value}\n` +
                `${target}\n` +
                `${size}\n` +
                `${+isOffset}\n` +
                `${+littleEndian}\n` +
                `${patchMask}\n` +
                `${patchSize}\n`,
        );
    }
}
