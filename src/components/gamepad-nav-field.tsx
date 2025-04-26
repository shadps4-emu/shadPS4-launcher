import {
    type ComponentProps,
    type PropsWithChildren,
    useCallback,
    useEffect,
    useRef,
} from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import { useGamepadInputStack } from "@/hooks/useGamepadInputStack";
import type { Tuple } from "@/utils/types";

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

const SELECTABLE_DATA_ATTR = "data-gamepad-selectable";

interface Props {
    zIndex?: number;
}

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

function rectCenter(rect: DOMRect, anchor?: string | null): Point {
    const a = rectAnchors[(anchor || "CENTER") as keyof typeof rectAnchors] || [
        0.5, 0.5,
    ];
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

export function GamepadNavField({
    zIndex,
    ...props
}: PropsWithChildren<Props & ComponentProps<"div">>) {
    const divRef = useRef<HTMLDivElement>(null);
    const availableElements = useRef(new Set<HTMLElement>());

    const onMove = useCallback((x: number, y: number) => {
        const elements = availableElements.current;
        if (!elements) {
            return;
        }

        const focus = (el: HTMLElement | undefined) => {
            if (!el) {
                return;
            }
            el.focus();
        };

        const active = document.activeElement;
        if (!active?.hasAttribute(SELECTABLE_DATA_ATTR)) {
            focus(elements.values().next().value);
            return;
        }

        const activeRect = getBoundWithScroll(active);
        const activeCenter = rectCenter(
            activeRect,
            active.getAttribute(SELECTABLE_DATA_ATTR),
        );

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

        let next: HTMLElement | null = null;
        let nextDistance = Number.MAX_VALUE;
        let fallback: HTMLElement | null = null;
        let fallbackDistance = Number.MAX_VALUE;
        for (const e of elements) {
            if (e === active) {
                continue;
            }

            const rect = getBoundWithScroll(e);
            const center = rectCenter(
                rect,
                e.getAttribute(SELECTABLE_DATA_ATTR),
            );
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
            focus(next);
        } else if (fallback) {
            focus(fallback);
        }
    }, []);

    const { listen: listenButton } = useGamepadInputStack(zIndex);
    useEffect(() => {
        const bindMove = (x: number, y: number) => (e: GamepadButtonEvent) => {
            if (e.justPressed) {
                onMove(x, y);
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

    useEffect(() => {
        const targetEl = divRef.current;
        if (!targetEl) {
            return;
        }

        const list = availableElements.current;

        function iter(node: HTMLElement, toRemove = false) {
            if (node.hasAttribute(SELECTABLE_DATA_ATTR)) {
                if (toRemove) {
                    list.delete(node);
                } else {
                    list.add(node);
                }
            }
            for (const c of node.children) {
                if (c instanceof HTMLElement) {
                    iter(c);
                }
            }
        }

        const o = new MutationObserver((mutationList: MutationRecord[]) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof HTMLElement) {
                            iter(node);
                        }
                    }
                    for (const node of mutation.removedNodes) {
                        if (node instanceof HTMLElement) {
                            iter(node, true);
                        }
                    }
                } else if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === SELECTABLE_DATA_ATTR &&
                    mutation.target instanceof HTMLElement
                ) {
                    const node = mutation.target;
                    if (node.hasAttribute(SELECTABLE_DATA_ATTR)) {
                        list.add(node);
                    } else if (node.hasAttribute(SELECTABLE_DATA_ATTR)) {
                        list.delete(node);
                    }
                }
            }
        });

        o.observe(targetEl, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: [SELECTABLE_DATA_ATTR],
        });

        iter(targetEl);

        return () => o.disconnect();
    }, []);

    return <div ref={divRef} {...props} />;
}
