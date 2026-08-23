import { useAtom, useStore } from "jotai";
import { useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";
import { launch } from "@/lib/game-launch";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { stringifyError } from "@/lib/utils/error";
import type { GameEntry } from "@/store/db";
import { atomLaunchConflict } from "@/store/launch-conflict";
import {
    findActiveRunningGame,
    findAnyActiveRunningGame,
    type GameProcessState,
    terminateRunningGame,
} from "@/store/running-games";

export function useLaunchGame() {
    const store = useStore();
    const { openModal } = useNavigator();
    const [isPending, startTransition] = useTransition();
    const [conflict, setConflict] = useAtom(atomLaunchConflict);
    const isLaunchingRef = useRef(false);

    const openRunningGameLog = useCallback(
        (runningGame: GameProcessState) => {
            openModal({
                id: "running-game",
                params: { runningGame },
            });
        },
        [openModal],
    );

    const runLaunch = useCallback(
        (game: GameEntry) => {
            if (isLaunchingRef.current) {
                return;
            }
            isLaunchingRef.current = true;

            startTransition(async () => {
                try {
                    const runningGame = await launch(store, game);
                    if (runningGame) {
                        openRunningGameLog(runningGame);
                    }
                } catch (e: unknown) {
                    toast.error(`Unknown error: ${stringifyError(e)}`);
                } finally {
                    isLaunchingRef.current = false;
                }
            });
        },
        [openRunningGameLog, store],
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

            if (isLaunchingRef.current) {
                return;
            }

            runLaunch(game);
        },
        [store, runLaunch, setConflict],
    );

    const dismissPrompt = useCallback(() => {
        setConflict(null);
    }, [setConflict]);

    const openExistingLog = useCallback(() => {
        const runningGame =
            conflict?.kind === "same" ? conflict.runningGame : undefined;
        setConflict(null);
        if (runningGame) {
            openRunningGameLog(runningGame);
        }
    }, [conflict, openRunningGameLog, setConflict]);

    const launchAnotherInstance = useCallback(() => {
        const game = conflict?.kind === "same" ? conflict.game : undefined;
        setConflict(null);
        if (game) {
            runLaunch(game);
        }
    }, [conflict, runLaunch, setConflict]);

    const proceedToTerminateConfirm = useCallback(() => {
        setConflict((prev) => {
            if (prev?.kind !== "different") {
                return prev;
            }
            return { ...prev, step: "confirm" };
        });
    }, [setConflict]);

    const confirmTerminateAndLaunch = useCallback(() => {
        if (conflict?.kind !== "different") {
            return;
        }

        const { game, runningGame } = conflict;
        setConflict(null);

        startTransition(async () => {
            try {
                await terminateRunningGame(runningGame, store);
                const launchedGame = await launch(store, game);
                if (launchedGame) {
                    openRunningGameLog(launchedGame);
                }
            } catch (e: unknown) {
                toast.error(`Unknown error: ${stringifyError(e)}`);
            }
        });
    }, [conflict, openRunningGameLog, store, setConflict]);

    return {
        requestLaunch,
        isPending,
        dismissPrompt,
        openExistingLog,
        launchAnotherInstance,
        proceedToTerminateConfirm,
        confirmTerminateAndLaunch,
    };
}
