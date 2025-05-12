import type { UnlistenFn } from "@tauri-apps/api/event";
import {
    createContext,
    type PropsWithChildren,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
} from "react";
import { GamepadButtonEvent } from "@/handlers/gamepad";
import {
    type GamepadInputStackHookProps,
    useGamepadInputStack,
} from "@/lib/hooks/useGamepadInputStack";
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
    "0": "confirm",
    "1": "back",
    "2": "extra",
    "3": "options",
    "12": "dpad_up",
    "13": "dpad_down",
    "14": "dpad_left",
    "15": "dpad_right",
} as const satisfies {
    [V in (typeof BUTTON_MAP)[keyof typeof BUTTON_MAP] &
        PropertyKey]: keyof typeof BUTTON_MAP;
};

export type GamepadButton =
    (typeof BUTTON_MAP_REVERSE)[keyof typeof BUTTON_MAP_REVERSE];

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
    onSelect?:
        | ((btn: GamepadButton | null, e: GamepadButtonEvent) => void)
        | undefined;
    onUnselect?:
        | ((btn: GamepadButton | null, e: GamepadButtonEvent) => void)
        | undefined;
    onButtonPress?:
        | ((btn: GamepadButton, e: GamepadButtonEvent) => void)
        | undefined;
}

export interface IGamepadNavField {
    register(target: INavTarget, grabFocus?: boolean): symbol;
    unregister(symbol: symbol): void;
}

const context = createContext<IGamepadNavField | null>(null);

type Props = PropsWithChildren<
    GamepadInputStackHookProps & {
        onButtonPress?:
            | ((
                  btn: GamepadButton,
                  target: INavTarget | null,
                  e: GamepadButtonEvent,
              ) => void)
            | undefined;
    }
>;

export function GamepadNavField({
    onButtonPress,
    children,
    ...hookProps
}: Props) {
    const enabled = hookProps.enabled;
    const { listen: listenButton } = useGamepadInputStack(hookProps);
    const availableElements = useRef<(INavTarget & { symbol: symbol })[]>([]);
    const activeTarget = useRef<INavTarget | null>(null);

    const select = useCallback(
        (
            target: INavTarget,
            btn: GamepadButton | null,
            e: GamepadButtonEvent,
        ) => {
            const active = activeTarget.current;
            if (btn) {
                active?.onButtonPress?.(btn, e);
            }
            if (e.isPreventingDefault) {
                return;
            }
            active?.onUnselect?.(btn, e);
            if (e.isPreventingDefault) {
                return;
            }
            activeTarget.current = target;
            target.onSelect?.(btn, e);
        },
        [],
    );

    const onMove = useCallback(
        (btn: GamepadButton, e: GamepadButtonEvent, x: number, y: number) => {
            const elements = availableElements.current;

            const active = activeTarget.current;
            onButtonPress?.(btn, active, e);
            if (e.isPreventingDefault) {
                return;
            }

            if (active == null) {
                activeTarget.current = elements.values().next().value ?? null;
                if (activeTarget.current) {
                    select(activeTarget.current, btn, e);
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
                select(next, btn, e);
            } else if (fallback) {
                select(fallback, btn, e);
            }
        },
        [onButtonPress, select],
    );

    const onButton = useCallback(
        (btn: GamepadButton, e: GamepadButtonEvent) => {
            const active = activeTarget.current;
            onButtonPress?.(btn, active, e);
            if (e.isPreventingDefault) {
                return;
            }
            active?.onButtonPress?.(btn, e);
        },
        [onButtonPress],
    );

    useEffect(() => {
        if (enabled === false) {
            return;
        }
        const unsub: UnlistenFn[] = [];
        const bindMove = (btn: GamepadButton, x: number, y: number) => {
            const callback = (e: GamepadButtonEvent) => {
                if (e.justPressed) {
                    onMove(btn, e, x, y);
                }
            };
            const code = BUTTON_MAP[btn];
            unsub.push(listenButton(code, callback));
        };
        const bindButton = (btn: GamepadButton) => {
            const callback = (e: GamepadButtonEvent) => {
                if (e.justPressed) {
                    onButton(btn, e);
                }
            };
            unsub.push(listenButton(BUTTON_MAP[btn], callback));
        };
        bindMove("dpad_up", 0, -1);
        bindMove("dpad_down", 0, 1);
        bindMove("dpad_left", -1, 0);
        bindMove("dpad_right", 1, 0);
        bindButton("confirm");
        bindButton("back");
        bindButton("extra");
        bindButton("options");
        return () => {
            for (const u of unsub) {
                u();
            }
        };
    }, [enabled, listenButton, onMove, onButton]);

    const register = useCallback(
        (target: INavTarget, grabFocus = false) => {
            if (
                availableElements.current.some(
                    (e) => e.element.current === target.element.current,
                )
            ) {
                throw new Error("Registering nav element twice!");
            }
            const symbol = Symbol();
            availableElements.current.push({ ...target, symbol });
            if (
                grabFocus ||
                document.activeElement === target.element.current
            ) {
                select(
                    target,
                    null,
                    new GamepadButtonEvent(-1, true, true, false),
                );
            }
            return symbol;
        },
        [select],
    );

    const unregister = useCallback((symbol: symbol) => {
        const idx = availableElements.current.findIndex(
            (e) => e.symbol === symbol,
        );
        if (idx === -1) {
            return;
        }
        const target = availableElements.current[idx];
        availableElements.current.splice(idx, 1);
        if (activeTarget.current === target) {
            activeTarget.current =
                availableElements.current.values().next().value ?? null;
        }
    }, []);

    useEffect(() => {
        if (enabled !== false) {
            setTimeout(() => {
                const activeEl = document.activeElement;
                const activeTarget = availableElements.current.find(
                    (e) => e.element.current === activeEl,
                );
                if (activeTarget) {
                    select(
                        activeTarget,
                        null,
                        new GamepadButtonEvent(-1, true, true, false),
                    );
                }
            }, 1);
        }
    }, [enabled, select]);

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
