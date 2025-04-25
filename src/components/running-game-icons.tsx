import { useAtomValue, useSetAtom } from "jotai";
import type { ComponentProps, ReactElement } from "react";
import {
    atomRunningGames,
    atomShowingRunningGame,
    type RunningGame,
} from "@/store/running-games";
import { stringifyError } from "@/utils/error";
import { cn } from "@/utils/ui";
import { Spinner } from "./ui/spinner";

function SingleGameIcon({
    runningGame,
    className,
    ...props
}: ComponentProps<"div"> & { runningGame: RunningGame }) {
    const { game } = runningGame;
    const value = useAtomValue(game.dataLoadable);
    const setShowingRunningGame = useSetAtom(atomShowingRunningGame);
    const state = useAtomValue(runningGame.atomRunning);

    if (value.state === "hasError") {
        return <span>Error: {stringifyError(value.error)}</span>;
    }

    if (value.state === "loading") {
        return <Spinner />;
    }

    const data = value.data;

    let content: ReactElement;
    if (data.cover == null) {
        content = <span>{data.title.slice(0, 4)}</span>;
    } else {
        content = <img alt={data.title} className="h-full" src={data.cover} />;
    }

    return (
        <div
            className={cn("relative", className)}
            onClick={() => setShowingRunningGame(runningGame)}
            {...props}
        >
            <div className="absolute top-0 right-0 size-2">
                <div
                    className={cn(
                        "absolute inset-0 animate-ping rounded-full",
                        {
                            "bg-blue-500": state === true,
                            "bg-gray-600": state === 0,
                            "bg-red-500": state !== true && state !== 0,
                        },
                    )}
                />
                <div
                    className={cn("absolute inset-0 rounded-full", {
                        "bg-blue-500": state === true,
                        "bg-gray-600": state === 0,
                        "bg-red-500": state !== true && state !== 0,
                    })}
                />
            </div>
            <div className="h-full overflow-hidden rounded-full border-2">
                {content}
            </div>
        </div>
    );
}

export function RunningGameIcons() {
    const runningGames = useAtomValue(atomRunningGames);

    return (
        <div className="relative mr-2 flex h-10 flex-row-reverse p-1">
            {runningGames.map((e) => (
                <SingleGameIcon
                    className="h-full cursor-pointer shadow-lg transition-shadow hover:shadow-xl"
                    key={e.game.path}
                    runningGame={e}
                />
            ))}
        </div>
    );
}
