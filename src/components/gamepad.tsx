import { type GamepadButtons } from "@/providers/Gamepad";
import { createAbort } from "@/utils/events";
import { useEffect, useRef, type ReactNode } from "react";

type Handlers =
  | "up"
  | "down"
  | "left"
  | "right"
  | "confirm"
  | "back"
  | "options";

export interface GamepadProps
  extends Partial<Record<`on${Capitalize<Handlers>}`, () => void>> {
  children: ReactNode;
  onMove?: (args: { x: number; y: number }) => void;
}

export function Gamepad({
  children,
  onUp,
  onDown,
  onLeft,
  onRight,
  onConfirm,
  onBack,
  onOptions,
  onMove,
}: GamepadProps) {
  const element = useRef<HTMLDivElement>(null);

  const handleButtons = (button: GamepadButtons): boolean => {
    const buttons = (): boolean | void => {
      console.log(button);
      switch (button) {
        case "dpad_up":
          if (onUp || onMove) {
            onUp?.();
            onMove?.({ x: 0, y: -1 });
            break;
          } else {
            return true;
          }
        case "dpad_down":
          if (onDown || onMove) {
            onDown?.();
            onMove?.({ x: 0, y: 1 });
            break;
          } else {
            return true;
          }
        case "dpad_left":
          if (onLeft || onMove) {
            onLeft?.();
            onMove?.({ x: -1, y: 0 });
            break;
          } else {
            return true;
          }
        case "dpad_right":
          if (onRight || onMove) {
            onRight?.();
            onMove?.({ x: 1, y: 0 });
            break;
          } else {
            return true;
          }
        case "confirm":
          return onConfirm ? onConfirm() : true;
        case "back":
          return onBack ? onBack() : true;
        case "options":
          return onOptions ? onOptions() : true;
        default:
          return true;
      }
    };

    return !buttons();
  };

  useEffect(() => {
    const { abort, signal } = createAbort();

    element.current!.addEventListener(
      "gamepad",
      (event) => {
        const handled = handleButtons(event.detail.button);
        if (handled) event.preventDefault();
      },
      { signal },
    );

    return abort;
  }, []);

  return (
    <div className="contents" ref={element}>
      {children}
    </div>
  );
}
