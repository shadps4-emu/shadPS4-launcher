import {
    createContext,
    type PropsWithChildren,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
} from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import { useGamepadInputStack } from "@/lib/hooks/useGamepadInputStack";
import type { Tuple } from "@/lib/utils/types";

export const BUTTON_MAP = {
    confirm: 0,
    back: 1,
    extra: 2,
    options: 3,
    dpad_up: 12,
    dpad_down: 13,
    dpad_left: 14,
    dpad_right: 15,
} as const;

export const BUTTON_MAP_REVERSE = {
    0: "confirm",
    1: "back",
    2: "extra",
    3: "options",
    12: "dpad_up",
    13: "dpad_down",
    14: "dpad_left",
    15: "dpad_right",
} as const;

export type GamepadButtons =
    (typeof BUTTON_MAP_REVERSE)[keyof typeof BUTTON_MAP_REVERSE];

type Props = PropsWithChildren<{
    zIndex?: number;
}>;

interface Point {
    x: number;
    y: number;
}

const rectAnchors = {
    TOP_LEFT: [0, 0],
    TOP_CENTER: [0.5, 0],
    TOP_RIGHT: [1, 0],
    CENTER_LEFT: [0, 0.5],
    CENTER: [0.5, 0.5],
    CENTER_RIGHT: [1, 0.5],
    BOTTOM_LEFT: [0, 1],
    BOTTOM_CENTER: [0.5, 1],
    BOTTOM_RIGHT: [1, 1],
} as const;

export type Anchor = keyof typeof rectAnchors;

function rectCenter(rect: DOMRect, anchor?: Anchor): Point {
    const a = rectAnchors[anchor ?? "CENTER"];
    const width = rect.width * a[0];
    const height = rect.height * a[1];
    return { x: rect.x + width, y: rect.y + height };
}

function getBoundWithScroll(element: Element): DOMRect {
    const rect = element.getBoundingClientRect();
    let parent: Element | null = element;
    while (parent != null) {
        rect.y += parent.scrollTop;
        rect.x += parent.scrollLeft;
        parent = parent.parentElement;
    }
    return rect;
}

function pointDiff(p1: Point, p2: Point): Point {
    const x = p2.x - p1.x;
    const y = p2.y - p1.y;
    return { x, y };
}

function distSquared({ x, y }: Point): number {
    return x * x + y * y;
}

export interface INavTarget {
    element: RefObject<HTMLElement | null>;
    anchor?: Anchor | undefined;
    onSelect?: ((e: GamepadButtonEvent) => void) | undefined;
    onUnselect?: ((e: GamepadButtonEvent) => void) | undefined;
}

export interface IGamepadNavField {
    register(target: INavTarget): void;
    unregister(target: INavTarget): void;
}

const context = createContext<IGamepadNavField | null>(null);

export function GamepadNavField({ zIndex, children }: Props) {
    const availableElements = useRef(new Set<INavTarget>());
    const activeTarget = useRef<INavTarget | null>(null);

    const select = useCallback((target: INavTarget, e: GamepadButtonEvent) => {
        const active = activeTarget.current;
        active?.onUnselect?.(e);
        activeTarget.current = target;
        target.onSelect?.(e);
    }, []);

    const onMove = useCallback(
        (e: GamepadButtonEvent, x: number, y: number) => {
            const elements = availableElements.current;
            if (!elements) {
                return;
            }

            const active = activeTarget.current;
            if (active == null) {
                activeTarget.current = elements.values().next().value ?? null;
                if (activeTarget.current) {
                    select(activeTarget.current, e);
                }
                return;
            }

            if (active.element.current == null) {
                return;
            }

            const activeRect = getBoundWithScroll(active.element.current);
            const activeCenter = rectCenter(activeRect, active.anchor);

            const bounds: Tuple<number, 4> = [
                Number.NEGATIVE_INFINITY, // -x
                Number.NEGATIVE_INFINITY, // -y
                Number.POSITIVE_INFINITY, // +x
                Number.POSITIVE_INFINITY, // +y
            ];

            if (x !== 0) {
                bounds[1] = activeRect.top;
                bounds[3] = activeRect.bottom;
            }
            if (y !== 0) {
                bounds[0] = activeRect.left;
                bounds[2] = activeRect.right;
            }

            let next: INavTarget | null = null;
            let nextDistance = Number.MAX_VALUE;
            let fallback: INavTarget | null = null;
            let fallbackDistance = Number.MAX_VALUE;
            for (const e of elements) {
                if (e === active) {
                    continue;
                }
                const htmlEl = e.element.current;
                if (!htmlEl) {
                    continue;
                }

                const rect = getBoundWithScroll(htmlEl);
                const center = rectCenter(rect, e.anchor);
                const diff = pointDiff(activeCenter, center);

                if (x > 0 && diff.x <= 0.01) {
                    continue;
                } else if (x < 0 && diff.x >= -0.01) {
                    continue;
                }
                if (y > 0 && diff.y <= 0.01) {
                    continue;
                } else if (y < 0 && diff.y >= -0.01) {
                    continue;
                }

                const inBounds =
                    center.x >= bounds[0] &&
                    center.x <= bounds[2] &&
                    center.y >= bounds[1] &&
                    center.y <= bounds[3];
                const dist = distSquared(diff);
                if (inBounds && dist < nextDistance) {
                    next = e;
                    nextDistance = dist;
                }

                const offset = { x: diff.x * x, y: diff.y * y };
                if (
                    offset.x >= 0 &&
                    offset.y >= 0 &&
                    (offset.x > 10 || offset.y > 10) &&
                    dist < fallbackDistance
                ) {
                    fallback = e;
                    fallbackDistance = dist;
                }
            }

            if (next) {
                select(next, e);
            } else if (fallback) {
                select(fallback, e);
            }
        },
        [select],
    );

    const { listen: listenButton } = useGamepadInputStack(zIndex);
    useEffect(() => {
        const bindMove = (x: number, y: number) => (e: GamepadButtonEvent) => {
            if (e.justPressed) {
                onMove(e, x, y);
            }
        };
        const unsub = [
            listenButton(BUTTON_MAP.dpad_up, bindMove(0, -1)),
            listenButton(BUTTON_MAP.dpad_down, bindMove(0, 1)),
            listenButton(BUTTON_MAP.dpad_left, bindMove(-1, 0)),
            listenButton(BUTTON_MAP.dpad_right, bindMove(1, 0)),
        ];
        return () => {
            for (const u of unsub) {
                u();
            }
        };
    }, [listenButton, onMove]);

    const register = (target: INavTarget) => {
        availableElements.current.add(target);
    };

    const unregister = (target: INavTarget) => {
        availableElements.current.delete(target);
        if (activeTarget.current === target) {
            activeTarget.current =
                availableElements.current.values().next().value ?? null;
        }
    };

    return (
        <context.Provider
            value={{
                register,
                unregister,
            }}
        >
            {children}
        </context.Provider>
    );
}

GamepadNavField.Context = context;
