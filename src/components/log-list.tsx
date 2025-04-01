import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { type Atom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import type { Log } from "@/store/running-games";

type Props = {
    atomLog: Atom<Log>;
};

export function LogList({ atomLog }: Props) {
    "use no memo"; // Temporary while https://github.com/TanStack/virtual/pull/851 is not merged

    const { entries: logList } = useAtomValue(atomLog);
    const parentRef = useRef<HTMLDivElement | null>(null);

    const virtualizer = useVirtualizer({
        count: logList.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 16,
        overscan: 5,
    });
    const items = virtualizer.getVirtualItems();

    useEffect(() => {
        // TODO Verify if we are at the bottom
        virtualizer.scrollToIndex(logList.length - 1);
    }, [virtualizer, logList.length]);

    return (
        <>
            <div
                className="flex-1 overflow-y-auto rounded-md border p-4 contain-strict"
                ref={parentRef}
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
                            const entry = logList[row.index]!;
                            return (
                                <div
                                    className="text-xs"
                                    data-index={row.index}
                                    key={row.key}
                                    ref={virtualizer.measureElement}
                                >
                                    <div className="py-1 hover:bg-muted">
                                        <span className="text-muted-foreground">
                                            [{format(entry.time, "pp")}]
                                        </span>{" "}
                                        <span>{entry.message}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
