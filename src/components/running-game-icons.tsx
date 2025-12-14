import { useAtomValue } from "jotai";
import type { ComponentProps, ReactElement } from "react";
import { RunningGameModal } from "@/components/modals/running-game-modal";
import { useGameCover } from "@/lib/hooks/useGameCover";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { cn } from "@/lib/utils/ui";
import { atomRunningGames, type GameProcessState } from "@/store/running-games";

function SingleGameIcon({
    runningGame,
    className,
    ...props
}: ComponentProps<"div"> & { runningGame: GameProcessState }) {
    const { game } = runningGame;
    const { pushModal } = useNavigator();
    const state = useAtomValue(runningGame.atomRunning);
    const [_, cover] = useGameCover(game);

    const data = game;

    let content: ReactElement;
    if (cover == null) {
        content = <span>{data.title.slice(0, 4)}</span>;
    } else {
        content = <img alt={data.title} className="h-full" src={cover} />;
    }

    return (
        <div
            className={cn("relative", className)}
            onClick={() =>
                pushModal(<RunningGameModal runningGame={runningGame} />)
            }
            role="button"
            tabIndex={0}
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
