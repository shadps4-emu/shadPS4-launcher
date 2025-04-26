import { useContext } from "react";
import { GamepadNavField } from "../context/gamepad-nav-field";

export function useGamepadNavField() {
    const navField = useContext(GamepadNavField.Context);

    if (!navField) {
        throw new Error("Missing GamepadNavField provider");
    }

    return navField;
}
