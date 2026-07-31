import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { useEffect, useState } from "react";
import { readZarIcon } from "@/lib/native/zar";
import { isZarPath } from "@/lib/utils/game-path";
import type { GameEntry } from "@/store/db";

const globalGameCoverCache = new WeakMap<GameEntry, string | null>();

export function useGameCover(game: GameEntry): [boolean, string | null] {
    const [isLoading, setIsLoading] = useState(true);
    const [cover, setCover] = useState<string | null>(null);

    useEffect(() => {
        const v = globalGameCoverCache.get(game);
        if (v !== undefined) {
            setCover(v);
            setIsLoading(false);
            return;
        }
        (async () => {
            let value: string | null = null;
            try {
                if (isZarPath(game.path)) {
                    const data = await readZarIcon(game.path);
                    if (data) {
                        value = await blobToDataUrl(
                            new Blob([data], { type: "image/png" }),
                        );
                    }
                } else {
                    const path = await join(game.path, "sce_sys", "icon0.png");
                    if (await exists(path)) {
                        value = convertFileSrc(path);
                    }
                }
            } catch (e: unknown) {
                console.error(
                    `Could not load game cover from "${game.path}"`,
                    e,
                );
            }
            globalGameCoverCache.set(game, value);
            setCover(value);
            setIsLoading(false);
        })();
    }, [game]);

    return [isLoading, cover];
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
            } else {
                reject(new Error("Could not encode game cover"));
            }
        });
        reader.addEventListener("error", () => {
            reject(reader.error ?? new Error("Could not read game cover"));
        });
        reader.readAsDataURL(blob);
    });
}
