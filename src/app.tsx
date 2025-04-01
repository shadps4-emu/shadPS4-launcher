import { Suspense } from "react";
import { ConfigModal } from "./components/config-modal";
import { LoadingScreen } from "./components/loading-overlay";
import { MainPage } from "./components/main-page";
import { VersionManagerModal } from "./components/version-manager-modal";

import "./app.css";

export function App() {
    return (
        <main
            className="flex h-screen max-h-screen flex-col justify-stretch align-top"
            onContextMenu={(e) => e.preventDefault()}
        >
            <Suspense fallback={<LoadingScreen />}>
                <ConfigModal />
                <VersionManagerModal />
                <MainPage />
            </Suspense>
        </main>
    );
}
