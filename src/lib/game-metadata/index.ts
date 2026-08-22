import { basename, join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { type PSF, readPsf } from "@/lib/native/psf";
import { inspectZarGame } from "@/lib/native/zar";
import { stringifyError } from "@/lib/utils/error";
import { isZarPath } from "@/lib/utils/game-path";
import type { CUSA, Version } from "@/store/common";
import type { GameEntry } from "@/store/db";

export type GameMetadata = Pick<
    GameEntry,
    "path" | "cusa" | "title" | "version" | "fw_version" | "sfo" | "error"
>;

function formatFwVersion(sfo: PSF): string {
    let fw_version = sfo.entries.SYSTEM_VER?.Integer?.toString(16)
        .padStart(8, "0")
        .slice(0, 4);
    if (fw_version) {
        fw_version = `${fw_version.slice(0, 2).trimStart()}.${fw_version.slice(2)}`;
        if (fw_version.startsWith("0")) {
            fw_version = fw_version.slice(1);
        }
    }
    return fw_version || "UNK";
}

export async function inspectGame(path: string): Promise<GameMetadata> {
    try {
        const base = await basename(path);
        const isZar = isZarPath(path);
        const fallbackTitle = isZar ? base.slice(0, -4) : base;

        let sfo: PSF | null | undefined;
        if (isZar) {
            sfo = await inspectZarGame(path);
        } else {
            const paramSfo = await join(path, "sce_sys", "param.sfo");
            if (await exists(paramSfo)) {
                sfo = await readPsf(paramSfo);
            }
        }

        if (!sfo) {
            return {
                path,
                cusa: `N/A - ${fallbackTitle}` as CUSA,
                title: fallbackTitle,
                version: "N/A",
                fw_version: "N/A",
                sfo: null,
            };
        }

        const e = sfo.entries;
        return {
            path,
            cusa: (e.TITLE_ID?.Text || fallbackTitle) as CUSA,
            title: e.TITLE?.Text || "Unknown",
            version: (e.APP_VER?.Text as Version) || "N/A",
            fw_version: formatFwVersion(sfo),
            sfo,
        };
    } catch (e: unknown) {
        console.error(`could not read game info at: "${path}"`, e);
        return {
            path,
            cusa: "N/A",
            title: "N/A",
            version: "N/A",
            fw_version: "N/A",
            sfo: null,
            error: new Error(`game read info. ${stringifyError(e)}`, {
                cause: e,
            }),
        };
    }
}

export async function inspectGameEntry(path: string): Promise<GameEntry> {
    const metadata = await inspectGame(path);
    return { id: metadata.error ? -2 : -1, ...metadata };
}
