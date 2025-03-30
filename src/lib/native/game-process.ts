import { Channel, invoke } from "@tauri-apps/api/core";

export type GameEvent =
    | { event: "logLine"; line: string }
    | { event: "errLogLine"; line: string }
    | { event: "gameExit"; status: number }
    | { event: "iOError"; err: string };

export class GameProcess {
    private pid: number;
    private ch: Channel<GameEvent>;

    private constructor(pid: number, ch: Channel<GameEvent>) {
        this.pid = pid;
        this.ch = ch;
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

    set onMessage(listener: (ev: GameEvent) => void) {
        this.ch.onmessage = listener;
    }

    kill() {
        invoke("game_process_kill", { pid: this.pid });
    }
}
