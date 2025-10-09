import { useState } from "react";
import { GamepadNavField } from "../../lib/context/gamepad-nav-field";
import { GameLibrary } from "../game-library";
import { Toolbar } from "../toolbar";

export function MainPage() {
    const [search, setSearch] = useState("");

    return (
        <main
            className="flex h-screen max-h-screen flex-col justify-stretch bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 align-top dark:from-blue-900 dark:via-blue-950 dark:to-sky-950"
            onContextMenu={(e) => e.preventDefault()}
        >
            <GamepadNavField debugName="main-page" zIndex={0}>
                <div className="flex h-full flex-col">
                    <Toolbar onSearch={setSearch} />
                    <GameLibrary search={search} />
                </div>
            </GamepadNavField>
        </main>
    );
}
