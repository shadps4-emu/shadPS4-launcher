import { Suspense } from "react";
import "./App.css";
import { ConfigModal } from "./components/config-modal";
import { GameLibrary } from "./components/game-library";
import { GamepadNavField } from "./components/gamepad-nav-field";
import { LoadingScreen } from "./components/loading-overlay";
import { Toolbar } from "./components/toolbar";
import { VersionManagerModal } from "./components/version-manager-modal";

function App() {
  return (
    <main
      className="flex h-screen max-h-screen flex-col justify-stretch align-top"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={<LoadingScreen />}>
        <ConfigModal />
        <VersionManagerModal />
        <GamepadNavField className="flex h-full flex-col">
          <Toolbar />
          <GameLibrary />
        </GamepadNavField>
      </Suspense>
    </main>
  );
}

export default App;
