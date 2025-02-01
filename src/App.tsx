import { useAtom } from "jotai";
import { type ChangeEvent, Suspense, useCallback } from "react";
import "./App.css";
import { GameLibrary } from "./components/game-library";
import { Toolbar } from "./components/toolbar";
import { Input } from "./components/ui/input";
import { Spinner } from "./components/ui/spinner";
import { PathPreferences } from "./store/paths";

function App() {
  const [gamePath, setGamePath] = useAtom(PathPreferences.gamesPath);

  const onChangeGamePath = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setGamePath(e.target.value);
  }, []);

  return (
    <main
      className="flex flex-col align-top justify-stretch"
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
        <Input type="text" value={gamePath} onChange={onChangeGamePath} />
        <Toolbar />
        <GameLibrary />
      </Suspense>
    </main>
  );
}

export default App;
