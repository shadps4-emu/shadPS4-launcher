import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import * as Jotai from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { LoadingOverlay } from "./components/loading-overlay";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { EmuConfigWindow } from "./components/window/emu-config-window";
import { startUpdateChecker } from "./handlers/auto-update";
import { startGamepadHandler } from "./handlers/gamepad";
import { setupForwardingConsole } from "./lib/native/forward-log";
import { GamepadInputStackProvider } from "./providers/gamepad-input-stack";
import { defaultStore } from "./store";

type Routing = "main" | "EmuConfig";

async function start(r: Routing) {
    await setupForwardingConsole();

    const win = getCurrentWindow();
    if (r === "main") {
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

    const queryClient = new QueryClient();

    const root = document.getElementById("root");

    if (!root) {
        throw new Error("Root element not found");
    }

    let content: React.ReactNode;

    if (r === "main") {
        content = <App />;
    } else if (r === "EmuConfig") {
        content = <EmuConfigWindow />;
    } else {
        throw new Error("Unknown routing: " + r);
    }

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <Jotai.Provider store={defaultStore}>
                    <GamepadInputStackProvider>
                        <TooltipProvider>
                            <Toaster richColors />
                            <LoadingOverlay />
                            {content}
                        </TooltipProvider>
                    </GamepadInputStackProvider>
                </Jotai.Provider>
            </QueryClientProvider>
        </React.StrictMode>,
    );
}

switch (document.location.pathname) {
    case "/":
        start("main");
        break;
    case "/emu_config":
        start("EmuConfig");
        break;
    default:
        document.writeln("UNKNOWN ROUTING: " + document.location.pathname);
        throw new Error("Unknown routing: " + document.location.pathname);
}
