import { defaultStore } from "@/store";
import { gamepadActiveAtom } from "@/store/gamepad";

export class GamepadButtonEvent {
    public button: number;
    public pressed: boolean;
    public justPressed: boolean;
    public repeating: boolean;

    public isPreventingDefault: boolean;

    constructor(
        button: number,
        pressed: boolean,
        justPressed: boolean,
        repeating: boolean,
    ) {
        this.button = button;
        this.pressed = pressed;
        this.justPressed = justPressed;
        this.repeating = repeating;
        this.isPreventingDefault = false;
    }

    preventDefault() {
        this.isPreventingDefault = true;
    }
}

// Axis is 100+ buttons e.g. axis 0 is button 100, axis 1 is button 101
const callbackList: ((e: GamepadButtonEvent) => void)[] = [];

const buttonState: boolean[] = [];
const buttonRepeatTime: number[] = [];

const deadZone = 0.4;

const gamepadRelease = () => {
    defaultStore.set(gamepadActiveAtom, false);
};

const gamepadAcquire = () => {
    defaultStore.set(gamepadActiveAtom, true);
};

function gamepadLoop() {
    try {
        const now = Date.now();
        for (const gamepad of navigator.getGamepads()) {
            if (!gamepad || !document.hasFocus()) {
                continue;
            }

            const btnLen = gamepad.buttons.length;
            const baseArr = -gamepad.axes.length * 2;
            for (let i = baseArr; i < btnLen; ++i) {
                let pressed: boolean;
                let btn_id: number;
                if (i >= 0) {
                    btn_id = i;
                    const btn = gamepad.buttons[i];
                    if (!btn) {
                        continue;
                    }
                    pressed = btn.pressed;
                } else {
                    const idx = ((i + baseArr) / 2) | 0;
                    btn_id = idx + 100;
                    const axis = gamepad.axes[idx];
                    if (axis === undefined) {
                        continue;
                    }
                    pressed = i & 1 ? axis > deadZone : axis < -deadZone;
                }
                const wasPressed = buttonState[i] || false;
                buttonState[i] = pressed;
                const justPressed = pressed && !wasPressed;
                if (justPressed) {
                    buttonRepeatTime[i] = now + 1600; // first repeat
                }
                const repeating = pressed && (buttonRepeatTime[i] || 0) > now;
                if (repeating) {
                    buttonRepeatTime[i] = now + 200; // following repeats
                }
                if (pressed) {
                    gamepadAcquire();
                }
                const e = new GamepadButtonEvent(
                    btn_id,
                    pressed,
                    justPressed,
                    repeating,
                );

                for (const c of callbackList) {
                    c(e);
                }
            }
        }
    } catch (e) {
        console.error("Gamepad read error", e);
    }
    requestAnimationFrame(gamepadLoop);
}

export function startGamepadHandler() {
    requestAnimationFrame(gamepadLoop);
    window.addEventListener("mousedown", gamepadRelease);
    window.addEventListener("keydown", gamepadRelease);
    window.addEventListener("gamepadconnected", gamepadAcquire);
    window.addEventListener("gamepaddisconnected", gamepadRelease);
    if (navigator.getGamepads().length > 0) {
        gamepadAcquire();
    }
}

export function addGamepadButtonListener(
    callback: (e: GamepadButtonEvent) => void,
) {
    const e = callbackList.indexOf(callback);
    if (e !== -1) {
        return;
    }

    callbackList.push(callback);
}

export function removeGamepadButtonListener(
    callback: (e: GamepadButtonEvent) => void,
) {
    const e = callbackList.indexOf(callback);
    if (e === -1) {
        return;
    }

    callbackList.splice(e);
}
