import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import {
    CircleHelpIcon,
    FrownIcon,
    GlobeIcon,
    ImageOffIcon,
    PlayIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import CN from "@/assets/flags/cn.svg";
import EU from "@/assets/flags/eu.svg";
import JP from "@/assets/flags/jp.svg";
import US from "@/assets/flags/us.svg";
import { startGame } from "@/handlers/run-emu";
import type { PSF } from "@/lib/native/psf";
import { stringifyError } from "@/lib/utils/error";
import { atomShowingGameDetails } from "@/store/common";
import type { GameEntry } from "@/store/game-library";
import { gamepadActiveAtom } from "@/store/gamepad";
import { atomShowingRunningGame } from "@/store/running-games";
import { atomSelectedVersion } from "@/store/version-manager";
import GamepadIcon from "./gamepad-icon";
import { Navigable } from "./ui/navigable";
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
            return <GlobeIcon className={className} />;
        default:
            return <CircleHelpIcon className={className} />;
    }
}

export function GameBoxSkeleton() {
    return (
        <Skeleton className="aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 rounded-sm bg-zinc-800" />
    );
}

export function EmptyGameBox() {
    return (
        <div className="aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 opacity-0" />
    );
}

export function GameBox({
    game,
    isFirst,
}: {
    game: GameEntry;
    isFirst?: boolean;
}) {
    const [isPending, startTransaction] = useTransition();

    const valueData = useAtomValue(game.dataLoadable);
    const isGamepad = useAtom(gamepadActiveAtom);
    const store = useStore();
    const setShowingDetails = useSetAtom(atomShowingGameDetails);

    const [clickCount, setClickCount] = useState<number>(0);

    useEffect(() => {
        if (clickCount >= 3) {
            setClickCount(0);
            toast.info("Do a double click to start the game");
        }
    }, [clickCount]);

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

    if (valueData.state === "loading") {
        return <GameBoxSkeleton />;
    }

    if (valueData.state === "hasError") {
        return (
            <div className="relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110">
                <div className="flex flex-col items-center justify-center gap-2">
                    <FrownIcon className="h-8" />
                    <span className="text-sm">
                        Error: {stringifyError(valueData.error)}
                    </span>
                </div>
            </div>
        );
    }

    const data = valueData.data;

    return (
        <Navigable>
            <div
                className="group relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110"
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
                        <ImageOffIcon className="h-8" />
                    </div>
                )}

                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
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
                        <PlayIcon className="size-10" fill="currentColor" />
                    </button>

                    <button
                        className="col-span-full row-start-3 row-end-4 flex flex-row items-center justify-center gap-x-2 self-end py-2 transition-colors hover:bg-secondary/75 focus:bg-secondary/75"
                        onClick={() => setShowingDetails(data)}
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
        </Navigable>
    );
}
