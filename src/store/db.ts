import Database from "@tauri-apps/plugin-sql";
import type { PSF } from "@/lib/native/psf";
import type { CUSA } from "./common";

const conn = await Database.load("sqlite:data.db");

export type GameEntry = {
    id?: number;
    path: string;
    cusa: CUSA;
    title: string;
    version: string;
    fw_version: string;
    sfo: PSF | null;

    error?: Error; // This is not stored in the database
};

export const db = {
    conn,
    async listGames(): Promise<GameEntry[]> {
        return (
            await conn.select<
                (Omit<GameEntry, "sfo"> & { sfo_json: string })[]
            >("SELECT * FROM games")
        ).map(({ sfo_json, ...rest }) => ({
            ...rest,
            sfo: sfo_json ? JSON.parse(sfo_json) : null,
        }));
    },
    async removeGame(path: string): Promise<void> {
        await conn.execute("DELETE FROM games WHERE path = $1", [path]);
    },
    async removeAllGames(): Promise<void> {
        await conn.execute("DELETE FROM games");
    },
    async addGame(data: GameEntry): Promise<void> {
        await conn.execute(
            "INSERT INTO games (path, cusa, title, version, fw_version, sfo_json) VALUES ($1, $2, $3, $4, $5, $6)",
            [
                data.path,
                data.cusa,
                data.title,
                data.version,
                data.fw_version,
                data.sfo ? JSON.stringify(data.sfo) : null,
            ],
        );
    },
} as const;
