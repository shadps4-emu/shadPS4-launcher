import { useState } from "react";
import { GamepadNavField } from "../lib/context/gamepad-nav-field";
import { GameLibrary } from "./game-library";
import { Toolbar } from "./toolbar";

export function MainPage() {
    const [search, setSearch] = useState("");

    return (
        <GamepadNavField debugName="main-page" zIndex={0}>
            <div className="flex h-full flex-col">
                <Toolbar onSearch={setSearch} />
                <GameLibrary search={search} />
            </div>
        </GamepadNavField>
    );
}
