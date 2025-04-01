import { GameLibrary } from "./game-library";
import { GamepadNavField } from "./gamepad-nav-field";
import { Toolbar } from "./toolbar";

export function MainPage() {
    return (
        <GamepadNavField className="flex h-full flex-col">
            <Toolbar />
            <GameLibrary />
        </GamepadNavField>
    );
}
