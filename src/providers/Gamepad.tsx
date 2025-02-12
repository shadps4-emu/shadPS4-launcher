import { useFocus } from "@/hooks/useFocus";
import { createAbort } from "@/utils/events";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

const buttonMap = {
  0: "confirm",
  1: "back",
  2: "extra",
  3: "options",
  12: "dpad_up",
  13: "dpad_down",
  14: "dpad_left",
  15: "dpad_right",
} as const;

export type GamepadButtons = (typeof buttonMap)[keyof typeof buttonMap];

export interface GamepadEvent {
  button: GamepadButtons;
  isRepeat: boolean;
}

interface IGamepadContext {
  active: boolean;
}

const context = createContext<IGamepadContext | null>(null);

const REPEAT_DELAY = 500;
const REPEAT_RATE = 100;

export function GamepadProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  const running = useRef(false);
  const buttonTimestamps = useRef<Record<number, number>>({});

  const { next, previous } = useFocus();

  const emit = useCallback((detail: GamepadEvent) => {
    const doDefault = (document.activeElement ?? document).dispatchEvent(
      new CustomEvent<GamepadEvent>("gamepad", {
        detail,
        bubbles: true,
        cancelable: true,
      }),
    );

    if (doDefault) {
      if (!document.activeElement || document.activeElement === document.body) {
        const initialFocusElement: HTMLElement | null = document.querySelector(
          "[data-initial-focus]",
        );

        initialFocusElement?.focus?.();
        return;
      }

      switch (detail.button) {
        case "dpad_up":
          return previous();
        case "dpad_down":
          return next();
        case "dpad_left":
          return previous();
        case "dpad_right":
          return next();
        case "confirm":
          return (document.activeElement as HTMLElement)?.click();
      }
    }
  }, []);

  const run = useCallback(() => {
    const [gamepad] = navigator.getGamepads().filter(Boolean);
    if (!gamepad) {
      running.current = false;
      return;
    }

    const now = performance.now();

    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i]!;

      const knownButton = buttonMap[i as keyof typeof buttonMap];
      if (!knownButton) continue;

      const lastTime = buttonTimestamps.current[i];

      if (button.pressed) {
        setActive(true);
        if (!lastTime) {
          emit({ button: knownButton, isRepeat: false });
          buttonTimestamps.current[i] = now;
        } else if (lastTime && now - lastTime >= REPEAT_DELAY) {
          if ((now - lastTime - REPEAT_DELAY) % REPEAT_RATE < 16) {
            emit({ button: knownButton, isRepeat: true });
          }
        }
      } else {
        delete buttonTimestamps.current[i];
      }
    }

    requestAnimationFrame(run);
  }, []);

  useEffect(() => {
    const { abort, signal } = createAbort();

    window.addEventListener(
      "gamepadconnected",
      () => {
        if (!running.current) {
          console.log("connected");
          running.current = true;
          run();
        }
      },
      { signal },
    );

    document.addEventListener("mousemove", () => setActive(false), { signal });
    document.addEventListener("keydown", () => setActive(false), { signal });

    if (
      navigator.getGamepads().filter(Boolean).length > 0 &&
      !running.current
    ) {
      running.current = true;
      run();
    }

    return () => {
      running.current = false;
      abort();
    };
  }, []);

  return <context.Provider value={{ active }}>{children}</context.Provider>;
}

GamepadProvider.Context = context;
