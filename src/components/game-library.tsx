import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { useVirtualizer } from "@tanstack/react-virtual";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { useAtomValue, useStore } from "jotai";
import {
    Fragment,
    Suspense,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { openPath } from "@/lib/native/common";
import {
    atomGameLibrary,
    atomGameLibrarySorting,
    SortType,
} from "@/store/game-library";
import { atomGamesPath } from "@/store/paths";
import {
    EmptyGameBox,
    GameBox,
    GameBoxError,
    GameBoxSkeleton,
} from "./game-box";
import { ScrollBar } from "./ui/scroll-area";

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

function Grid({ search }: { search: string }) {
    "use no memo"; // Temporary while https://github.com/TanStack/virtual/pull/851 is not merged

    const parentRef = useRef<HTMLDivElement | null>(null);
    const games = useAtomValue(atomGameLibrary);
    const sortType = useAtomValue(atomGameLibrarySorting);
    const [itemPerRow, setItemPerRow] = useState(1);

    const sortedGames = useMemo(() => {
        const r = search.toLowerCase();
        const list =
            search.length === 0
                ? games
                : games.filter((e) => e.title.toLowerCase().includes(r));
        switch (sortType) {
            case SortType.NONE:
                return list;
            case SortType.TITLE:
                return list.toSorted((a, b) => a.title.localeCompare(b.title));
            case SortType.CUSA:
                return list.toSorted((a, b) => a.cusa.localeCompare(b.cusa));
            default: {
                const _ret: never = sortType;
                return _ret;
            }
        }
    }, [games, search, sortType]);

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
            <div
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
                    {items.map((row) => {
                        const firstIdx = row.index * itemPerRow;
                        const lastIdx = firstIdx + itemPerRow;
                        const entries = sortedGames.slice(firstIdx, lastIdx);
                        return (
                            <div
                                className="flex gap-4 pb-4"
                                data-index={row.index}
                                key={row.key}
                                ref={virtualizer.measureElement}
                            >
                                {entries.map((game) => (
                                    <Fragment key={game.path}>
                                        {"error" in game && game.error ? (
                                            <GameBoxError err={game.error} />
                                        ) : (
                                            <GameBox game={game} />
                                        )}
                                    </Fragment>
                                ))}
                                {Array(itemPerRow - entries.length)
                                    .fill(0)
                                    .map((_, i) => (
                                        <EmptyGameBox key={i} />
                                    ))}
                            </div>
                        );
                    })}
                </div>
            </div>
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

type Props = {
    search: string;
};

export function GameLibrary({ search }: Props) {
    return (
        <Suspense fallback={<GridSkeleton />}>
            <Grid search={search} />
        </Suspense>
    );
}
