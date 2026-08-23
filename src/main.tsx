import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { startUpdateChecker } from "./handlers/auto-update";
import { startGamepadHandler } from "./handlers/gamepad";
import { startGameLibraryIndexer } from "./lib/game-library";
import { setupForwardingConsole } from "./lib/native/forward-log";
import { restoreRunningGamesFromBackend } from "./lib/running-games/restore-from-backend";
import { defaultStore } from "./store";
import { atomGamesPath } from "./store/paths";
import { startRunningGamesSync } from "./store/running-games";

async function start() {
    await setupForwardingConsole();

    const win = getCurrentWindow();
    if (win.label === "main") {
        startUpdateChecker();
        win.onCloseRequested(() => {
            exit(0);
        });
    }

    startGamepadHandler();
    startGameLibraryIndexer(defaultStore, (cb) => atomGamesPath.listen(cb));
    startRunningGamesSync(defaultStore);
    void restoreRunningGamesFromBackend(defaultStore);

    const root = document.getElementById("root");

    if (!root) {
        throw new Error("Root element not found");
    }

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}

start();
