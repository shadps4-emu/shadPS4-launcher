import { GamepadNavField } from "../lib/context/gamepad-nav-field";
import { GameLibrary } from "./game-library";
import { Toolbar } from "./toolbar";

export function MainPage() {
    return (
        <GamepadNavField>
            <div className="flex h-full flex-col">
                <Toolbar />
                <GameLibrary />
            </div>
        </GamepadNavField>
    );
}
