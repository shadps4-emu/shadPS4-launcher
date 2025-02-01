import { useAtom } from "jotai";
import { type ChangeEvent, Suspense, useCallback } from "react";
import "./App.css";
import { GameLibrary } from "./components/game-library";
import { Toolbar } from "./components/toolbar";
import { Input } from "./components/ui/input";
import { Spinner } from "./components/ui/spinner";
import { pathPreferences } from "./store/paths";
import { ScrollArea } from "./components/ui/scroll-area";

function App() {
  const [gamePath, setGamePath] = useAtom(pathPreferences.gamesPath);
  const [emuPath, setEmuPath] = useAtom(pathPreferences.emulatorPath);

  const onChangeGamePath = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setGamePath(e.target.value);
  }, []);
  const onChangeEmuPath = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmuPath(e.target.value);
  }, []);

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
        <div className="flex flex-row items-center">
          <span>Games:</span>
          <Input type="text" value={gamePath} onChange={onChangeGamePath} />
          <span>Emu:</span>
          <Input type="text" value={emuPath} onChange={onChangeEmuPath} />
        </div>
        <Toolbar />
        <ScrollArea type="scroll" className="h-screen p-8 z-20">
          <GameLibrary />
        </ScrollArea>
      </Suspense>
    </main>
  );
}

export default App;
