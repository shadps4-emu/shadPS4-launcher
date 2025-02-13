import { Suspense } from "react";
import "./App.css";
import { GameLibrary } from "./components/game-library";
import { GamepadNavField } from "./components/gamepad-nav-field";
import { Toolbar } from "./components/toolbar";
import { ScrollArea } from "./components/ui/scroll-area";
import { Spinner } from "./components/ui/spinner";

function App() {
  return (
    <main
      className="flex max-h-screen flex-col justify-stretch align-top"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-stone-800 opacity-60"></div>
            <Spinner size="large" className="text-black" />
          </div>
        }
      >
        <GamepadNavField>
          <Toolbar />
          <ScrollArea type="scroll" className="z-20 h-screen">
            <GameLibrary />
          </ScrollArea>
        </GamepadNavField>
      </Suspense>
    </main>
  );
}

export default App;
