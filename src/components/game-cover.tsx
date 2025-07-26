import { ImageOffIcon } from "lucide-react";
import { useGameCover } from "@/lib/hooks/useGameCover";
import { cn } from "@/lib/utils/ui";
import type { GameEntry } from "@/store/db";
import { GameBoxSkeleton } from "./game-box";

export function GameBoxCover({
    game,
    className,
}: {
    game: GameEntry;
    className?: string | undefined;
}) {
    const [isLoading, cover] = useGameCover(game);

    if (isLoading) {
        return <GameBoxSkeleton className={className} />;
    }

    return cover ? (
        <img
            alt={game.title}
            className={cn(
                "col-span-full row-span-full object-cover",
                className,
            )}
            src={cover}
        />
    ) : (
        <div className={cn("center col-span-full row-span-full", className)}>
            <ImageOffIcon className="h-8" />
        </div>
    );
}
