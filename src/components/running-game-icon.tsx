import { useAtomValue, useSetAtom } from "jotai";
import type { ComponentProps, ReactElement } from "react";
import {
    atomRunningGames,
    atomShowingRunningGame,
    type RunningGame,
} from "@/store/running-games";
import { cn } from "@/utils/ui";

function SingleGameIcon({
    runningGame,
    className,
    ...props
}: ComponentProps<"div"> & { runningGame: RunningGame }) {
    const { game } = runningGame;
    const setShowingRunningGame = useSetAtom(atomShowingRunningGame);

    let content: ReactElement;
    if (game.cover == null) {
        content = <span>{game.title.slice(0, 4)}</span>;
    } else {
        content = <img alt={game.title} src={game.cover} />;
    }

    return (
        <div
            className={cn("relative", className)}
            onClick={() => setShowingRunningGame(runningGame)}
            {...props}
        >
            <div className="absolute top-0 right-0 size-2">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500" />
                <div className="absolute inset-0 rounded-full bg-blue-500" />
            </div>
            <div className="overflow-hidden rounded-full border-2">
                {content}
            </div>
        </div>
    );
}

export function RunningGameIcon() {
    const runningGames = useAtomValue(atomRunningGames);

    const first = runningGames[0];

    return (
        <div className="center relative mr-2 size-10 p-1">
            {first && (
                <SingleGameIcon
                    className="cursor-pointer shadow-lg transition-shadow hover:shadow-xl"
                    runningGame={first}
                />
            )}
        </div>
    );
}
