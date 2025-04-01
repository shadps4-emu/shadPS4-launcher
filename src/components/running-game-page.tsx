import { atomRunningGames, type RunningGame } from "@/store/running-games";
import { cn } from "@/utils/ui";
import { type Atom, useAtomValue, useStore } from "jotai";
import { Maximize, Maximize2, Pause, Trash2, Volume2, X } from "lucide-react";
import { useState } from "react";
import { LogList } from "./log-list";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";

type Props = {
    atomRunningGame: Atom<RunningGame>;
    requestClose?: () => void;
};

export function RunningGamePage({ atomRunningGame, requestClose }: Props) {
    const store = useStore();
    const { game, process, atomRunning, atomLog } =
        useAtomValue(atomRunningGame);
    const runningFlag = useAtomValue(atomRunning);
    const isRunning = runningFlag === true;

    const [maximized, setMaximized] = useState(false);

    const kill = () => {
        process.kill();
    };

    const trash = () => {
        store.set(atomRunningGames, (prev) =>
            prev.filter((e) => e !== atomRunningGame),
        );
        requestClose?.();
    };

    return (
        <Dialog onOpenChange={requestClose} open>
            <DialogContent
                aria-describedby="running game console"
                className={cn("flex flex-col gap-4", {
                    "h-[calc(100vh-100px)] p-10 md:max-w-[800px]": !maximized,
                    "h-screen w-screen max-w-full": maximized,
                })}
            >
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                            {game.cover ? (
                                <img
                                    alt={game.title}
                                    className="object-cover"
                                    src={game.cover}
                                />
                            ) : (
                                <Skeleton />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                {game.title}
                            </DialogTitle>
                            <DialogDescription className="mt-1 flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                    Last played: 2025/01/01{" "}
                                    {/* {gameData.lastPlayed} */}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 flex-col">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium text-sm">Output Log</h3>
                        <Badge
                            className="text-xs"
                            variant={isRunning ? "default" : "secondary"}
                        >
                            {isRunning
                                ? "Running"
                                : `Exited with code ${runningFlag}`}
                        </Badge>
                    </div>

                    <LogList atomLog={atomLog} />
                </div>

                <div className="flex justify-between">
                    <div className="flex gap-2">
                        <Button disabled size="icon" variant="outline">
                            <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                            disabled
                            size="icon"
                            // onClick={() => setIsMuted(!isMuted)}
                            variant="outline"
                        >
                            <Volume2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                        {isRunning ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="destructive">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Are you sure you want to kill the
                                            game?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Make sure to save the game first
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction onClick={kill}>
                                            Kill
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                            <Button
                                onClick={trash}
                                size="icon"
                                variant="secondary"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <button
                    className="absolute top-4 right-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={() => setMaximized((prev) => !prev)}
                    type="button"
                >
                    <Maximize className="size-4" />
                </button>
            </DialogContent>
        </Dialog>
    );
}
