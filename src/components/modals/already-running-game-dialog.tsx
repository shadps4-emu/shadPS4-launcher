import { GamepadNavField } from "@/lib/context/gamepad-nav-field";
import type { GameEntry } from "@/store/db";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Navigable } from "../ui/navigable";

type AlreadyRunningGameDialogProps = {
    open: boolean;
    game: GameEntry | null;
    onOpenLog: () => void;
    onLaunchAnother: () => void;
    onDismiss: () => void;
};

export function AlreadyRunningGameDialog({
    open,
    game,
    onOpenLog,
    onLaunchAnother,
    onDismiss,
}: AlreadyRunningGameDialogProps) {
    if (!game) {
        return null;
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
                <GamepadNavField debugName="already-running-game-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Game already running
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {game.title}
                            </span>{" "}
                            is already running. Open the existing log or launch
                            another instance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Navigable>
                            <Button
                                onClick={onLaunchAnother}
                                type="button"
                                variant="outline"
                            >
                                Launch Another Instance
                            </Button>
                        </Navigable>
                        <Navigable>
                            <AlertDialogAction
                                onClick={onOpenLog}
                                type="button"
                            >
                                Open Log
                            </AlertDialogAction>
                        </Navigable>
                    </AlertDialogFooter>
                </GamepadNavField>
            </AlertDialogContent>
        </AlertDialog>
    );
}
