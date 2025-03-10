import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Jotai from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startGamepadHandler } from "./handlers/gamepad";
import { GamepadInputStackProvider } from "./providers/gamepad-input-stack";
import { defaultStore } from "./store";
import { Toaster } from "./components/ui/sonner";
import { LoadingOverlay } from "./components/loading-overlay";
import { TooltipProvider } from "./components/ui/tooltip";

startGamepadHandler();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
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
