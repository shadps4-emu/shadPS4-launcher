import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { useVirtualizer } from "@tanstack/react-virtual";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { useAtom, useAtomValue, useStore } from "jotai";
import { CircleHelp, FrownIcon, Globe, ImageOff, Play } from "lucide-react";
import {
    Suspense,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react";
import { toast } from "sonner";
import CN from "@/assets/flags/cn.svg";
import EU from "@/assets/flags/eu.svg";
import JP from "@/assets/flags/jp.svg";
import US from "@/assets/flags/us.svg";
import { startGame } from "@/handlers/run-emu";
import { openPath } from "@/lib/native/common";
import type { PSF } from "@/lib/native/psf";
import { atomGameLibrary, type GameEntry } from "@/store/game-library";
import { gamepadActiveAtom } from "@/store/gamepad";
import { atomGamesPath } from "@/store/paths";
import { atomShowingRunningGame } from "@/store/running-games";
import { atomSelectedVersion } from "@/store/version-manager";
import { stringifyError } from "@/utils/error";
import GamepadIcon from "./gamepad-icon";
import { ScrollBar } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";

function Flag({ sfo, className }: { sfo: PSF | null; className?: string }) {
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

function GameBoxSkeleton() {
    return (
        <Skeleton className="relative aspect-square rounded-md bg-zinc-800" />
    );
}

function GameBox({ game, isFirst }: { game: GameEntry; isFirst?: boolean }) {
    const [isPending, startTransaction] = useTransition();

    const data = useAtomValue(game.data);
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
                const r = await startGame(selectEmu, game);
                store.set(atomShowingRunningGame, r);
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

    if (data instanceof Error) {
        return (
            <div className="relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110">
                <div className="flex flex-col items-center justify-center gap-2">
                    <FrownIcon className="h-8" />
                    <span className="text-sm">Error: {data.message}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110"
            data-gamepad-selectable
            onBlur={onBlur}
            onClick={onClick}
            onDoubleClick={openGame}
        >
            {isPending && (
                <div className="center absolute inset-0 bg-black/60">
                    <Spinner />
                </div>
            )}
            {data.cover ? (
                <img
                    alt={data.title}
                    className="col-span-full row-span-full object-cover"
                    src={data.cover}
                />
            ) : (
                <div className="center col-span-full row-span-full">
                    <ImageOff className="h-8" />
                </div>
            )}

            <div className="grid grid-cols-3 grid-rows-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <span className="col-span-full row-start-1 row-end-2 truncate px-3 py-2 text-center font-semibold text-lg">
                    {/* TODO: scroll text on overflow */}
                    {data.title}
                </span>

                <div className="col-start-3 col-end-4 row-start-3 row-end-4 m-2 size-6 place-self-end">
                    <Flag className="rounded-full" sfo={data.sfo} />
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

function NoGameFound() {
    const store = useStore();

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

function Grid() {
    "use no memo"; // Temporary while https://github.com/TanStack/virtual/pull/851 is not merged

    const parentRef = useRef<HTMLDivElement | null>(null);
    const [games] = useAtom(atomGameLibrary);
    const [itemPerRow, setItemPerRow] = useState(1);

    const rowCount = Math.ceil(games.length / itemPerRow);

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50,
        overscan: 1,
    });
    const items = virtualizer.getVirtualItems();

    // biome-ignore lint/correctness/useExhaustiveDependencies: In the first render, the game length running empty will be miss-leading
    useEffect(() => {
        const target = parentRef.current;
        if (target == null) {
            return;
        }
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                setItemPerRow(Math.ceil(width / 200));
            }
        });
        observer.observe(target);
        return () => {
            observer.disconnect();
        };
    }, [parentRef.current]);

    if (games.length === 0) {
        return <NoGameFound />;
    }

    return (
        <ScrollAreaPrimitive.Root
            className="z-20 flex-1 overflow-y-auto p-8 contain-strict"
            ref={parentRef}
            type="scroll"
        >
            <ScrollAreaPrimitive.Viewport
                className="relative w-full rounded-[inherit]"
                style={{
                    height: virtualizer.getTotalSize(),
                }}
            >
                <div
                    className="absolute inset-x-0 top-0"
                    style={{
                        transform: `translateY(${items[0]?.start ?? 0}px)`,
                    }}
                >
                    {items.map((row, idx) => {
                        const firstIdx = row.index * itemPerRow;
                        const lastIdx = firstIdx + itemPerRow;
                        const entries = games.slice(firstIdx, lastIdx);
                        return (
                            <div
                                className="flex gap-4 pb-4"
                                data-index={row.index}
                                key={row.key}
                                ref={virtualizer.measureElement}
                            >
                                {entries.map((game, jdx) => (
                                    <Suspense
                                        fallback={<GameBoxSkeleton />}
                                        key={game.path}
                                    >
                                        <GameBox
                                            game={game}
                                            isFirst={idx === 0 && jdx === 0}
                                        />
                                    </Suspense>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 overflow-hidden p-8">
            {Array(50)
                .fill(0)
                .map((_, i) => (
                    <GameBoxSkeleton
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
