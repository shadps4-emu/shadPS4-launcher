import { type GamepadEvent } from "./providers/Gamepad";

declare global {
  interface GlobalEventHandlersEventMap {
    gamepad: CustomEvent<GamepadEvent>;
  }
}

export {};
