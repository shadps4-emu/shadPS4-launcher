/** Default `default.ini` shipped by the emulator when the file is missing. */
export const DEFAULT_INPUT_INI = `#Feeling lost? Check out the Help section!

# Keyboard bindings

triangle = kp8
circle = kp6
cross = kp2
square = kp4
# Alternatives for users without a keypad
triangle = c
circle = b
cross = n
square = v

l1 = q
r1 = u
l2 = e
r2 = o
l3 = x
r3 = m

options = enter
touchpad_center = space

pad_up = up
pad_down = down
pad_left = left
pad_right = right

axis_left_x_minus = a
axis_left_x_plus = d
axis_left_y_minus = w
axis_left_y_plus = s

axis_right_x_minus = j
axis_right_x_plus = l
axis_right_y_minus = i
axis_right_y_plus = k

# Controller bindings

triangle = triangle
cross = cross
square = square
circle = circle

l1 = l1
l2 = l2
l3 = l3
r1 = r1
r2 = r2
r3 = r3

options = options
touchpad_center = back

pad_up = pad_up
pad_down = pad_down
pad_left = pad_left
pad_right = pad_right

axis_left_x = axis_left_x
axis_left_y = axis_left_y
axis_right_x = axis_right_x
axis_right_y = axis_right_y

# Range of deadzones: 1 (almost none) to 127 (max)
analog_deadzone = leftjoystick, 5, 127
analog_deadzone = rightjoystick, 5, 127

override_controller_color = false, 0, 0, 255
`;

/** Default header for `global.ini`. Hotkeys are merged on first load by the emulator. */
export const DEFAULT_GLOBAL_INI = `# Anything put here will be loaded for all games,
# alongside the game's config or default.ini depending on your preference.
`;

export const DEFAULT_HOTKEYS: Record<string, string> = {
    hotkey_capture_frame: "f12",
    hotkey_screenshot_with_overlays: "lalt, f12",
    hotkey_fullscreen: "f11",
    hotkey_show_fps: "f10",
    hotkey_pause: "f9",
    hotkey_reload_inputs: "f8",
    hotkey_toggle_mouse_to_joystick: "f7",
    hotkey_toggle_mouse_to_gyro: "f6",
    hotkey_add_virtual_user: "f5",
    hotkey_remove_virtual_user: "f4",
    hotkey_toggle_mouse_to_touchpad: "delete",
    hotkey_quit: "lctrl, lshift, end",
    hotkey_volume_up: "kpplus",
    hotkey_volume_down: "kpminus",
    hotkey_emulator_settings: "f3",
    hotkey_toggle_friends: "f2",
};
