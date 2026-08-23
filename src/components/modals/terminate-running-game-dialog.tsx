import { GamepadNavField } from "@/lib/context/gamepad-nav-field";
import type { GameEntry } from "@/store/db";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Navigable } from "../ui/navigable";

type TerminateRunningGameDialogProps = {
    open: boolean;
    step: "prompt" | "confirm";
    runningGame: GameEntry | null;
    targetGame: GameEntry | null;
    onProceedToConfirm: () => void;
    onConfirmTerminate: () => void;
    onDismiss: () => void;
};

export function TerminateRunningGameDialog({
    open,
    step,
    runningGame,
    targetGame,
    onProceedToConfirm,
    onConfirmTerminate,
    onDismiss,
}: TerminateRunningGameDialogProps) {
    if (!runningGame || !targetGame) {
        return null;
    }

    if (step === "prompt") {
        return (
            <AlertDialog
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        onDismiss();
                    }
                }}
                open={open}
            >
                <AlertDialogContent>
                    <GamepadNavField debugName="terminate-running-game-prompt">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Another game is running
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                <span className="font-medium text-foreground">
                                    {runningGame.title}
                                </span>{" "}
                                is still running. Terminate it to launch{" "}
                                <span className="font-medium text-foreground">
                                    {targetGame.title}
                                </span>
                                ?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Navigable>
                                <AlertDialogCancel asChild>
                                    <Button
                                        onClick={onDismiss}
                                        type="button"
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </AlertDialogCancel>
                            </Navigable>
                            <Navigable>
                                <Button
                                    onClick={onProceedToConfirm}
                                    type="button"
                                >
                                    Terminate and launch
                                </Button>
                            </Navigable>
                        </AlertDialogFooter>
                    </GamepadNavField>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    return (
        <AlertDialog
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onDismiss();
                }
            }}
            open={open}
        >
            <AlertDialogContent>
                <GamepadNavField debugName="terminate-running-game-confirm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Terminate {runningGame.title}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Unsaved progress may be lost. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Navigable>
                            <AlertDialogCancel asChild>
                                <Button
                                    onClick={onDismiss}
                                    type="button"
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </AlertDialogCancel>
                        </Navigable>
                        <Navigable>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={onConfirmTerminate}
                                type="button"
                            >
                                Terminate
                            </AlertDialogAction>
                        </Navigable>
                    </AlertDialogFooter>
                </GamepadNavField>
            </AlertDialogContent>
        </AlertDialog>
    );
}
