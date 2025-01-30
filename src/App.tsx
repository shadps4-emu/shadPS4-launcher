import "./App.css";
import logo from "./assets/shadps4.png";

function App() {
  return (
    <main className="bg-primary h-screen">
      <div className="flex flex-col items-center justify-center text-white p-8">
        <a href="https://github.com/shadps4-emu/shadPS4" target="_blank">
          <img src={logo} className="size-40" alt="React logo" />
        </a>
      </div>
    </main>
  );
}

export default App;
