import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { useAtom, useStore } from "jotai";
import { CircleHelp, Globe, ImageOff, Play } from "lucide-react";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import CN from "@/assets/flags/cn.svg";
import EU from "@/assets/flags/eu.svg";
import JP from "@/assets/flags/jp.svg";
import US from "@/assets/flags/us.svg";
import { startGame } from "@/handlers/run-emu";
import { openPath } from "@/lib/native/common";
import { atomGameLibrary, type GameEntry } from "@/store/game-library";
import { gamepadActiveAtom } from "@/store/gamepad";
import { atomGamesPath } from "@/store/paths";
import { atomSelectedVersion } from "@/store/version-manager";
import { stringifyError } from "@/utils/error";
import GamepadIcon from "./gamepad-icon";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";

function Flag({
    sfo,
    className,
}: Pick<GameEntry, "sfo"> & { className?: string }) {
    const region = useMemo(() => {
        const { CONTENT_ID } = sfo?.entries ?? {};
        return CONTENT_ID?.Text?.[0] ?? undefined;
    }, [sfo]);

    switch (region) {
        case "U":
            return <img alt="US" className={className} src={US} />;
        case "E":
            return <img alt="EU" className={className} src={EU} />;
        case "J":
            return <img alt="JP" className={className} src={JP} />;
        case "H":
            return <img alt="CN" className={className} src={CN} />;
        case "I":
            return <Globe className={className} />;
        default:
            return <CircleHelp className={className} />;
    }
}

function GameBox({ game, isFirst }: { game: GameEntry; isFirst?: boolean }) {
    const [isPending, startTransaction] = useTransition();

    const isGamepad = useAtom(gamepadActiveAtom);
    const store = useStore();

    const [clickCount, setClickCount] = useState<number>(0);

    const openGame = () =>
        startTransaction(async () => {
            try {
                setClickCount(0);
                const selectEmu = store.get(atomSelectedVersion);
                if (!selectEmu) {
                    toast.warning("No emulator selected");
                    return;
                }
                await startGame(selectEmu, game);
            } catch (e: unknown) {
                toast.error("Unknown error: " + stringifyError(e));
            }
        });

    const onClick = () => {
        setClickCount((prev) => prev + 1);
    };

    const onBlur = () => {
        setClickCount(0);
    };

    useEffect(() => {
        if (clickCount >= 3) {
            setClickCount(0);
            toast.info("Do a double click to start the game");
        }
    }, [clickCount]);

    return (
        <div
            className="relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110"
            data-gamepad-selectable
            key={game.id}
            onBlur={onBlur}
            onClick={onClick}
            onDoubleClick={openGame}
        >
            {isPending && (
                <div className="center absolute inset-0 bg-black/60">
                    <Spinner />
                </div>
            )}
            {game.cover ? (
                <img
                    alt={game.title}
                    className="col-span-full row-span-full object-cover"
                    src={game.cover}
                />
            ) : (
                <div className="center col-span-full row-span-full">
                    <ImageOff className="h-8" />
                </div>
            )}

            <div className="grid grid-cols-3 grid-rows-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <span className="col-span-full row-start-1 row-end-2 truncate px-3 py-2 text-center font-semibold text-lg">
                    {/* TODO: scroll text on overflow */}
                    {game.title}
                </span>

                <div className="col-start-3 col-end-4 row-start-3 row-end-4 m-2 size-6 place-self-end">
                    <Flag className="rounded-full" sfo={game.sfo} />
                </div>

                <button
                    className="col-span-full row-span-full grid size-16 place-items-center place-self-center rounded-full bg-black/75"
                    data-initial-focus={isFirst ? "" : undefined}
                    data-play-game={""}
                    type="button"
                >
                    <Play className="size-10" fill="currentColor" />
                </button>

                <button
                    className="col-span-full row-start-3 row-end-4 flex flex-row items-center justify-center gap-x-2 self-end py-2 transition-colors hover:bg-secondary/75 focus:bg-secondary/75"
                    type="button"
                >
                    {isGamepad && (
                        <GamepadIcon className="size-6" icon="options" />
                    )}
                    View More
                    {isGamepad && <div className="size-6" />}
                </button>
            </div>
        </div>
    );
}

function Grid() {
    const [games] = useAtom(atomGameLibrary);
    const store = useStore();

    if (games.length === 0) {
        async function openGameFolder() {
            const path = store.get(atomGamesPath);
            if (path) {
                if (!(await exists(path))) {
                    await mkdir(path, { recursive: true });
                }
                await openPath(path);
            }
        }
        return (
            <div className="flex h-full items-center justify-center">
                <div
                    className="flex h-[150px] w-[300px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-sm"
                    onClick={() => void openGameFolder()}
                >
                    <span>No game found :(</span>
                    <span>Click here to open game folder</span>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="z-20 flex-1" type="scroll">
            <div className="flex flex-row flex-wrap justify-center gap-4 p-8">
                {games.map((game, index) => (
                    <GameBox
                        game={game}
                        isFirst={index === 0}
                        key={game.path}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 overflow-hidden p-8">
            {Array(50)
                .fill(0)
                .map((_, i) => (
                    <Skeleton
                        className="relative aspect-square rounded-md bg-zinc-800"
                        // biome-ignore lint/suspicious/noArrayIndexKey: Just skeleton, order doesn't matter
                        key={i}
                    />
                ))}
        </div>
    );
}

export function GameLibrary() {
    return (
        <Suspense fallback={<GridSkeleton />}>
            <Grid />
        </Suspense>
    );
}
