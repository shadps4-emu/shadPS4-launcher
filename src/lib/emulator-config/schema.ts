import { z } from "zod";

/** Bytes — emulator default is 100 MB. */
export const DEFAULT_LOG_SIZE_LIMIT = 100 * 1024 * 1024;

export const gameInstallDirSchema = z.object({
    path: z.string(),
    enabled: z.boolean(),
});

export type GameInstallDir = z.infer<typeof gameInstallDirSchema>;

const generalSchema = z
    .object({
        install_dirs: z.array(gameInstallDirSchema),
        addon_install_dir: z.string(),
        home_dir: z.string(),
        sys_modules_dir: z.string(),
        font_dir: z.string(),
        volume_slider: z.number().int(),
        neo_mode: z.boolean(),
        dev_kit_mode: z.boolean(),
        extra_dmem_in_mbytes: z.number().int(),
        extra_fmem_in_mbytes: z.number().int(),
        shad_net_enabled: z.boolean(),
        trophy_popup_disabled: z.boolean(),
        trophy_notification_duration: z.number(),
        trophy_notification_side: z.enum(["left", "right", "top", "bottom"]),
        show_splash: z.boolean(),
        connected_to_network: z.boolean(),
        discord_rpc_enabled: z.boolean(),
        show_fps_counter: z.boolean(),
        console_language: z.number().int(),
        big_picture_scale: z.number().int(),
        shadnet_server: z.string(),
        shadnet_webapi_server: z.string(),
        signaling_info: z.string(),
        enable_upnp: z.boolean(),
    })
    .partial()
    .passthrough();

const logSchema = z
    .object({
        append: z.boolean(),
        enable: z.boolean(),
        filter: z.string(),
        flush_level: z.string(),
        max_skip_duration: z.number().int(),
        separate: z.boolean(),
        size_limit: z.number().int(),
        skip_duplicate: z.boolean(),
        sync: z.boolean(),
        type: z.enum(["wincolor", "msvc"]),
    })
    .partial()
    .passthrough();

const debugSchema = z
    .object({
        debug_dump: z.boolean(),
        shader_collect: z.boolean(),
        config_version: z.string(),
    })
    .partial()
    .passthrough();

const inputSchema = z
    .object({
        cursor_state: z.number().int(),
        cursor_hide_timeout: z.number().int(),
        usb_device_backend: z.number().int(),
        use_special_pad: z.boolean(),
        special_pad_class: z.number().int(),
        motion_controls_enabled: z.boolean(),
        use_unified_input_config: z.boolean(),
        default_controller_id: z.string(),
        background_controller_input: z.boolean(),
        ime_accessibility_enabled: z.boolean(),
        ime_url_mail_short_panel: z.boolean(),
        is_circle_enter: z.boolean(),
        camera_id: z.number().int(),
        use_mice_as_mice: z.boolean(),
    })
    .partial()
    .passthrough();

const audioSchema = z
    .object({
        audio_backend: z.number().int(),
        sdl_mic_device: z.string(),
        sdl_main_output_device: z.string(),
        sdl_padSpk_output_device: z.string(),
        openal_mic_device: z.string(),
        openal_main_output_device: z.string(),
        openal_padSpk_output_device: z.string(),
        openal_hrtf: z.number().int(),
        openal_output_mode: z.number().int(),
    })
    .partial()
    .passthrough();

const gpuSchema = z
    .object({
        window_width: z.number().int(),
        window_height: z.number().int(),
        internal_screen_width: z.number().int(),
        internal_screen_height: z.number().int(),
        null_gpu: z.boolean(),
        copy_gpu_buffers: z.boolean(),
        readbacks_mode: z.number().int(),
        readback_linear_images_enabled: z.boolean(),
        direct_memory_access_enabled: z.boolean(),
        dump_shaders: z.boolean(),
        patch_shaders: z.boolean(),
        vblank_frequency: z.number().int(),
        full_screen: z.boolean(),
        full_screen_mode: z.enum([
            "Windowed",
            "Fullscreen",
            "Fullscreen (Borderless)",
        ]),
        present_mode: z.enum(["Mailbox", "Fifo", "Immediate"]),
        hdr_allowed: z.boolean(),
        fsr_enabled: z.boolean(),
        rcas_enabled: z.boolean(),
        rcas_attenuation: z.number().int(),
    })
    .partial()
    .passthrough();

const vulkanSchema = z
    .object({
        gpu_id: z.number().int(),
        renderdoc_enabled: z.boolean(),
        vkvalidation_enabled: z.boolean(),
        vkvalidation_core_enabled: z.boolean(),
        vkvalidation_sync_enabled: z.boolean(),
        vkvalidation_gpu_enabled: z.boolean(),
        vkcrash_diagnostic_enabled: z.boolean(),
        vkhost_markers: z.boolean(),
        vkguest_markers: z.boolean(),
        pipeline_cache_enabled: z.boolean(),
        pipeline_cache_archived: z.boolean(),
    })
    .partial()
    .passthrough();

const windowsRedZoneSchema = z
    .object({
        windows_guest_red_zone_protection_mode: z.enum([
            "Disabled",
            "StaticPatching",
        ]),
    })
    .partial()
    .passthrough();

/** Loose parser for emulator `config.json`. Unknown keys are kept via passthrough. */
export const emulatorConfigSchema = z
    .object({
        General: generalSchema,
        Log: logSchema,
        Debug: debugSchema,
        Input: inputSchema,
        Audio: audioSchema,
        GPU: gpuSchema,
        Vulkan: vulkanSchema,
        WindowsGuestRedZoneProtection: windowsRedZoneSchema,
    })
    .partial()
    .passthrough();

export type EmulatorConfig = z.infer<typeof emulatorConfigSchema>;
export type GeneralSettings = NonNullable<EmulatorConfig["General"]>;
export type LogSettings = NonNullable<EmulatorConfig["Log"]>;
export type DebugSettings = NonNullable<EmulatorConfig["Debug"]>;
export type InputSettings = NonNullable<EmulatorConfig["Input"]>;
export type AudioSettings = NonNullable<EmulatorConfig["Audio"]>;
export type GpuSettings = NonNullable<EmulatorConfig["GPU"]>;
export type VulkanSettings = NonNullable<EmulatorConfig["Vulkan"]>;
export type WindowsRedZoneSettings = NonNullable<
    EmulatorConfig["WindowsGuestRedZoneProtection"]
>;

export const DEFAULT_EMULATOR_CONFIG = {
    General: {
        install_dirs: [] as GameInstallDir[],
        addon_install_dir: "",
        home_dir: "",
        sys_modules_dir: "",
        font_dir: "",
        volume_slider: 100,
        neo_mode: false,
        dev_kit_mode: false,
        extra_dmem_in_mbytes: 0,
        extra_fmem_in_mbytes: 0,
        shad_net_enabled: false,
        trophy_popup_disabled: false,
        trophy_notification_duration: 6.0,
        trophy_notification_side: "right" as const,
        show_splash: false,
        connected_to_network: false,
        discord_rpc_enabled: false,
        show_fps_counter: false,
        console_language: 1,
        big_picture_scale: 1000,
        shadnet_server: "srv.shadps4.net:31313",
        shadnet_webapi_server: "http://srv.shadps4.net:31315",
        signaling_info: "",
        enable_upnp: true,
    },
    Log: {
        append: false,
        enable: true,
        filter: "",
        flush_level: "",
        max_skip_duration: 5000,
        separate: false,
        size_limit: DEFAULT_LOG_SIZE_LIMIT,
        skip_duplicate: true,
        sync: true,
        type: "wincolor" as const,
    },
    Debug: {
        debug_dump: false,
        shader_collect: false,
        config_version: "",
    },
    Input: {
        cursor_state: 1,
        cursor_hide_timeout: 5,
        usb_device_backend: 0,
        use_special_pad: false,
        special_pad_class: 1,
        motion_controls_enabled: true,
        use_unified_input_config: true,
        default_controller_id: "",
        background_controller_input: false,
        ime_accessibility_enabled: false,
        ime_url_mail_short_panel: false,
        is_circle_enter: false,
        camera_id: -1,
        use_mice_as_mice: false,
    },
    Audio: {
        audio_backend: 0,
        sdl_mic_device: "Default Device",
        sdl_main_output_device: "Default Device",
        sdl_padSpk_output_device: "Default Device",
        openal_mic_device: "Default Device",
        openal_main_output_device: "Default Device",
        openal_padSpk_output_device: "Default Device",
        openal_hrtf: 0,
        openal_output_mode: 0,
    },
    GPU: {
        window_width: 1280,
        window_height: 720,
        internal_screen_width: 1280,
        internal_screen_height: 720,
        null_gpu: false,
        copy_gpu_buffers: false,
        readbacks_mode: 0,
        readback_linear_images_enabled: false,
        direct_memory_access_enabled: false,
        dump_shaders: false,
        patch_shaders: false,
        vblank_frequency: 60,
        full_screen: false,
        full_screen_mode: "Windowed" as const,
        present_mode: "Mailbox" as const,
        hdr_allowed: false,
        fsr_enabled: false,
        rcas_enabled: true,
        rcas_attenuation: 250,
    },
    Vulkan: {
        gpu_id: -1,
        renderdoc_enabled: false,
        vkvalidation_enabled: false,
        vkvalidation_core_enabled: true,
        vkvalidation_sync_enabled: false,
        vkvalidation_gpu_enabled: false,
        vkcrash_diagnostic_enabled: false,
        vkhost_markers: false,
        vkguest_markers: false,
        pipeline_cache_enabled: false,
        pipeline_cache_archived: false,
    },
    WindowsGuestRedZoneProtection: {
        windows_guest_red_zone_protection_mode: "Disabled" as const,
    },
} satisfies EmulatorConfig;

export type ResolvedEmulatorConfig = {
    General: Required<NonNullable<EmulatorConfig["General"]>>;
    Log: Required<NonNullable<EmulatorConfig["Log"]>>;
    Debug: Required<NonNullable<EmulatorConfig["Debug"]>>;
    Input: Required<NonNullable<EmulatorConfig["Input"]>>;
    Audio: Required<NonNullable<EmulatorConfig["Audio"]>>;
    GPU: Required<NonNullable<EmulatorConfig["GPU"]>>;
    Vulkan: Required<NonNullable<EmulatorConfig["Vulkan"]>>;
    WindowsGuestRedZoneProtection: Required<
        NonNullable<EmulatorConfig["WindowsGuestRedZoneProtection"]>
    >;
};

export function parseEmulatorConfig(raw: unknown): EmulatorConfig {
    return emulatorConfigSchema.parse(raw);
}

/** Merge file contents with factory defaults so the UI always has complete sections. */
export function resolveEmulatorConfig(
    raw: EmulatorConfig | null,
): ResolvedEmulatorConfig {
    const parsed = raw ?? {};
    return {
        General: {
            ...DEFAULT_EMULATOR_CONFIG.General,
            ...parsed.General,
        } as ResolvedEmulatorConfig["General"],
        Log: {
            ...DEFAULT_EMULATOR_CONFIG.Log,
            ...parsed.Log,
        } as ResolvedEmulatorConfig["Log"],
        Debug: {
            ...DEFAULT_EMULATOR_CONFIG.Debug,
            ...parsed.Debug,
        } as ResolvedEmulatorConfig["Debug"],
        Input: {
            ...DEFAULT_EMULATOR_CONFIG.Input,
            ...parsed.Input,
        } as ResolvedEmulatorConfig["Input"],
        Audio: {
            ...DEFAULT_EMULATOR_CONFIG.Audio,
            ...parsed.Audio,
        } as ResolvedEmulatorConfig["Audio"],
        GPU: {
            ...DEFAULT_EMULATOR_CONFIG.GPU,
            ...parsed.GPU,
        } as ResolvedEmulatorConfig["GPU"],
        Vulkan: {
            ...DEFAULT_EMULATOR_CONFIG.Vulkan,
            ...parsed.Vulkan,
        } as ResolvedEmulatorConfig["Vulkan"],
        WindowsGuestRedZoneProtection: {
            ...DEFAULT_EMULATOR_CONFIG.WindowsGuestRedZoneProtection,
            ...parsed.WindowsGuestRedZoneProtection,
        } as ResolvedEmulatorConfig["WindowsGuestRedZoneProtection"],
    };
}

/**
 * Write known sections back while preserving unknown top-level and section keys
 * from the original document (matches emulator Save() behavior).
 */
export function mergeEmulatorConfigForSave(
    previous: EmulatorConfig | null,
    next: ResolvedEmulatorConfig,
): EmulatorConfig {
    const base = { ...(previous ?? {}) } as Record<string, unknown>;
    const sections = [
        "General",
        "Log",
        "Debug",
        "Input",
        "Audio",
        "GPU",
        "Vulkan",
        "WindowsGuestRedZoneProtection",
    ] as const;

    for (const key of sections) {
        const prevSection =
            previous?.[key] && typeof previous[key] === "object"
                ? (previous[key] as Record<string, unknown>)
                : {};
        base[key] = { ...prevSection, ...next[key] };
    }

    return base as EmulatorConfig;
}

export const CONSOLE_LANGUAGES = [
    { id: 0, label: "Japanese" },
    { id: 1, label: "English (US)" },
    { id: 2, label: "French (France)" },
    { id: 3, label: "Spanish (Spain)" },
    { id: 4, label: "German" },
    { id: 5, label: "Italian" },
    { id: 6, label: "Dutch" },
    { id: 7, label: "Portuguese (Portugal)" },
    { id: 8, label: "Russian" },
    { id: 9, label: "Korean" },
    { id: 10, label: "Traditional Chinese" },
    { id: 11, label: "Simplified Chinese" },
    { id: 12, label: "Finnish" },
    { id: 13, label: "Swedish" },
    { id: 14, label: "Danish" },
    { id: 15, label: "Norwegian Bokmål" },
    { id: 16, label: "Polish" },
    { id: 17, label: "Portuguese (Brazil)" },
    { id: 18, label: "English (UK)" },
    { id: 19, label: "Turkish" },
    { id: 20, label: "Spanish (Latin America)" },
    { id: 21, label: "Arabic" },
    { id: 22, label: "French (Canada)" },
    { id: 23, label: "Czech" },
    { id: 24, label: "Hungarian" },
    { id: 25, label: "Greek" },
    { id: 26, label: "Romanian" },
    { id: 27, label: "Thai" },
    { id: 28, label: "Vietnamese" },
    { id: 29, label: "Indonesian" },
    { id: 30, label: "Ukrainian" },
] as const;

export const CURSOR_STATE_OPTIONS = [
    { value: 0, label: "Never hide" },
    { value: 1, label: "Hide when idle" },
    { value: 2, label: "Always hide" },
] as const;

export const USB_BACKEND_OPTIONS = [
    { value: 0, label: "Real USB" },
    { value: 1, label: "Skylanders Portal" },
    { value: 2, label: "Infinity Base" },
    { value: 3, label: "Dimensions Toypad" },
] as const;

export const AUDIO_BACKEND_OPTIONS = [
    { value: 0, label: "SDL" },
    { value: 1, label: "OpenAL" },
] as const;

export const OPENAL_HRTF_OPTIONS = [
    { value: 0, label: "Auto" },
    { value: 1, label: "On" },
    { value: 2, label: "Off" },
] as const;

export const OPENAL_OUTPUT_OPTIONS = [
    { value: 0, label: "Auto" },
    { value: 1, label: "Stereo" },
    { value: 2, label: "Quad" },
    { value: 3, label: "5.1" },
    { value: 4, label: "7.1" },
] as const;

export const READBACKS_MODE_OPTIONS = [
    { value: 0, label: "Disabled" },
    { value: 1, label: "Relaxed" },
    { value: 2, label: "Precise" },
] as const;

export const FULL_SCREEN_MODE_OPTIONS = [
    { value: "Windowed", label: "Windowed" },
    { value: "Fullscreen", label: "Fullscreen" },
    { value: "Fullscreen (Borderless)", label: "Fullscreen (Borderless)" },
] as const;

export const PRESENT_MODE_OPTIONS = [
    { value: "Mailbox", label: "Mailbox" },
    { value: "Fifo", label: "Fifo (VSync)" },
    { value: "Immediate", label: "Immediate (no VSync)" },
] as const;

export const TROPHY_SIDE_OPTIONS = [
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
] as const;

export const LOG_TYPE_OPTIONS = [
    { value: "wincolor", label: "WinColor (WriteConsole)" },
    { value: "msvc", label: "MSVC (OutputDebugString)" },
] as const;

export const RED_ZONE_MODE_OPTIONS = [
    { value: "Disabled", label: "Disabled" },
    { value: "StaticPatching", label: "Static patching" },
] as const;

export const LOG_LEVEL_OPTIONS = [
    { value: "", label: "Default" },
    { value: "trace", label: "Trace" },
    { value: "debug", label: "Debug" },
    { value: "info", label: "Info" },
    { value: "warning", label: "Warning" },
    { value: "error", label: "Error" },
    { value: "critical", label: "Critical" },
    { value: "off", label: "Off" },
] as const;
