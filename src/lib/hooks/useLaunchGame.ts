import { useStore } from "jotai";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { launch } from "@/lib/game-launch";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { stringifyError } from "@/lib/utils/error";
import type { GameEntry } from "@/store/db";
import {
    findActiveRunningGame,
    findAnyActiveRunningGame,
    type GameProcessState,
    terminateRunningGame,
} from "@/store/running-games";

type SameGameConflict = {
    kind: "same";
    game: GameEntry;
    runningGame: GameProcessState;
};

type DifferentGameConflict = {
    kind: "different";
    game: GameEntry;
    runningGame: GameProcessState;
    step: "prompt" | "confirm";
};

type LaunchConflict = SameGameConflict | DifferentGameConflict;

export function useLaunchGame() {
    const store = useStore();
    const { openModal } = useNavigator();
    const [isPending, startTransition] = useTransition();
    const [conflict, setConflict] = useState<LaunchConflict | null>(null);

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
            const runningSameGame = findActiveRunningGame(store, game);
            if (runningSameGame) {
                setConflict({
                    kind: "same",
                    game,
                    runningGame: runningSameGame,
                });
                return;
            }

            const runningOtherGame = findAnyActiveRunningGame(store);
            if (runningOtherGame) {
                setConflict({
                    kind: "different",
                    game,
                    runningGame: runningOtherGame,
                    step: "prompt",
                });
                return;
            }

            runLaunch(game);
        },
        [store, runLaunch],
    );

    const dismissPrompt = useCallback(() => {
        setConflict(null);
    }, []);

    const openExistingLog = useCallback(() => {
        const runningGame =
            conflict?.kind === "same" ? conflict.runningGame : undefined;
        setConflict(null);
        if (runningGame) {
            openModal({
                id: "running-game",
                params: { runningGame },
            });
        }
    }, [conflict, openModal]);

    const launchAnotherInstance = useCallback(() => {
        const game = conflict?.kind === "same" ? conflict.game : undefined;
        setConflict(null);
        if (game) {
            runLaunch(game);
        }
    }, [conflict, runLaunch]);

    const proceedToTerminateConfirm = useCallback(() => {
        setConflict((prev) => {
            if (prev?.kind !== "different") {
                return prev;
            }
            return { ...prev, step: "confirm" };
        });
    }, []);

    const confirmTerminateAndLaunch = useCallback(() => {
        if (conflict?.kind !== "different") {
            return;
        }

        const { game, runningGame } = conflict;
        setConflict(null);

        startTransition(async () => {
            try {
                await terminateRunningGame(runningGame, store);
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
    }, [conflict, store, openModal]);

    const sameGameConflict = conflict?.kind === "same" ? conflict : null;
    const differentGameConflict =
        conflict?.kind === "different" ? conflict : null;

    return {
        requestLaunch,
        isPending,
        sameGameConflict,
        differentGameConflict,
        dismissPrompt,
        openExistingLog,
        launchAnotherInstance,
        proceedToTerminateConfirm,
        confirmTerminateAndLaunch,
    };
}
