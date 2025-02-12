import * as Jotai from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GamepadProvider } from "./providers/Gamepad";
import { defaultStore } from "./store/store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Jotai.Provider store={defaultStore}>
      <GamepadProvider>
        <App />
      </GamepadProvider>
    </Jotai.Provider>
  </React.StrictMode>,
);
