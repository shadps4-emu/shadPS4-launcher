import { Suspense } from "react";
import { ModalOverlay } from "@/components/modal-overlay";
import { LoadingScreen } from "./components/loading-overlay";
import { MainPage } from "./components/main-page";
import { UpdateIcon } from "./components/update-icon";

import "./app.css";
import "@glideapps/glide-data-grid/dist/index.css";

export function App() {
    return (
        <main
            className="flex h-screen max-h-screen flex-col justify-stretch bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 align-top dark:from-blue-900 dark:via-blue-950 dark:to-sky-950"
            onContextMenu={(e) => e.preventDefault()}
        >
            <Suspense fallback={<LoadingScreen />}>
                <ModalOverlay />
                <UpdateIcon />
                <MainPage />
            </Suspense>
        </main>
    );
}
