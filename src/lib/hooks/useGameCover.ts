import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { useEffect, useState } from "react";
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
            const path = await join(game.path, "sce_sys", "icon0.png");
            let value: string | null = null;
            if (await exists(path)) {
                value = convertFileSrc(path);
            }
            globalGameCoverCache.set(game, value);
            setCover(value);
            setIsLoading(false);
        })();
    }, [game]);

    return [isLoading, cover];
}
