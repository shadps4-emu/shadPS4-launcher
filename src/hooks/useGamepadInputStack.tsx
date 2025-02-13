import { type GamepadButtonEvent } from "@/handlers/gamepad";
import { GamepadInputStackProvider } from "@/providers/gamepad-input-stack";
import { useCallback, useContext, useEffect, useRef } from "react";

export function useGamepadInputStack(zIndex?: number) {
  const context = useContext(GamepadInputStackProvider.Context);
  if (!context) {
    throw new Error(
      "useGamepadInputStack must be used within a GamepadInputStackProvider",
    );
  }

  const symRef = useRef<symbol>(null);
  useEffect(() => {
    symRef.current = context.add(zIndex);

    return () => {
      const sym = symRef.current;
      if (!sym) throw new Error("this should not be null");
      context.del(sym);
    };
  }, []);

  const listen = useCallback(
    (button: number, callback: (e: GamepadButtonEvent) => void) => {
      const sym = symRef.current;
      if (!sym) throw new Error("this should not be null");
      context.listen(sym, button, callback);
    },
    [],
  );

  return {
    context: context,
    listen,
  };
}
