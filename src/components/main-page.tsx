import { GamepadNavField } from "../lib/context/gamepad-nav-field";
import { GameLibrary } from "./game-library";
import { Toolbar } from "./toolbar";

export function MainPage() {
    return (
        <GamepadNavField debugName="main-page" zIndex={0}>
            <div className="flex h-full flex-col">
                <Toolbar />
                <GameLibrary />
            </div>
        </GamepadNavField>
    );
}
