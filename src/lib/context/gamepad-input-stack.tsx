import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useEffect,
    useRef,
} from "react";
import {
    addGamepadButtonListener,
    type GamepadButtonEvent,
    removeGamepadButtonListener,
} from "@/handlers/gamepad";

type Callback = (e: GamepadButtonEvent) => void;

export interface Target {
    zIndex: number;
    symbol: symbol;

    listener: Map<number, Callback[]>;
}

type Unlisten = () => void;

interface IGamepadInputStack {
    isOnTop(symbol: symbol): boolean;
    getNextZIndex(): number;

    add(zIndex?: number, debugName?: string): symbol;
    del(symbol: symbol): void;

    listen(symbol: symbol, button: number, callback: Callback): Unlisten;
}

const context = createContext<IGamepadInputStack | null>(null);

function compare(a: Target, b: Target): number {
    return b.zIndex - a.zIndex;
}

export function GamepadInputStackProvider({ children }: PropsWithChildren) {
    const targets = useRef<Target[]>([]);

    const getNextZIndex = useCallback(() => {
        return (targets.current[0]?.zIndex || 0) + 1;
    }, []);

    const isOnTop = useCallback((symbol: symbol) => {
        return targets.current[0]?.symbol === symbol;
    }, []);

    const add = useCallback(
        (_zIndex?: number, debugName?: string): symbol => {
            const symbol = Symbol();
            const zIndex = _zIndex ?? getNextZIndex();
            const newTarget = {
                zIndex,
                symbol,
                listener: new Map(),
                debugName,
            };
            targets.current.push(newTarget);
            targets.current.sort(compare);
            return symbol;
        },
        [getNextZIndex],
    );

    const del = useCallback((symbol: symbol) => {
        targets.current = targets.current.filter((e) => e.symbol !== symbol);
    }, []);

    const listen = useCallback(
        (symbol: symbol, button: number, callback: Callback) => {
            const target = targets.current.find((e) => e.symbol === symbol);
            if (!target) {
                throw new Error("Target not found");
            }

            let callbackList = target.listener.get(button);
            if (!callbackList) {
                callbackList = [];
                target.listener.set(button, callbackList);
            }
            callbackList.push(callback);
            return () => {
                const idx = callbackList!.indexOf(callback);
                if (idx !== -1) {
                    callbackList!.splice(idx, 1);
                }
            };
        },
        [],
    );

    const onButtonEvent = useCallback((e: GamepadButtonEvent) => {
        const callbackList = targets.current[0]?.listener?.get(e.button);
        if (!callbackList) {
            return;
        }
        for (const c of callbackList) {
            c(e);
        }
    }, []);

    useEffect(() => {
        addGamepadButtonListener(onButtonEvent);

        return () => removeGamepadButtonListener(onButtonEvent);
    }, [onButtonEvent]);

    return (
        <context.Provider value={{ isOnTop, getNextZIndex, add, del, listen }}>
            {children}
        </context.Provider>
    );
}

GamepadInputStackProvider.Context = context;
