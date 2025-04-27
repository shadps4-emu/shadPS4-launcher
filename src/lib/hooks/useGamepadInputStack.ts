import { useCallback, useContext, useEffect, useRef } from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import { GamepadInputStackProvider } from "@/lib/context/gamepad-input-stack";

export function useGamepadInputStack(zIndex?: number, debugName?: string) {
    const context = useContext(GamepadInputStackProvider.Context);
    if (!context) {
        throw new Error(
            "useGamepadInputStack must be used within a GamepadInputStackProvider",
        );
    }

    const symRef = useRef<symbol>(null);
    useEffect(() => {
        symRef.current = context.add(zIndex, debugName);

        return () => {
            const sym = symRef.current;
            if (!sym) {
                throw new Error("this should not be null");
            }
            context.del(sym);
        };
    }, [context, zIndex, debugName]);

    const listen = useCallback(
        (button: number, callback: (e: GamepadButtonEvent) => void) => {
            const sym = symRef.current;
            if (!sym) {
                throw new Error("this should not be null");
            }
            return context.listen(sym, button, callback);
        },
        [context],
    );

    return {
        context: context,
        listen,
    };
}
