import { useEffect, useRef } from "react";
import {
    gamepadButtonToToken,
    type InputBindingTab,
    keyboardEventToToken,
    mouseEventToToken,
} from "@/lib/input-config";

export type BindingCaptureTarget = {
    tab: InputBindingTab;
    output: string;
    index: number;
};

type Options = {
    active: BindingCaptureTarget | null;
    onCapture: (target: BindingCaptureTarget, token: string) => void;
    onCancel: () => void;
};

export function useBindingCapture({ active, onCapture, onCancel }: Options) {
    const activeRef = useRef(active);
    activeRef.current = active;

    useEffect(() => {
        if (!active) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!activeRef.current) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (event.code === "Escape") {
                onCancel();
                return;
            }
            const token = keyboardEventToToken(event);
            if (token) {
                onCapture(activeRef.current, token);
            }
        };

        const handleMouseDown = (event: MouseEvent) => {
            if (!activeRef.current || activeRef.current.tab !== "mouse") {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            const token = mouseEventToToken(event);
            if (token) {
                onCapture(activeRef.current, token);
            }
        };

        const handleGamepad = () => {
            const target = activeRef.current;
            if (!target || target.tab !== "controller") {
                return;
            }
            const pads = navigator.getGamepads?.() ?? [];
            for (const pad of pads) {
                if (!pad) {
                    continue;
                }
                for (let i = 0; i < pad.buttons.length; i++) {
                    if (pad.buttons[i]?.pressed) {
                        const token = gamepadButtonToToken(i);
                        if (token) {
                            onCapture(target, token);
                            return;
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("mousedown", handleMouseDown, true);
        const interval = window.setInterval(handleGamepad, 50);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("mousedown", handleMouseDown, true);
            window.clearInterval(interval);
        };
    }, [active, onCancel, onCapture]);
}
