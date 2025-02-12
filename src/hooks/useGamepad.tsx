import { GamepadProvider } from "@/providers/Gamepad";
import { useContext } from "react";

export function useGamepad() {
  const context = useContext(GamepadProvider.Context);
  if (!context) {
    throw new Error("useGamepad must be used within a GamepadProvider");
  }

  return context;
}
