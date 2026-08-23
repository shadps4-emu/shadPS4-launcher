import { useStore } from "jotai";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { launch } from "@/lib/game-launch";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { stringifyError } from "@/lib/utils/error";
import type { GameEntry } from "@/store/db";
import {
    findActiveRunningGame,
    type GameProcessState,
} from "@/store/running-games";

type PendingLaunch = {
    game: GameEntry;
    runningGame: GameProcessState;
};

export function useLaunchGame() {
    const store = useStore();
    const { openModal } = useNavigator();
    const [isPending, startTransition] = useTransition();
    const [pending, setPending] = useState<PendingLaunch | null>(null);

    const runLaunch = useCallback(
        (game: GameEntry) => {
            startTransition(async () => {
                try {
                    const result = await launch(store, game);
                    if (result) {
                        openModal({
                            id: "game-details",
                            params: { gameData: result.game },
                        });
                    }
                } catch (e: unknown) {
                    toast.error(`Unknown error: ${stringifyError(e)}`);
                }
            });
        },
        [store, openModal],
    );

    const requestLaunch = useCallback(
        (game: GameEntry) => {
            const runningGame = findActiveRunningGame(store, game);
            if (runningGame) {
                setPending({ game, runningGame });
                return;
            }
            runLaunch(game);
        },
        [store, runLaunch],
    );

    const dismissPrompt = useCallback(() => {
        setPending(null);
    }, []);

    const openExistingLog = useCallback(() => {
        const runningGame = pending?.runningGame;
        setPending(null);
        if (runningGame) {
            openModal({
                id: "running-game",
                params: { runningGame },
            });
        }
    }, [pending, openModal]);

    const launchAnotherInstance = useCallback(() => {
        const game = pending?.game;
        setPending(null);
        if (game) {
            runLaunch(game);
        }
    }, [pending, runLaunch]);

    return {
        requestLaunch,
        isPending,
        pending,
        dismissPrompt,
        openExistingLog,
        launchAnotherInstance,
    };
}
