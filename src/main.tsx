import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Jotai from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { LoadingOverlay } from "./components/loading-overlay";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { startGamepadHandler } from "./handlers/gamepad";
import { GamepadInputStackProvider } from "./providers/gamepad-input-stack";
import { defaultStore } from "./store";

startGamepadHandler();

const queryClient = new QueryClient();

const root = document.getElementById("root");

if (!root) {
    throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Jotai.Provider store={defaultStore}>
                <GamepadInputStackProvider>
                    <TooltipProvider>
                        <Toaster richColors />
                        <LoadingOverlay />
                        <App />
                    </TooltipProvider>
                </GamepadInputStackProvider>
            </Jotai.Provider>
        </QueryClientProvider>
    </React.StrictMode>,
);
