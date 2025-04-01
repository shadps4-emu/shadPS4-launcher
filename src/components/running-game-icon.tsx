import { type Atom, useAtomValue } from "jotai";
import { type ComponentProps, type ReactElement, useState } from "react";
import { createPortal } from "react-dom";
import { atomRunningGames, type RunningGame } from "@/store/running-games";
import { cn } from "@/utils/ui";
import { RunningGamePage } from "./running-game-page";

function SingleGameIcon({
    atomRunningGame,
    className,
    ...props
}: ComponentProps<"div"> & { atomRunningGame: Atom<RunningGame> }) {
    const { game } = useAtomValue(atomRunningGame);

    let content: ReactElement;
    if (game.cover == null) {
        content = <span>{game.title.slice(0, 4)}</span>;
    } else {
        content = <img alt={game.title} src={game.cover} />;
    }

    return (
        <div className={cn("relative", className)} {...props}>
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
    const [showingGame, setShowingGame] = useState<ReactElement>();

    if (runningGames.length === 0) {
        return <></>;
    }

    const first = runningGames[0]!;

    const openPage = () => {
        setShowingGame(
            <RunningGamePage
                atomRunningGame={first}
                requestClose={() => setShowingGame(undefined)}
            />,
        );
    };

    return (
        <div className="center relative mr-2 size-10 p-1">
            {showingGame && createPortal(showingGame, document.body)}
            <SingleGameIcon
                atomRunningGame={first}
                className="cursor-pointer shadow-lg transition-shadow hover:shadow-xl"
                onClick={openPage}
            />
        </div>
    );
}
