import { MOUSE_INPUT_TOKENS } from "./schema";

const CODE_TO_TOKEN: Record<string, string> = {
    KeyA: "a",
    KeyB: "b",
    KeyC: "c",
    KeyD: "d",
    KeyE: "e",
    KeyF: "f",
    KeyG: "g",
    KeyH: "h",
    KeyI: "i",
    KeyJ: "j",
    KeyK: "k",
    KeyL: "l",
    KeyM: "m",
    KeyN: "n",
    KeyO: "o",
    KeyP: "p",
    KeyQ: "q",
    KeyR: "r",
    KeyS: "s",
    KeyT: "t",
    KeyU: "u",
    KeyV: "v",
    KeyW: "w",
    KeyX: "x",
    KeyY: "y",
    KeyZ: "z",
    Digit0: "0",
    Digit1: "1",
    Digit2: "2",
    Digit3: "3",
    Digit4: "4",
    Digit5: "5",
    Digit6: "6",
    Digit7: "7",
    Digit8: "8",
    Digit9: "9",
    F1: "f1",
    F2: "f2",
    F3: "f3",
    F4: "f4",
    F5: "f5",
    F6: "f6",
    F7: "f7",
    F8: "f8",
    F9: "f9",
    F10: "f10",
    F11: "f11",
    F12: "f12",
    Backquote: "grave",
    Minus: "minus",
    Equal: "equals",
    BracketLeft: "lbracket",
    BracketRight: "rbracket",
    Backslash: "backslash",
    Semicolon: "semicolon",
    Quote: "apostrophe",
    Comma: "comma",
    Period: "period",
    Slash: "slash",
    Escape: "escape",
    PrintScreen: "printscreen",
    ScrollLock: "scrolllock",
    Pause: "pausebreak",
    Backspace: "backspace",
    Delete: "delete",
    Insert: "insert",
    Home: "home",
    End: "end",
    PageUp: "pgup",
    PageDown: "pgdown",
    Tab: "tab",
    CapsLock: "capslock",
    Enter: "enter",
    ShiftLeft: "lshift",
    ShiftRight: "rshift",
    ControlLeft: "lctrl",
    ControlRight: "rctrl",
    AltLeft: "lalt",
    AltRight: "ralt",
    MetaLeft: "lmeta",
    MetaRight: "rmeta",
    Space: "space",
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Numpad0: "kp0",
    Numpad1: "kp1",
    Numpad2: "kp2",
    Numpad3: "kp3",
    Numpad4: "kp4",
    Numpad5: "kp5",
    Numpad6: "kp6",
    Numpad7: "kp7",
    Numpad8: "kp8",
    Numpad9: "kp9",
    NumpadDecimal: "kpperiod",
    NumpadDivide: "kpslash",
    NumpadMultiply: "kpasterisk",
    NumpadSubtract: "kpminus",
    NumpadAdd: "kpplus",
    NumpadEnter: "kpenter",
};

const MOUSE_BUTTON_TO_TOKEN: Record<number, string> = {
    0: "leftbutton",
    1: "middlebutton",
    2: "rightbutton",
    3: "sidebuttonback",
    4: "sidebuttonforward",
};

const GAMEPAD_BUTTON_TO_TOKEN = [
    "cross",
    "circle",
    "square",
    "triangle",
    "l1",
    "r1",
    "l2",
    "r2",
    "share",
    "options",
    "l3",
    "r3",
    "pad_up",
    "pad_down",
    "pad_left",
    "pad_right",
] as const;

export function keyboardEventToToken(event: KeyboardEvent): string | null {
    if (event.code === "Escape") {
        return null;
    }
    return CODE_TO_TOKEN[event.code] ?? null;
}

export function mouseEventToToken(event: MouseEvent): string | null {
    const token = MOUSE_BUTTON_TO_TOKEN[event.button];
    return token ?? null;
}

export function gamepadButtonToToken(buttonIndex: number): string | null {
    return GAMEPAD_BUTTON_TO_TOKEN[buttonIndex] ?? null;
}

export function isMouseToken(token: string): boolean {
    return MOUSE_INPUT_TOKENS.has(token);
}
