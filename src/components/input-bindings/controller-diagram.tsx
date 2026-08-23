import {
    type ReactNode,
    type RefObject,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import dualsenseSvg from "@/assets/controllers/dualsense.svg";
import type { BindableOutput } from "@/lib/input-config";
import { cn } from "@/lib/utils/ui";

/** Hotspots are expressed in `dualsense.svg` user units (128x128 viewBox). */
const SVG_VIEWBOX = 128;
/** Topmost `y` of the artwork; everything above it is empty canvas. */
const SILHOUETTE_TOP = 26;

/** Chips live in vertical rails beside the artwork, or in a row above it. */
type Rail = "left" | "right" | "top";

type MapEntry = {
    output: BindableOutput;
    rail: Rail;
    /** Row along the rail. Both vertical rails share one lane grid. */
    lane: number;
    /** Hotspot on the artwork, in SVG user units. */
    x: number;
    y: number;
};

const LANE_COUNT = 10;

/**
 * Hotspots below were read off the SVG paths, so markers land on the real
 * button geometry. Lanes are ordered by hotspot `y` to keep leader lines from
 * crossing each other.
 */
const CONTROLLER_MAP: MapEntry[] = [
    { lane: 0, output: "l2", rail: "left", x: 27, y: 27.8 },
    { lane: 1, output: "l1", rail: "left", x: 31, y: 31.6 },
    { lane: 2, output: "pad_up", rail: "left", x: 29, y: 42.9 },
    { lane: 3, output: "pad_left", rail: "left", x: 22.5, y: 49 },
    { lane: 4, output: "pad_right", rail: "left", x: 35.5, y: 49 },
    { lane: 5, output: "pad_down", rail: "left", x: 29, y: 55 },
    { lane: 6, output: "l3", rail: "left", x: 45.5, y: 64.5 },
    { lane: 7, output: "axis_left_x", rail: "left", x: 40.5, y: 64.5 },
    { lane: 8, output: "axis_left_y", rail: "left", x: 45.5, y: 69.5 },
    { lane: 0, output: "r2", rail: "right", x: 101, y: 27.8 },
    { lane: 1, output: "r1", rail: "right", x: 97, y: 31.6 },
    { lane: 2, output: "options", rail: "right", x: 90.5, y: 35.5 },
    { lane: 3, output: "triangle", rail: "right", x: 99, y: 39.9 },
    { lane: 4, output: "circle", rail: "right", x: 107, y: 47.9 },
    { lane: 5, output: "square", rail: "right", x: 91, y: 47.9 },
    { lane: 6, output: "cross", rail: "right", x: 99, y: 55.9 },
    { lane: 7, output: "r3", rail: "right", x: 82.5, y: 64.5 },
    { lane: 8, output: "axis_right_x", rail: "right", x: 87.5, y: 64.5 },
    { lane: 9, output: "axis_right_y", rail: "right", x: 82.5, y: 69.5 },
    { lane: 0, output: "touchpad_left", rail: "top", x: 52, y: 40.5 },
    { lane: 0, output: "touchpad_center", rail: "top", x: 64, y: 40.5 },
    { lane: 0, output: "touchpad_right", rail: "top", x: 76, y: 40.5 },
];

/** Outputs the map already covers; the panel lists the rest separately. */
export const CONTROLLER_DIAGRAM_OUTPUTS: ReadonlySet<BindableOutput> = new Set(
    CONTROLLER_MAP.map((entry) => entry.output),
);

const RAIL_MIN_WIDTH = 152;
const RAIL_MAX_WIDTH = 208;
const RAIL_GUTTER = 10;
const STAGE_MIN_SIZE = 380;
const CHIP_MIN_HEIGHT = 38;
const CHIP_MAX_HEIGHT = 48;
const TOP_ROW_GAP = 10;

type Box = { width: number; height: number };

type Rect = { left: number; top: number; width: number; height: number };

type Placement = {
    output: BindableOutput;
    chip: Rect;
    /** Leader line from the chip edge to the hotspot, in box pixels. */
    line: { x1: number; y1: number; x2: number; y2: number };
};

type Plan = {
    stage: Rect;
    placements: Placement[];
};

/**
 * Lay the map out in pixels: a square artwork stage centred in the box, with
 * chips parked in the empty margins around it. Pixels (instead of percentages)
 * keep hotspots glued to the artwork at any container aspect ratio.
 */
function buildPlan(box: Box): Plan | null {
    const size = Math.min(box.height, box.width - 2 * RAIL_MIN_WIDTH);
    if (size < STAGE_MIN_SIZE) {
        return null;
    }

    const stageLeft = (box.width - size) / 2;
    const stageTop = (box.height - size) / 2;
    const railWidth = Math.min(RAIL_MAX_WIDTH, stageLeft);
    const railInset = stageLeft - railWidth;
    const chipWidth = railWidth - RAIL_GUTTER;
    const laneStep = box.height / LANE_COUNT;
    const chipHeight = Math.max(
        CHIP_MIN_HEIGHT,
        Math.min(CHIP_MAX_HEIGHT, laneStep - 10),
    );

    const atX = (x: number) => stageLeft + (x / SVG_VIEWBOX) * size;
    const atY = (y: number) => stageTop + (y / SVG_VIEWBOX) * size;

    const topCount = CONTROLLER_MAP.filter(
        (entry) => entry.rail === "top",
    ).length;
    const topChipWidth = Math.min(
        chipWidth,
        (size - (topCount - 1) * TOP_ROW_GAP) / topCount,
    );
    const topRowWidth = topChipWidth * topCount + TOP_ROW_GAP * (topCount - 1);
    const topRowLeft = stageLeft + (size - topRowWidth) / 2;
    const topRowTop = Math.max(2, atY(SILHOUETTE_TOP) - chipHeight - 14);

    let topIndex = 0;
    const placements = CONTROLLER_MAP.map((entry): Placement => {
        const hotX = atX(entry.x);
        const hotY = atY(entry.y);

        if (entry.rail === "top") {
            const left = topRowLeft + topIndex * (topChipWidth + TOP_ROW_GAP);
            topIndex += 1;
            return {
                chip: {
                    height: chipHeight,
                    left,
                    top: topRowTop,
                    width: topChipWidth,
                },
                line: {
                    x1: left + topChipWidth / 2,
                    x2: hotX,
                    y1: topRowTop + chipHeight,
                    y2: hotY,
                },
                output: entry.output,
            };
        }

        const onLeft = entry.rail === "left";
        const left = onLeft ? railInset : box.width - railInset - chipWidth;
        const top = entry.lane * laneStep + (laneStep - chipHeight) / 2;
        return {
            chip: { height: chipHeight, left, top, width: chipWidth },
            line: {
                x1: onLeft ? left + chipWidth : left,
                x2: hotX,
                y1: top + chipHeight / 2,
                y2: hotY,
            },
            output: entry.output,
        };
    });

    return {
        placements,
        stage: { height: size, left: stageLeft, top: stageTop, width: size },
    };
}

function useBoxSize<T extends HTMLElement>(): [RefObject<T | null>, Box] {
    const ref = useRef<T>(null);
    const [box, setBox] = useState<Box>({ height: 0, width: 0 });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const update = (width: number, height: number) => {
            setBox((prev) =>
                prev.width === width && prev.height === height
                    ? prev
                    : { height, width },
            );
        };

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;
            if (rect) {
                update(rect.width, rect.height);
            }
        });
        observer.observe(element);
        update(element.clientWidth, element.clientHeight);

        return () => observer.disconnect();
    }, []);

    return [ref, box];
}

type Props = {
    renderSlot: (output: BindableOutput) => ReactNode;
    /** Output currently waiting for an input; its hotspot is highlighted. */
    activeOutput?: string | null;
    className?: string;
};

export function ControllerDiagram({
    renderSlot,
    activeOutput,
    className,
}: Props) {
    const [boxRef, box] = useBoxSize<HTMLDivElement>();
    const [hovered, setHovered] = useState<string | null>(null);
    const plan = useMemo(() => buildPlan(box), [box]);

    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-black/30 to-amber-500/10",
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,85,247,0.2),transparent_55%),radial-gradient(circle_at_15%_85%,rgba(245,158,11,0.1),transparent_45%)]" />

            <div className="absolute inset-2.5" ref={boxRef}>
                {plan ? (
                    <>
                        <img
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute opacity-90 brightness-0 drop-shadow-[0_0_24px_rgba(168,85,247,0.35)] invert"
                            draggable={false}
                            src={dualsenseSvg}
                            style={{
                                height: plan.stage.height,
                                left: plan.stage.left,
                                top: plan.stage.top,
                                width: plan.stage.width,
                            }}
                        />

                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 size-full"
                            role="presentation"
                            viewBox={`0 0 ${box.width} ${box.height}`}
                        >
                            {plan.placements.map(({ output, line }) => {
                                const active =
                                    hovered === output ||
                                    activeOutput === output;
                                return (
                                    <g key={output}>
                                        <line
                                            stroke={
                                                active
                                                    ? "rgb(240 171 252)"
                                                    : "rgb(255 255 255)"
                                            }
                                            strokeOpacity={active ? 0.9 : 0.16}
                                            strokeWidth={active ? 1.5 : 1}
                                            x1={line.x1}
                                            x2={line.x2}
                                            y1={line.y1}
                                            y2={line.y2}
                                        />
                                        <circle
                                            cx={line.x2}
                                            cy={line.y2}
                                            fill={
                                                active
                                                    ? "rgb(240 171 252)"
                                                    : "rgb(196 181 253)"
                                            }
                                            fillOpacity={active ? 1 : 0.7}
                                            r={active ? 3.5 : 2.5}
                                        />
                                        <circle
                                            cx={line.x2}
                                            cy={line.y2}
                                            fill="none"
                                            r={active ? 7 : 5}
                                            stroke={
                                                active
                                                    ? "rgb(240 171 252)"
                                                    : "rgb(196 181 253)"
                                            }
                                            strokeOpacity={active ? 0.8 : 0.3}
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        {plan.placements.map(({ output, chip }) => (
                            <div
                                className="absolute"
                                key={output}
                                onBlurCapture={() => setHovered(null)}
                                onFocusCapture={() => setHovered(output)}
                                onMouseEnter={() => setHovered(output)}
                                onMouseLeave={() => setHovered(null)}
                                role="group"
                                style={chip}
                            >
                                {renderSlot(output)}
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="grid h-full auto-rows-[3rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                        {CONTROLLER_MAP.map((entry) => (
                            <div key={entry.output}>
                                {renderSlot(entry.output)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="pointer-events-none absolute bottom-1.5 left-3 text-[9px] text-muted-foreground/40 leading-tight">
                Artwork: Alex Martynov — CC Attribution
            </p>
        </section>
    );
}
