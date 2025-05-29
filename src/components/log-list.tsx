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
import { format } from "date-fns";
import { useSetAtom } from "jotai";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { useThemeStyle } from "@/lib/hooks/useThemeStyle";
import { type LogEntry, LogLevel } from "@/lib/native/game-process";
import type { RunningGame } from "@/store/running-games";

const theme = {
    bgHeader: "#ffffff",
    bgCell: "#ffffff",
    borderColor: "#00000000",
    horizontalBorderColor: "#e2e8f0",
    textDark: "#0f172b",
} satisfies Partial<Theme>;

const darkTheme = {
    bgHeader: "#020618",
    bgCell: "#0f172b",
    borderColor: "#00000000",
    horizontalBorderColor: "#ffffff1a",
    textDark: "#d1d5db",
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
            bg: "#aeafb1",
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

const baseColumns: GridColumn[] = [
    {
        title: "Time",
        id: "time",
        width: 80,
    },
    {
        title: "Level",
        id: "level",
        width: 80,
    },
    {
        title: "Class",
        id: "class",
        width: 100,
    },
    {
        title: "Message",
        id: "message",
        grow: 1,
    },
];

type Props = {
    runningGame: RunningGame;
    levelFilter?: LogLevel[] | undefined;
    classFilter?: string[] | undefined;
};

export function LogList({ runningGame, levelFilter, classFilter }: Props) {
    "use no memo";

    const isDark = useThemeStyle() === "dark";
    const setLogCallback = useSetAtom(runningGame.log.atomCallback);

    const [columns, setColumns] = useState(() =>
        baseColumns.map((e) => ({ ...e })),
    );
    const [rowCount, setRowCount] = useState(0);
    const [rowData, setRowData] = useState<LogEntry[]>([]); // Warning, this is mutable and will not trigger re-render
    const dataGridRef = useRef<DataEditorRef | null>(null);
    const prevVisibleRegion = useRef<Rectangle | null>(null);
    const isScrollFollowing = useRef(true);

    useEffect(() => {
        runningGame.process
            .getLog({
                level: levelFilter,
                logClass: classFilter,
            })
            .then((log) => {
                setRowData(log);
                setRowCount(log.length);
            });
    }, [runningGame, levelFilter, classFilter]);

    useEffect(() => {
        const c = (log: LogEntry) => {
            if (levelFilter && !levelFilter.includes(log.level)) {
                return;
            }
            if (classFilter && !classFilter.includes(log.class)) {
                return;
            }
            rowData.push(log);
            setRowCount(rowData.length);
        };
        setLogCallback((prev) => [...prev, c]);
        return () => {
            setLogCallback((prev) => prev.filter((e) => e !== c));
        };
    }, [levelFilter, classFilter, rowData, setLogCallback]);

    useEffect(() => {
        return () => {
            rowData.splice(0, rowData.length);
        };
    }, [rowData]);

    useLayoutEffect(() => {
        if (isScrollFollowing.current) {
            dataGridRef.current?.scrollTo(
                0,
                rowCount - 1,
                "vertical",
                undefined,
                undefined,
                {
                    vAlign: "end",
                },
            );
        }
    }, [rowCount]);

    const getCellContent = useCallback(
        (cell: Item): GridCell => {
            const [col, row] = cell;
            const entry = rowData[row];
            if (!entry) {
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    displayData: "",
                    data: "",
                };
            }

            const themeOverride: Partial<Theme> = {};
            const style = (isDark ? levelThemes.dark : levelThemes.light)[
                entry.level
            ];

            let kind = GridCellKind.Text;
            let data = "";
            let contentAlign: "left" | "right" | "center" = "left";
            if (col === 0) {
                data = format(new Date(entry.time), "pp");
            } else if (col === 1) {
                kind = GridCellKind.Bubble;
                data = entry.level.toUpperCase();
                contentAlign = "center";
                themeOverride.bgBubble = style.bg;
                themeOverride.bgBubbleSelected = style.bg;
                themeOverride.textBubble = style.text;
            } else if (col === 2) {
                data = entry.class;
                themeOverride.textDark = "#60a5fa";
            } else if (col === 3) {
                data = entry.message;
            }

            const level =
                (entry.level[0]?.toUpperCase() ?? "") + entry.level.slice(1);
            const copyData = `[${entry.class}] <${level}> ${entry.message}`;

            const r = {
                allowOverlay: true,
                displayData: data,
                copyData,
                themeOverride,
                contentAlign,
            };
            if (kind === GridCellKind.Text) {
                return {
                    kind,
                    data,
                    ...r,
                };
            } else if (kind === GridCellKind.Bubble) {
                return {
                    kind,
                    data: [data],
                    ...r,
                };
            } else {
                throw new Error("Unexpected cell kind");
            }
        },
        [rowData, isDark],
    );

    const getCellForSelection = useCallback(
        (selection: Rectangle): CellArray => {
            return Array(selection.height)
                .fill(undefined)
                .map((_, idx): TextCell[] => {
                    const row = selection.y + idx;
                    const entry = rowData[row];
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
                            data: "",
                            displayData: "",
                            copyData: data,
                        },
                    ];
                })
                .filter((e) => e.length > 0);
        },
        [rowData],
    );

    const onVisibleRegionChanged = useCallback(
        (range: Rectangle) => {
            if (isScrollFollowing.current) {
                const prev = prevVisibleRegion.current;
                if (prev && prev.y + prev.height > range.y + range.height) {
                    isScrollFollowing.current = false;
                }
            } else if (range.y + range.height >= rowCount) {
                isScrollFollowing.current = true;
            }
            prevVisibleRegion.current = range;
        },
        [rowCount],
    );

    const onColumnResize = useCallback(
        (_column: GridColumn, newSize: number, colIndex: number) => {
            setColumns((prev) =>
                prev.map((e, idx) => {
                    if (idx === colIndex) {
                        return { ...e, width: newSize };
                    }
                    return e;
                }),
            );
        },
        [],
    );

    return (
        <>
            <div className="flex-1 overflow-y-auto rounded-md border contain-strict">
                <DataEditor
                    columns={columns}
                    drawHeader={() => false}
                    getCellContent={getCellContent}
                    getCellsForSelection={getCellForSelection}
                    headerHeight={8}
                    onColumnResize={onColumnResize}
                    onVisibleRegionChanged={onVisibleRegionChanged}
                    ref={dataGridRef}
                    rows={rowCount}
                    theme={isDark ? darkTheme : theme}
                    width="100%"
                />
            </div>
        </>
    );
}
