import { useState, useEffect } from "react";
import { GamepadNavField } from "../lib/context/gamepad-nav-field";
import { GameLibrary } from "./game-library";
import { Toolbar } from "./toolbar";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from '@tauri-apps/api/window'

export function MainPage() {
    const [search, setSearch] = useState("");
    const [isWindowFocused, setIsWindowFocused] = useState<boolean>(false);

    useEffect(() => {
        getCurrentWindow().isFocused().then(setIsWindowFocused);
    }, [])

    useEffect(() => {
        const unlistenPromises: Promise<UnlistenFn>[] = [];
        unlistenPromises.push(getCurrentWindow().onFocusChanged(({ payload }) => {
            setIsWindowFocused(payload.valueOf());
        }));
        return () => {
            unlistenPromises.forEach(unlistenPromise => unlistenPromise.then(unlisten => unlisten()));
        }
    }, []);

    return (
        <GamepadNavField debugName="main-page" zIndex={0}>
            <div className={`${isWindowFocused ? "flex h-full flex-col pointer-events-auto" :
                                                "flex h-full flex-col pointer-events-none"}`}
            >
                <Toolbar onSearch={setSearch} />
                <GameLibrary search={search} />
            </div>
        </GamepadNavField>
    );
}
