import { Channel, invoke } from "@tauri-apps/api/core";

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
    | { event: "iOError"; err: string };

export class GameProcess {
    #pid: number;
    #ch: Channel<GameEvent>;

    private constructor(pid: number, ch: Channel<GameEvent>) {
        this.#pid = pid;
        this.#ch = ch;
    }

    static async startGame(
        exe: string,
        workingDir: string,
        gameBinary: string,
    ): Promise<GameProcess> {
        const ch = new Channel<GameEvent>();
        const pid = await invoke<number>("game_process_spawn", {
            exe,
            wd: workingDir,
            gameBinary,
            onEvent: ch,
        });
        return new GameProcess(pid, ch);
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
}
