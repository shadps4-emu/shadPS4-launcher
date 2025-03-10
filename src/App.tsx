import { Suspense } from "react";
import "./App.css";
import { ConfigModal } from "./components/config-modal";
import { GameLibrary } from "./components/game-library";
import { GamepadNavField } from "./components/gamepad-nav-field";
import { Toolbar } from "./components/toolbar";
import { ScrollArea } from "./components/ui/scroll-area";
import { Spinner } from "./components/ui/spinner";
import { VersionManagerModal } from "./components/version-manager-modal";
import { LoadingScreen } from "./components/loading-overlay";

function App() {
  return (
    <main
      className="flex max-h-screen flex-col justify-stretch align-top"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={<LoadingScreen />}>
        <ConfigModal />
        <VersionManagerModal />
        <GamepadNavField>
          <Toolbar />
          <ScrollArea type="scroll" className="z-20">
            <GameLibrary />
          </ScrollArea>
        </GamepadNavField>
      </Suspense>
    </main>
  );
}

export default App;
