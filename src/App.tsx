import { useAtom } from "jotai";
import { type ChangeEvent, useCallback } from "react";
import "./App.css";
import logo from "./assets/shadps4.png";
import { Input } from "./components/ui/input";
import { PathPreferences } from "./store/paths";

function App() {
  const [gamePath, setGamePath] = useAtom(PathPreferences.gamesPath);

  const onChangeGamePath = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setGamePath(e.target.value);
  }, []);

  return (
    <main className="bg-primary h-screen">
      <div className="flex flex-col items-center justify-center text-white p-8">
        <a href="https://github.com/shadps4-emu/shadPS4" target="_blank">
          <img src={logo} className="size-40" alt="React logo" />
        </a>
        <Input type="text" value={gamePath} onChange={onChangeGamePath} />
      </div>
    </main>
  );
}

export default App;
