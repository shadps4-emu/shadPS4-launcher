import * as Jotai from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startGamepadHandler } from "./handlers/gamepad";
import { GamepadInputStackProvider } from "./providers/gamepad-input-stack";
import { defaultStore } from "./store";

startGamepadHandler();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Jotai.Provider store={defaultStore}>
      <GamepadInputStackProvider>
        <App />
      </GamepadInputStackProvider>
    </Jotai.Provider>
  </React.StrictMode>,
);
