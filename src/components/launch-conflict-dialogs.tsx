import { useAtomValue } from "jotai";
import { AlreadyRunningGameDialog } from "@/components/modals/already-running-game-dialog";
import { TerminateRunningGameDialog } from "@/components/modals/terminate-running-game-dialog";
import { useLaunchGame } from "@/lib/hooks/useLaunchGame";
import { atomLaunchConflict } from "@/store/launch-conflict";

export function LaunchConflictDialogs() {
    const conflict = useAtomValue(atomLaunchConflict);
    const {
        dismissPrompt,
        openExistingLog,
        launchAnotherInstance,
        proceedToTerminateConfirm,
        confirmTerminateAndLaunch,
    } = useLaunchGame();

    const sameGameConflict = conflict?.kind === "same" ? conflict : null;
    const differentGameConflict =
        conflict?.kind === "different" ? conflict : null;

    return (
        <>
            <AlreadyRunningGameDialog
                game={sameGameConflict?.game ?? null}
                onDismiss={dismissPrompt}
                onLaunchAnother={launchAnotherInstance}
                onOpenLog={openExistingLog}
                open={sameGameConflict !== null}
            />
            <TerminateRunningGameDialog
                onConfirmTerminate={confirmTerminateAndLaunch}
                onDismiss={dismissPrompt}
                onProceedToConfirm={proceedToTerminateConfirm}
                open={differentGameConflict !== null}
                runningGame={differentGameConflict?.runningGame.game ?? null}
                step={differentGameConflict?.step ?? "prompt"}
                targetGame={differentGameConflict?.game ?? null}
            />
        </>
    );
}
