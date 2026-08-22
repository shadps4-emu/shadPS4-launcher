import {
    AUDIO_BACKEND_OPTIONS,
    CURSOR_STATE_OPTIONS,
    OPENAL_HRTF_OPTIONS,
    OPENAL_OUTPUT_OPTIONS,
    type ResolvedEmulatorConfig,
    USB_BACKEND_OPTIONS,
} from "@/lib/emulator-config";
import {
    IntSelectControl,
    NumberStepper,
    SettingRow,
    SettingSection,
    SwitchControl,
    TextControl,
} from "./fields";
import type { ConfigUpdater } from "./types";

export function AudioCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const a = config.Audio;
    const isOpenAL = a.audio_backend === 1;
    return (
        <div className="space-y-8">
            <SettingSection title="Backend">
                <SettingRow
                    description="Select the audio backend."
                    htmlFor="audio-be"
                    label="Audio backend"
                >
                    <IntSelectControl
                        id="audio-be"
                        onChange={(v) => set("Audio", "audio_backend", v)}
                        options={AUDIO_BACKEND_OPTIONS}
                        value={a.audio_backend}
                    />
                </SettingRow>
            </SettingSection>

            {!isOpenAL ? (
                <SettingSection
                    description="SDL device names. Use Default Device unless you need a specific endpoint."
                    title="SDL devices"
                >
                    <SettingRow htmlFor="sdl-mic" label="Microphone">
                        <TextControl
                            id="sdl-mic"
                            onChange={(v) => set("Audio", "sdl_mic_device", v)}
                            value={a.sdl_mic_device}
                        />
                    </SettingRow>
                    <SettingRow htmlFor="sdl-main" label="Main output">
                        <TextControl
                            id="sdl-main"
                            onChange={(v) =>
                                set("Audio", "sdl_main_output_device", v)
                            }
                            value={a.sdl_main_output_device}
                        />
                    </SettingRow>
                    <SettingRow
                        description="DualShock 4 speaker output."
                        htmlFor="sdl-pad"
                        label="Pad speaker"
                    >
                        <TextControl
                            id="sdl-pad"
                            onChange={(v) =>
                                set("Audio", "sdl_padSpk_output_device", v)
                            }
                            value={a.sdl_padSpk_output_device}
                        />
                    </SettingRow>
                </SettingSection>
            ) : (
                <SettingSection title="OpenAL">
                    <SettingRow htmlFor="oal-mic" label="Microphone">
                        <TextControl
                            id="oal-mic"
                            onChange={(v) =>
                                set("Audio", "openal_mic_device", v)
                            }
                            value={a.openal_mic_device}
                        />
                    </SettingRow>
                    <SettingRow htmlFor="oal-main" label="Main output">
                        <TextControl
                            id="oal-main"
                            onChange={(v) =>
                                set("Audio", "openal_main_output_device", v)
                            }
                            value={a.openal_main_output_device}
                        />
                    </SettingRow>
                    <SettingRow htmlFor="oal-pad" label="Pad speaker">
                        <TextControl
                            id="oal-pad"
                            onChange={(v) =>
                                set("Audio", "openal_padSpk_output_device", v)
                            }
                            value={a.openal_padSpk_output_device}
                        />
                    </SettingRow>
                    <SettingRow
                        description="OpenAL HRTF mode."
                        htmlFor="hrtf"
                        label="HRTF"
                    >
                        <IntSelectControl
                            id="hrtf"
                            onChange={(v) => set("Audio", "openal_hrtf", v)}
                            options={OPENAL_HRTF_OPTIONS}
                            value={a.openal_hrtf}
                        />
                    </SettingRow>
                    <SettingRow
                        description="OpenAL channel layout."
                        htmlFor="oal-out"
                        label="Output mode"
                    >
                        <IntSelectControl
                            id="oal-out"
                            onChange={(v) =>
                                set("Audio", "openal_output_mode", v)
                            }
                            options={OPENAL_OUTPUT_OPTIONS}
                            value={a.openal_output_mode}
                        />
                    </SettingRow>
                </SettingSection>
            )}
        </div>
    );
}

export function InputCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const i = config.Input;
    return (
        <div className="space-y-8">
            <SettingSection
                description="Controller mappings live in input_config/*.ini and are not edited here."
                title="Cursor & devices"
            >
                <SettingRow
                    description="Cursor visibility policy."
                    htmlFor="cursor"
                    label="Cursor state"
                >
                    <IntSelectControl
                        id="cursor"
                        onChange={(v) => set("Input", "cursor_state", v)}
                        options={CURSOR_STATE_OPTIONS}
                        value={i.cursor_state}
                    />
                </SettingRow>
                <SettingRow
                    description="Idle time before hiding the cursor (0–3600 seconds)."
                    htmlFor="cursor-to"
                    label="Cursor hide timeout"
                >
                    <NumberStepper
                        id="cursor-to"
                        max={3600}
                        min={0}
                        onChange={(v) => set("Input", "cursor_hide_timeout", v)}
                        suffix="s"
                        value={i.cursor_hide_timeout}
                    />
                </SettingRow>
                <SettingRow
                    description="USB toy / figure backend."
                    htmlFor="usb"
                    label="USB device backend"
                >
                    <IntSelectControl
                        id="usb"
                        onChange={(v) => set("Input", "usb_device_backend", v)}
                        options={USB_BACKEND_OPTIONS}
                        value={i.usb_device_backend}
                    />
                </SettingRow>
                <SettingRow
                    description="Camera / device ID. −1 means default."
                    htmlFor="cam"
                    label="Camera ID"
                >
                    <NumberStepper
                        id="cam"
                        min={-1}
                        onChange={(v) => set("Input", "camera_id", v)}
                        value={i.camera_id}
                    />
                </SettingRow>
                <SettingRow
                    description="SDL controller ID / GUID for the default pad."
                    htmlFor="ctrl"
                    label="Default controller ID"
                >
                    <TextControl
                        id="ctrl"
                        onChange={(v) =>
                            set("Input", "default_controller_id", v)
                        }
                        placeholder="Controller GUID"
                        value={i.default_controller_id}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title="Behavior">
                <SettingRow
                    description="Enable motion controls."
                    htmlFor="motion"
                    label="Motion controls"
                >
                    <SwitchControl
                        checked={i.motion_controls_enabled}
                        id="motion"
                        onCheckedChange={(v) =>
                            set("Input", "motion_controls_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Use default.ini for all games; otherwise use &lt;serial&gt;.ini."
                    htmlFor="unified"
                    label="Unified input config"
                >
                    <SwitchControl
                        checked={i.use_unified_input_config}
                        id="unified"
                        onCheckedChange={(v) =>
                            set("Input", "use_unified_input_config", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Read controller input while the emulator is not focused."
                    htmlFor="bg-input"
                    label="Background controller input"
                >
                    <SwitchControl
                        checked={i.background_controller_input}
                        id="bg-input"
                        onCheckedChange={(v) =>
                            set("Input", "background_controller_input", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Treat Circle as the Enter button."
                    htmlFor="circle-enter"
                    label="Circle as Enter"
                >
                    <SwitchControl
                        checked={i.is_circle_enter}
                        id="circle-enter"
                        onCheckedChange={(v) =>
                            set("Input", "is_circle_enter", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Keep mice as mouse devices instead of mapping them through controller emulation."
                    htmlFor="mice"
                    label="Use mice as mice"
                >
                    <SwitchControl
                        checked={i.use_mice_as_mice}
                        id="mice"
                        onCheckedChange={(v) =>
                            set("Input", "use_mice_as_mice", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable special pad handling."
                    htmlFor="spad"
                    label="Special pad"
                >
                    <SwitchControl
                        checked={i.use_special_pad}
                        id="spad"
                        onCheckedChange={(v) =>
                            set("Input", "use_special_pad", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Special pad class (backend-specific)."
                    htmlFor="spad-class"
                    label="Special pad class"
                >
                    <NumberStepper
                        id="spad-class"
                        min={0}
                        onChange={(v) => set("Input", "special_pad_class", v)}
                        value={i.special_pad_class}
                    />
                </SettingRow>
                <SettingRow
                    description="Enable IME accessibility behavior."
                    htmlFor="ime-a11y"
                    label="IME accessibility"
                >
                    <SwitchControl
                        checked={i.ime_accessibility_enabled}
                        id="ime-a11y"
                        onCheckedChange={(v) =>
                            set("Input", "ime_accessibility_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable the URL/mail short panel in the IME."
                    htmlFor="ime-url"
                    label="IME URL/mail short panel"
                >
                    <SwitchControl
                        checked={i.ime_url_mail_short_panel}
                        id="ime-url"
                        onCheckedChange={(v) =>
                            set("Input", "ime_url_mail_short_panel", v)
                        }
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}
