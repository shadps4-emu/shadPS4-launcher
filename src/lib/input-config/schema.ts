import { z } from "zod";

export const bindingInputsSchema = z.tuple([
    z.string(),
    z.string().optional(),
    z.string().optional(),
]);

export type BindingInputs = z.infer<typeof bindingInputsSchema>;

export type InputBindingEntry = {
    inputs: BindingInputs;
};

export type ParsedInputIni = {
    /** Comment / blank lines before the first binding. */
    preamble: string[];
    bindings: Record<string, InputBindingEntry[]>;
    /** Special keys such as analog_deadzone or hotkeys. */
    specials: Record<string, string>;
    /** Trailing comments and unrecognized lines preserved on save. */
    extras: string[];
};

export type InputBindingTab = "controller" | "keyboard" | "mouse";

/** PS4 outputs users can bind in default.ini. */
export const BINDABLE_OUTPUTS = [
    "triangle",
    "circle",
    "cross",
    "square",
    "l1",
    "r1",
    "l2",
    "r2",
    "l3",
    "r3",
    "options",
    "touchpad_left",
    "touchpad_center",
    "touchpad_right",
    "pad_up",
    "pad_down",
    "pad_left",
    "pad_right",
    "axis_left_x",
    "axis_left_y",
    "axis_right_x",
    "axis_right_y",
    "axis_left_x_minus",
    "axis_left_x_plus",
    "axis_left_y_minus",
    "axis_left_y_plus",
    "axis_right_x_minus",
    "axis_right_x_plus",
    "axis_right_y_minus",
    "axis_right_y_plus",
] as const;

export type BindableOutput = (typeof BINDABLE_OUTPUTS)[number];

export const OUTPUT_GROUPS: {
    title: string;
    outputs: BindableOutput[];
}[] = [
    {
        title: "Face buttons",
        outputs: ["triangle", "circle", "cross", "square"],
    },
    {
        title: "Shoulders & sticks",
        outputs: ["l1", "r1", "l2", "r2", "l3", "r3"],
    },
    {
        title: "System",
        outputs: [
            "options",
            "touchpad_left",
            "touchpad_center",
            "touchpad_right",
        ],
    },
    {
        title: "D-pad",
        outputs: ["pad_up", "pad_down", "pad_left", "pad_right"],
    },
    {
        title: "Left stick",
        outputs: [
            "axis_left_x",
            "axis_left_y",
            "axis_left_x_minus",
            "axis_left_x_plus",
            "axis_left_y_minus",
            "axis_left_y_plus",
        ],
    },
    {
        title: "Right stick",
        outputs: [
            "axis_right_x",
            "axis_right_y",
            "axis_right_x_minus",
            "axis_right_x_plus",
            "axis_right_y_minus",
            "axis_right_y_plus",
        ],
    },
];

export const OUTPUT_LABELS: Record<string, string> = {
    triangle: "△ Triangle",
    circle: "○ Circle",
    cross: "✕ Cross",
    square: "□ Square",
    l1: "L1",
    r1: "R1",
    l2: "L2",
    r2: "R2",
    l3: "L3",
    r3: "R3",
    options: "Options",
    touchpad_left: "Touchpad left",
    touchpad_center: "Touchpad center",
    touchpad_right: "Touchpad right",
    pad_up: "D-pad up",
    pad_down: "D-pad down",
    pad_left: "D-pad left",
    pad_right: "D-pad right",
    axis_left_x: "Left stick X",
    axis_left_y: "Left stick Y",
    axis_right_x: "Right stick X",
    axis_right_y: "Right stick Y",
    axis_left_x_minus: "Left stick ←",
    axis_left_x_plus: "Left stick →",
    axis_left_y_minus: "Left stick ↑",
    axis_left_y_plus: "Left stick ↓",
    axis_right_x_minus: "Right stick ←",
    axis_right_x_plus: "Right stick →",
    axis_right_y_minus: "Right stick ↑",
    axis_right_y_plus: "Right stick ↓",
};

export const HOTKEY_LABELS: Record<string, string> = {
    hotkey_capture_frame: "Capture frame",
    hotkey_screenshot_with_overlays: "Screenshot (overlays)",
    hotkey_fullscreen: "Toggle fullscreen",
    hotkey_show_fps: "Toggle FPS counter",
    hotkey_pause: "Pause / resume",
    hotkey_reload_inputs: "Reload inputs",
    hotkey_toggle_mouse_to_joystick: "Toggle mouse → stick",
    hotkey_toggle_mouse_to_gyro: "Toggle mouse → gyro",
    hotkey_add_virtual_user: "Add virtual user",
    hotkey_remove_virtual_user: "Remove virtual user",
    hotkey_toggle_mouse_to_touchpad: "Toggle mouse → touchpad",
    hotkey_quit: "Quit emulator",
    hotkey_volume_up: "Volume up",
    hotkey_volume_down: "Volume down",
    hotkey_emulator_settings: "Emulator settings",
    hotkey_toggle_friends: "Toggle friends",
};

export const CONTROLLER_INPUT_TOKENS = new Set([
    "triangle",
    "circle",
    "cross",
    "square",
    "l1",
    "r1",
    "l2",
    "r2",
    "l3",
    "r3",
    "options",
    "back",
    "share",
    "pad_up",
    "pad_down",
    "pad_left",
    "pad_right",
    "lpaddle_high",
    "lpaddle_low",
    "rpaddle_high",
    "rpaddle_low",
    "r4",
    "l4",
    "r5",
    "l5",
    "axis_left_x",
    "axis_left_y",
    "axis_right_x",
    "axis_right_y",
    "axis_left_x_minus",
    "axis_left_x_plus",
    "axis_left_y_minus",
    "axis_left_y_plus",
    "axis_right_x_minus",
    "axis_right_x_plus",
    "axis_right_y_minus",
    "axis_right_y_plus",
]);

export const MOUSE_INPUT_TOKENS = new Set([
    "leftbutton",
    "rightbutton",
    "middlebutton",
    "sidebuttonback",
    "sidebuttonforward",
    "mousewheelup",
    "mousewheeldown",
    "mousewheelleft",
    "mousewheelright",
]);

export const SPECIAL_CONFIG_KEYS = new Set([
    "mouse_to_joystick",
    "mouse_movement_params",
    "key_toggle",
    "analog_deadzone",
    "override_controller_color",
    "leftjoystick_halfmode",
    "rightjoystick_halfmode",
    "mouse_gyro_roll_mode",
    ...Object.keys(HOTKEY_LABELS),
    "hotkey_renderdoc_capture",
]);

export function tokenBase(token: string): string {
    const idx = token.indexOf(":");
    return idx === -1 ? token : token.slice(0, idx);
}

export function classifyBindingInputs(inputs: BindingInputs): InputBindingTab {
    const tokens = inputs
        .filter((token): token is string => Boolean(token))
        .map(tokenBase);
    if (tokens.some((t) => MOUSE_INPUT_TOKENS.has(t))) {
        return "mouse";
    }
    if (tokens.some((t) => CONTROLLER_INPUT_TOKENS.has(t))) {
        return "controller";
    }
    return "keyboard";
}

export function formatBindingInputs(inputs: BindingInputs): string {
    return inputs.filter(Boolean).join(" + ");
}

const TOKEN_LABELS: Record<string, string> = {
    leftbutton: "Mouse 1",
    rightbutton: "Mouse 2",
    middlebutton: "Mouse 3",
    sidebuttonback: "Mouse 4",
    sidebuttonforward: "Mouse 5",
    mousewheelup: "Wheel ↑",
    mousewheeldown: "Wheel ↓",
    mousewheelleft: "Wheel ←",
    mousewheelright: "Wheel →",
    pad_up: "D-pad Up",
    pad_down: "D-pad Down",
    pad_left: "D-pad Left",
    pad_right: "D-pad Right",
    l1: "L1",
    l2: "L2",
    l3: "L3",
    l4: "L4",
    l5: "L5",
    r1: "R1",
    r2: "R2",
    r3: "R3",
    r4: "R4",
    r5: "R5",
    lpaddle_high: "Left Paddle High",
    lpaddle_low: "Left Paddle Low",
    rpaddle_high: "Right Paddle High",
    rpaddle_low: "Right Paddle Low",
    axis_left_x: "Left Stick X",
    axis_left_y: "Left Stick Y",
    axis_right_x: "Right Stick X",
    axis_right_y: "Right Stick Y",
    axis_left_x_minus: "Left Stick ←",
    axis_left_x_plus: "Left Stick →",
    axis_left_y_minus: "Left Stick ↑",
    axis_left_y_plus: "Left Stick ↓",
    axis_right_x_minus: "Right Stick ←",
    axis_right_x_plus: "Right Stick →",
    axis_right_y_minus: "Right Stick ↑",
    axis_right_y_plus: "Right Stick ↓",
    lctrl: "L Ctrl",
    rctrl: "R Ctrl",
    lshift: "L Shift",
    rshift: "R Shift",
    lalt: "L Alt",
    ralt: "R Alt",
    lmeta: "L Meta",
    rmeta: "R Meta",
};

export function formatTokenLabel(token: string): string {
    const base = tokenBase(token);
    if (TOKEN_LABELS[base]) {
        return TOKEN_LABELS[base];
    }
    if (base.startsWith("kp")) {
        return `Num ${base.slice(2).toUpperCase()}`;
    }
    if (/^f\d{1,2}$/.test(base)) {
        return base.toUpperCase();
    }
    return base
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
