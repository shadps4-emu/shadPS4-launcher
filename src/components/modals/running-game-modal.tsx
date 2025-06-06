import { useAtomValue, useSetAtom } from "jotai";
import {
    FilterIcon,
    FolderTreeIcon,
    GaugeIcon,
    Maximize2Icon,
    MaximizeIcon,
    PauseIcon,
    Trash2Icon,
    Volume2Icon,
    XIcon,
} from "lucide-react";
import { useState } from "react";
import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import { useGameCover } from "@/lib/hooks/useGameCover";
import { LogLevel } from "@/lib/native/game-process";
import { stringifyError } from "@/lib/utils/error";
import { capitalize } from "@/lib/utils/strings";
import { cn } from "@/lib/utils/ui";
import {
    atomShowingRunningGame,
    type RunningGame,
    removeRunningGame,
} from "@/store/running-games";
import { LogList } from "../log-list";
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
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Navigable } from "../ui/navigable";
import { Skeleton } from "../ui/skeleton";

export function RunningGameDialog({
    runningGame,
}: {
    runningGame: RunningGame;
}) {
    const setShowingGame = useSetAtom(atomShowingRunningGame);

    const { game, process, atomRunning, log } = runningGame;
    const [_, cover] = useGameCover(game);

    const runningFlag = useAtomValue(atomRunning);
    const isRunning = runningFlag === true;

    const [maximized, setMaximized] = useState(false);

    const availableClassLog = useAtomValue(log.atomClassList);
    const [logLevelFilter, setLogLevelFilter] = useState<LogLevel[]>([]);
    const [logClassFilter, setLogClassFilter] = useState<string[]>([]);

    const close = () => {
        setShowingGame(null);
    };

    const kill = () => {
        process.kill();
    };

    const trash = () => {
        removeRunningGame(runningGame);
        close();
    };

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            close();
            return;
        }
    };

    if ("error" in game) {
        return (
            <Dialog onOpenChange={close} open>
                <DialogContent aria-describedby={undefined}>
                    <div className="text-red-500">
                        Error: {stringifyError(game.error)}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    const filterMenuContent = (
        <DropdownMenuContent>
            <DropdownMenuItem
                onClick={() => {
                    setLogLevelFilter([]);
                    setLogClassFilter([]);
                }}
            >
                <XIcon /> Show All
            </DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <GaugeIcon
                        className="mr-2 text-muted-foreground"
                        size={16}
                    />{" "}
                    Level
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {Object.values(LogLevel).map((level) => (
                        <DropdownMenuCheckboxItem
                            checked={logLevelFilter.includes(level)}
                            key={level}
                            onCheckedChange={(checked) =>
                                setLogLevelFilter((prev) =>
                                    checked
                                        ? prev.concat(level)
                                        : prev.filter((e) => e !== level),
                                )
                            }
                            onSelect={(e) => e.preventDefault()}
                        >
                            {capitalize(level)}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <FolderTreeIcon
                        className="mr-2 text-muted-foreground"
                        size={16}
                    />{" "}
                    Class
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {availableClassLog.map((className) => (
                        <DropdownMenuCheckboxItem
                            checked={logClassFilter.includes(className)}
                            key={className}
                            onCheckedChange={(checked) =>
                                setLogClassFilter((prev) =>
                                    checked
                                        ? prev.concat(className)
                                        : prev.filter((e) => e !== className),
                                )
                            }
                            onSelect={(e) => e.preventDefault()}
                        >
                            {capitalize(className)}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </DropdownMenuContent>
    );

    return (
        <Dialog onOpenChange={close} open>
            <GamepadNavField
                debugName="running-game-modal"
                onButtonPress={onButtonPress}
            >
                <DialogContent
                    aria-describedby={undefined}
                    className={cn("flex flex-col gap-4", {
                        "h-[calc(100vh-100px)] p-10 md:max-w-[800px]":
                            !maximized,
                        "h-screen w-screen max-w-full": maximized,
                    })}
                >
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                {cover ? (
                                    <img
                                        alt={game.title}
                                        className="object-cover"
                                        src={cover}
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
                            <div className="flex flex-row items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Badge
                                            className="p-1"
                                            variant="secondary"
                                        >
                                            <FilterIcon size={12} />
                                        </Badge>
                                    </DropdownMenuTrigger>
                                    {filterMenuContent}
                                </DropdownMenu>
                                <h3 className="font-medium text-sm">
                                    Output Log
                                </h3>
                            </div>
                            <Badge
                                className="text-xs"
                                variant={isRunning ? "default" : "secondary"}
                            >
                                {isRunning
                                    ? "Running"
                                    : `Exited with code ${runningFlag}`}
                            </Badge>
                        </div>

                        <LogList
                            classFilter={
                                logClassFilter.length > 0
                                    ? logClassFilter
                                    : undefined
                            }
                            levelFilter={
                                logLevelFilter.length > 0
                                    ? logLevelFilter
                                    : undefined
                            }
                            runningGame={runningGame}
                        />
                    </div>

                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <Navigable disabled>
                                <Button disabled size="icon" variant="outline">
                                    <PauseIcon className="h-4 w-4" />
                                </Button>
                            </Navigable>
                            <Navigable disabled>
                                <Button
                                    disabled
                                    size="icon"
                                    // onClick={() => setIsMuted(!isMuted)}
                                    variant="outline"
                                >
                                    <Volume2Icon className="h-4 w-4" />
                                </Button>
                            </Navigable>
                        </div>
                        <div className="flex gap-2">
                            <Navigable>
                                <Button size="icon" variant="outline">
                                    <Maximize2Icon className="h-4 w-4" />
                                </Button>
                            </Navigable>
                            {isRunning ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Navigable>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </Button>
                                        </Navigable>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <GamepadNavField>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Are you sure you want to
                                                    kill the game?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Make sure to save the game
                                                    first
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <Navigable>
                                                    <AlertDialogCancel asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </AlertDialogCancel>
                                                </Navigable>
                                                <Navigable>
                                                    <AlertDialogAction
                                                        asChild
                                                        onClick={kill}
                                                    >
                                                        <Button>Kill</Button>
                                                    </AlertDialogAction>
                                                </Navigable>
                                            </AlertDialogFooter>
                                        </GamepadNavField>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <Navigable>
                                    <Button
                                        onClick={trash}
                                        size="icon"
                                        variant="secondary"
                                    >
                                        <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                </Navigable>
                            )}
                        </div>
                    </div>

                    <button
                        className="absolute top-4 right-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        onClick={() => setMaximized((prev) => !prev)}
                        type="button"
                    >
                        <MaximizeIcon className="size-4" />
                    </button>
                </DialogContent>
            </GamepadNavField>
        </Dialog>
    );
}

export function RunningGameModal() {
    const showingGame = useAtomValue(atomShowingRunningGame);

    if (!showingGame) {
        return <></>;
    }

    return <RunningGameDialog runningGame={showingGame} />;
}
