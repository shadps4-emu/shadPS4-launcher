import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Jotai from "jotai";
import { type PropsWithChildren, type ReactNode, Suspense } from "react";
import { ModalOverlay } from "@/components/modal-overlay";
import { ModalWindowHost } from "@/components/modal-window-host";
import { parseModalWindowRoute, renderModal } from "@/lib/modals";
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

function Providers({
    children,
    initialModal,
}: PropsWithChildren<{ initialModal?: ReactNode }>) {
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <Jotai.Provider store={defaultStore}>
                <GamepadInputStackProvider>
                    <NavigatorProvider initialModal={initialModal}>
                        <TooltipProvider>{children}</TooltipProvider>
                    </NavigatorProvider>
                </GamepadInputStackProvider>
            </Jotai.Provider>
        </QueryClientProvider>
    );
}

export function App() {
    const modalRoute = parseModalWindowRoute();

    if (modalRoute) {
        return (
            <Providers
                initialModal={renderModal(modalRoute.id, modalRoute.params)}
            >
                <Toaster richColors />
                <ModalWindowHost />
            </Providers>
        );
    }

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
