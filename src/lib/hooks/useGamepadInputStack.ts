import { useCallback, useContext, useEffect, useRef } from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import { GamepadInputStackProvider } from "@/lib/context/gamepad-input-stack";

export type GamepadInputStackHookProps = {
    zIndex?: number;
    enabled?: boolean;
    debugName?: string;
};

export function useGamepadInputStack({
    zIndex,
    enabled,
    debugName,
}: GamepadInputStackHookProps) {
    const context = useContext(GamepadInputStackProvider.Context);
    if (!context) {
        throw new Error(
            "useGamepadInputStack must be used within a GamepadInputStackProvider",
        );
    }
    const symRef = useRef<symbol>(null);

    useEffect(() => {
        if (enabled === false) {
            symRef.current = null;
            return;
        }
        const newSym = context.add(zIndex, debugName);
        symRef.current = newSym;

        return () => {
            context.del(newSym);
        };
    }, [enabled, context, zIndex, debugName]);

    const listen = useCallback(
        (button: number, callback: (e: GamepadButtonEvent) => void) => {
            if (!symRef.current) {
                throw new Error(
                    "you shouldn't call listen when gamepadInputStack is disabled (enabled === false)",
                );
            }
            return context.listen(symRef.current, button, callback);
        },
        [context],
    );

    return {
        context: context,
        listen,
    };
}
