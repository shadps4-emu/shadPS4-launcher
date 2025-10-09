import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { startUpdateChecker } from "./handlers/auto-update";
import { startGamepadHandler } from "./handlers/gamepad";
import { setupForwardingConsole } from "./lib/native/forward-log";

async function start() {
    await setupForwardingConsole();

    const win = getCurrentWindow();
    if (win.label === "main") {
        startUpdateChecker();
        win.onCloseRequested(() => {
            exit(0);
        });
    } else {
        win.onCloseRequested((e) => {
            e.preventDefault();
            win.hide();
        });
    }

    startGamepadHandler();

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
