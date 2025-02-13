import {
  addGamepadButtonListener,
  removeGamepadButtonListener,
  type GamepadButtonEvent,
} from "@/handlers/gamepad";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Callback = (e: GamepadButtonEvent) => void;

export interface Target {
  zIndex: number;
  symbol: symbol;

  listener: Map<number, Callback>;
}

interface IGamepadInputStack {
  isOnTop(symbol: symbol): boolean;
  getNextZIndex(): number;

  add(zIndex?: number): symbol;
  del(symbol: symbol): void;

  listen(symbol: symbol, button: number, callback: Callback): void;
}

const context = createContext<IGamepadInputStack | null>(null);

function compare(a: Target, b: Target): number {
  return b.zIndex - a.zIndex;
}

export function GamepadInputStackProvider({ children }: PropsWithChildren) {
  const targets = useRef<Target[]>([]);

  const getNextZIndex = useCallback(() => {
    return targets.current[0]?.zIndex || 1;
  }, []);

  const isOnTop = useCallback((symbol: symbol) => {
    return targets.current[0]?.symbol == symbol;
  }, []);

  const add = useCallback((zIndex?: number): symbol => {
    const symbol = Symbol();
    zIndex = zIndex || getNextZIndex();
    const newTarget = {
      zIndex,
      symbol,
      listener: new Map(),
    };
    targets.current.push(newTarget);
    targets.current.sort(compare);
    return symbol;
  }, []);

  const del = useCallback((symbol: symbol) => {
    targets.current = targets.current.filter((e) => e.symbol != symbol);
  }, []);

  const listen = useCallback(
    (symbol: symbol, button: number, callback: Callback) => {
      const target = targets.current.find((e) => e.symbol == symbol);
      if (!target) return;

      target.listener.set(button, callback);
    },
    [],
  );

  const onButtonEvent = useCallback((e: GamepadButtonEvent) => {
    targets.current[0]?.listener?.get(e.button)?.(e);
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
