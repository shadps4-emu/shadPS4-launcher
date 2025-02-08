import { Suspense } from "react";
import "./App.css";
import { GameLibrary } from "./components/game-library";
import { Toolbar } from "./components/toolbar";
import { ScrollArea } from "./components/ui/scroll-area";
import { Spinner } from "./components/ui/spinner";

function App() {
  return (
    <main
      className="flex flex-col align-top justify-stretch max-h-screen"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense
        fallback={
          <div className="h-screen w-screen flex justify-center items-center">
            <div className="bg-stone-800 opacity-60 left-0 top-0 right-0 bottom-0 absolute"></div>
            <Spinner size="large" className="text-black" />
          </div>
        }
      >
        <Toolbar />
        <ScrollArea type="scroll" className="h-screen p-8 z-20">
          <GameLibrary />
        </ScrollArea>
      </Suspense>
    </main>
  );
}

export default App;
