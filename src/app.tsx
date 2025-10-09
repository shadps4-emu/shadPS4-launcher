import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Jotai from "jotai";
import { type PropsWithChildren, Suspense } from "react";
import { ModalOverlay } from "@/components/modal-overlay";
import { LoadingOverlay, LoadingScreen } from "./components/loading-overlay";
import { MainPage } from "./components/pages/main-page";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { UpdateIcon } from "./components/update-icon";
import { GamepadInputStackProvider } from "./lib/context/gamepad-input-stack";
import { NavigatorProvider } from "./lib/context/navigator-provider";
import { defaultStore } from "./store";

import "@glideapps/glide-data-grid/dist/index.css";
import "./app.css";

function Providers({ children }: PropsWithChildren) {
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <Jotai.Provider store={defaultStore}>
                <GamepadInputStackProvider>
                    <NavigatorProvider>
                        <TooltipProvider>{children}</TooltipProvider>
                    </NavigatorProvider>
                </GamepadInputStackProvider>
            </Jotai.Provider>
        </QueryClientProvider>
    );
}

export function App() {
    return (
        <Providers>
            <Toaster richColors />
            <LoadingOverlay />
            <ModalOverlay />
            <UpdateIcon />
            <Suspense fallback={<LoadingScreen />}>
                <MainPage />
            </Suspense>
        </Providers>
    );
}
