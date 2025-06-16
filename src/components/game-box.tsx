import { useAtomValue, useSetAtom, useStore } from "jotai";
import {
    CircleHelpIcon,
    EllipsisIcon,
    FrownIcon,
    GlobeIcon,
    PlayIcon,
} from "lucide-react";
import {
    type MouseEvent as ReactMouseEvent,
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
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import { startGame } from "@/handlers/run-emu";
import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import type { PSF } from "@/lib/native/psf";
import { stringifyError } from "@/lib/utils/error";
import { cn } from "@/lib/utils/ui";
import { atomShowingGameDetails } from "@/store/common";
import type { GameRow } from "@/store/db";
import { gamepadActiveAtom } from "@/store/gamepad";
import { atomEmuUserPath } from "@/store/paths";
import { atomShowingRunningGame } from "@/store/running-games";
import { atomSelectedVersion } from "@/store/version-manager";
import { GameBoxCover } from "./game-cover";
import GamepadIcon, { ButtonType } from "./gamepad-icon";
import { Button } from "./ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "./ui/context-menu";
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

export function GameBoxSkeleton({ className }: { className?: string }) {
    return (
        <Skeleton
            className={cn(
                "aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 rounded-sm bg-zinc-800",
                className,
            )}
        />
    );
}

export function EmptyGameBox() {
    return (
        <div className="aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 opacity-0" />
    );
}

export function GameBoxError({ err }: { err: Error }) {
    return (
        <div className="relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform">
            <div className="flex flex-col items-center justify-center gap-2">
                <FrownIcon className="h-8" />
                <span className="text-sm">Error: {stringifyError(err)}</span>
            </div>
        </div>
    );
}

export function GameBox({ game }: { game: GameRow; isFirst?: boolean }) {
    const [isPending, startTransaction] = useTransition();

    const isGamepad = useAtomValue(gamepadActiveAtom);
    const store = useStore();
    const setShowingDetails = useSetAtom(atomShowingGameDetails);

    const [clickCount, setClickCount] = useState(0);
    const [isContextOpen, setContextOpen] = useState(false);
    const contextMenuRef = useRef<HTMLSpanElement>(null);
    const contextOpenButtonRef = useRef<HTMLButtonElement>(null);

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
                const userDir = store.get(atomEmuUserPath);
                const r = await startGame(selectEmu, game, userDir);
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

    const openDetails = () => {
        setShowingDetails(game);
    };

    const openContext = (e: ReactMouseEvent | null) => {
        e?.preventDefault();
        e?.stopPropagation();

        const s = contextMenuRef.current;
        if (s) {
            const pos = (
                contextOpenButtonRef.current || s
            ).getBoundingClientRect();
            s.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    screenX: pos.x,
                    screenY: pos.y,
                    clientX: pos.x,
                    clientY: pos.y,
                }),
            );
        }
    };

    const onButtonPress = (btn: NavButton, e: GamepadButtonEvent) => {
        if (btn === "options") {
            openContext(null);
        } else if (btn === "confirm") {
            e.preventDefault();
            openGame();
        }
    };

    return (
        <ContextMenu onOpenChange={setContextOpen}>
            <ContextMenuTrigger asChild ref={contextMenuRef}>
                <Navigable onButtonPress={onButtonPress}>
                    <div
                        className="group relative aspect-square h-auto w-full min-w-[150px] max-w-[200px] flex-1 cursor-pointer overflow-hidden rounded-sm bg-zinc-800 transition-transform focus-within:scale-110 hover:scale-110 data-gamepad-focus:scale-110"
                        onBlur={onBlur}
                        onClick={onClick}
                        onDoubleClick={openGame}
                    >
                        {isPending && (
                            <div className="center absolute inset-0 bg-black/60">
                                <Spinner />
                            </div>
                        )}
                        <GameBoxCover game={game} />

                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-data-gamepad-focus:opacity-100">
                            <span className="col-span-full row-start-1 row-end-2 truncate px-3 py-2 text-center font-semibold text-lg">
                                {/* TODO: scroll text on overflow */}
                                {game.title}
                            </span>

                            <div className="col-start-1 col-end-4 row-start-3 row-end-4 m-2 flex h-8 justify-between self-end">
                                <Button
                                    className="cursor-help"
                                    onClick={openContext}
                                    ref={contextOpenButtonRef}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                >
                                    {isGamepad ? (
                                        <GamepadIcon
                                            className="animate-pulse"
                                            icon={ButtonType.BUTTON_UP}
                                        />
                                    ) : (
                                        <EllipsisIcon />
                                    )}
                                </Button>
                                <Flag className="rounded-full" sfo={game.sfo} />
                            </div>

                            <button
                                className="col-span-full row-span-full grid size-16 place-items-center place-self-center rounded-full bg-black/75"
                                data-play-game={""}
                                type="button"
                            >
                                <PlayIcon
                                    className="size-10"
                                    fill="currentColor"
                                />
                            </button>
                        </div>
                    </div>
                </Navigable>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <GamepadNavField
                    debugName="game-context-menu"
                    enabled={isContextOpen}
                >
                    <Navigable>
                        <ContextMenuItem autoFocus onClick={openDetails}>
                            Details
                        </ContextMenuItem>
                    </Navigable>
                </GamepadNavField>
            </ContextMenuContent>
        </ContextMenu>
    );
}
