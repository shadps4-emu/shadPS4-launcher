import { Suspense } from "react";
import { LoadingScreen } from "./components/loading-overlay";
import { MainPage } from "./components/main-page";
import { ConfigModal } from "./components/modals/config-modal";
import { RunningGameModal } from "./components/modals/running-game-modal";
import { VersionManagerModal } from "./components/modals/version-manager-modal";
import { UpdateIcon } from "./components/update-icon";

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
                <UpdateIcon />
                <RunningGameModal />
                <MainPage />
            </Suspense>
        </main>
    );
}
