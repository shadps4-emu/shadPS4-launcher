import {
    type CellArray,
    DataEditor,
    type DataEditorRef,
    type GridCell,
    GridCellKind,
    type GridColumn,
    type Item,
    type Rectangle,
    type TextCell,
    type Theme,
} from "@glideapps/glide-data-grid";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useThemeStyle } from "@/lib/hooks/useThemeStyle";
import { type LogEntry, LogLevel } from "@/lib/native/game-process";
import type { RunningGame } from "@/store/running-games";

const theme = {
    bgHeader: "#ffffff",
    bgCell: "#ffffff",
} satisfies Partial<Theme>;

const darkTheme = {
    bgHeader: "#020618",
    bgCell: "#020618",
} satisfies Partial<Theme>;

type LevelTheme = {
    bg: string;
    text: string;
};

const levelThemes = {
    light: {
        [LogLevel.UNKNOWN]: {
            bg: "#ffffff",
            text: "#000000",
        },
        [LogLevel.TRACE]: {
            bg: "#f9fafb",
            text: "#6b7280",
        },
        [LogLevel.DEBUG]: {
            bg: "#f3f4f6",
            text: "#4b5563",
        },
        [LogLevel.INFO]: {
            bg: "#eff6ff",
            text: "#1d4ed8",
        },
        [LogLevel.WARNING]: {
            bg: "#fef3c7",
            text: "#92400e",
        },
        [LogLevel.ERROR]: {
            bg: "#fee2e2",
            text: "#b91c1c",
        },
        [LogLevel.CRITICAL]: {
            bg: "#fef2f2",
            text: "#7f1d1d",
        },
    },
    dark: {
        [LogLevel.UNKNOWN]: {
            bg: "#1f2937",
            text: "#d1d5db",
        },
        [LogLevel.TRACE]: {
            bg: "#111827",
            text: "#9ca3af",
        },
        [LogLevel.DEBUG]: {
            bg: "#1f2937",
            text: "#d1d5db",
        },
        [LogLevel.INFO]: {
            bg: "#1e3a8a",
            text: "#dbeafe",
        },
        [LogLevel.WARNING]: {
            bg: "#78350f",
            text: "#fef3c7",
        },
        [LogLevel.ERROR]: {
            bg: "#7f1d1d",
            text: "#fee2e2",
        },
        [LogLevel.CRITICAL]: {
            bg: "#7f1d1d",
            text: "#fef2f2",
        },
    },
} as const satisfies {
    light: Record<LogLevel, LevelTheme>;
    dark: Record<LogLevel, LevelTheme>;
};

const columns: GridColumn[] = [
    /* {
        title: "Time",
        id: "time",
    }, */
    {
        title: "Level",
        id: "level",
        width: 80,
    },
    {
        title: "Class",
        id: "class",
        width: 150,
    },
    {
        title: "Message",
        id: "message",
        grow: 1,
    },
];

const colSize = columns.length;

const BATCH_SIZE = 1000;

type Props = {
    runningGame: RunningGame;
};

export function LogList({ runningGame }: Props) {
    "use no memo"; // Temporary while https://github.com/TanStack/virtual/pull/851 is not merged

    const isDark = useThemeStyle() === "dark";
    const setLogCallback = useSetAtom(runningGame.log.atomCallback);
    const logCount = useAtomValue(runningGame.log.atomCount);

    const groups = useRef<Record<number, LogEntry[]>>({});
    const fetchingData = useRef(new Set());
    const dataGridRef = useRef<DataEditorRef | null>(null);
    const prevVisibleRegion = useRef<Rectangle | null>(null);
    const isScrollFollowing = useRef(true);

    const queryGroup = useCallback(
        (groupId: number) => {
            if (fetchingData.current.has(groupId)) {
                return;
            }

            fetchingData.current.add(groupId);
            const begin = groupId * BATCH_SIZE;
            const end = groupId * BATCH_SIZE + BATCH_SIZE;
            runningGame.process
                .getLog({
                    begin,
                    end,
                })
                .then((group) => {
                    groups.current[groupId] = group;
                    dataGridRef.current?.updateCells(
                        Array((end - begin) * colSize)
                            .fill(undefined)
                            .map((_, idx) => ({
                                cell: [
                                    idx % colSize,
                                    ((idx / colSize) | 0) + begin,
                                ],
                            })),
                    );
                })
                .finally(() => {
                    fetchingData.current.delete(groupId);
                });
        },
        [runningGame.process],
    );

    useEffect(() => {
        const c = (log: LogEntry) => {
            const groupId = (log.rowId / BATCH_SIZE) | 0;
            let group = groups.current[groupId];
            if (!group) {
                const lastGroupId = (log.rowId - 1) / BATCH_SIZE;
                if (lastGroupId !== groupId) {
                    group = groups.current[groupId] = [];
                } else {
                    return;
                }
            }
            group.push(log);
            const dataGrid = dataGridRef.current;
            if (!dataGrid) {
                return;
            }
            dataGrid.updateCells(
                Array(colSize)
                    .fill(undefined)
                    .map((_, idx) => ({
                        cell: [idx, log.rowId],
                    })),
            );
            if (isScrollFollowing.current) {
                dataGrid.scrollTo(0, log.rowId - 1);
            }
        };
        setLogCallback((prev) => [...prev, c]);
        return () => {
            setLogCallback((prev) => prev.filter((e) => e !== c));
        };
    });

    const getCellContent = useCallback(
        (cell: Item): GridCell => {
            const [col, row] = cell;
            const groupId = (row / BATCH_SIZE) | 0;
            const group = groups.current[groupId];
            if (!group) {
                queryGroup(groupId);
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    displayData: "",
                    data: "",
                };
            }
            const entry = group[row % BATCH_SIZE];
            if (!entry) {
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    displayData: "",
                    data: "",
                };
            }

            const keys = Object.keys(groups);
            const firstGroup = groupId - 5;
            const lastGroup = groupId + 5;
            for (const k of keys) {
                const kn = Number(k);
                if (kn < firstGroup - 2 || kn > lastGroup + 2) {
                    delete groups.current[kn];
                }
            }
            const themeOverride: Partial<Theme> = {};
            const style = (isDark ? levelThemes.dark : levelThemes.light)[
                entry.level
            ];
            themeOverride.bgCell = style.bg;
            themeOverride.textDark = style.text;
            themeOverride.textMedium = style.text;
            themeOverride.textLight = style.text;

            let data = "";
            let contentAlign: "left" | "right" | "center" = "left";
            if (col === 0) {
                data = entry.level.toUpperCase();
                contentAlign = "center";
            } else if (col === 1) {
                data = entry.class;
            } else if (col === 2) {
                data = entry.message;
            }

            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                data,
                displayData: data,
                themeOverride,
                contentAlign,
            };
        },
        [queryGroup, isDark],
    );

    const getCellForSelection = useCallback(
        (selection: Rectangle): CellArray => {
            return Array(selection.height)
                .fill(undefined)
                .map((_, idx): TextCell[] => {
                    const row = selection.y + idx;
                    const groupId = (row / BATCH_SIZE) | 0;
                    const group = groups.current[groupId];
                    if (!group) {
                        queryGroup(groupId);
                        return [];
                    }
                    const entry = group[row % BATCH_SIZE];
                    if (!entry) {
                        return [];
                    }

                    const level =
                        (entry.level[0]?.toUpperCase() ?? "") +
                        entry.level.slice(1);
                    const data = `[${entry.class}] <${level}> ${entry.message}`;

                    return [
                        {
                            kind: GridCellKind.Text,
                            allowOverlay: true,
                            data,
                            displayData: data,
                        },
                    ];
                })
                .filter((e) => e.length > 0);
        },
        [queryGroup],
    );

    const onVisibleRegionChanged = useCallback(
        (range: Rectangle) => {
            if (isScrollFollowing.current) {
                const prev = prevVisibleRegion.current;
                if (prev && prev.y > range.y) {
                    isScrollFollowing.current = false;
                }
            } else if (range.y + range.height >= logCount) {
                isScrollFollowing.current = true;
            }
            prevVisibleRegion.current = range;
        },
        [logCount],
    );

    return (
        <>
            <div className="flex-1 overflow-y-auto rounded-md border p-4 contain-strict">
                <DataEditor
                    columns={columns}
                    drawHeader={() => false}
                    getCellContent={getCellContent}
                    getCellsForSelection={getCellForSelection}
                    headerHeight={0}
                    onVisibleRegionChanged={onVisibleRegionChanged}
                    ref={dataGridRef}
                    rows={logCount}
                    theme={isDark ? darkTheme : theme}
                    width="100%"
                />
            </div>
        </>
    );
}
