import {
    FULL_SCREEN_MODE_OPTIONS,
    PRESENT_MODE_OPTIONS,
    READBACKS_MODE_OPTIONS,
    type ResolvedEmulatorConfig,
} from "@/lib/emulator-config";
import {
    IntSelectControl,
    NumberStepper,
    SelectControl,
    SettingRow,
    SettingSection,
    SliderControl,
    SwitchControl,
} from "./fields";
import type { ConfigUpdater } from "./types";

export function GraphicsCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const g = config.GPU;
    return (
        <div className="space-y-8">
            <SettingSection
                description="Window size, display mode, and presentation."
                title="Display"
            >
                <SettingRow
                    description="Window width in pixels."
                    htmlFor="win-w"
                    label="Window width"
                >
                    <NumberStepper
                        id="win-w"
                        max={9999}
                        min={0}
                        onChange={(v) => set("GPU", "window_width", v)}
                        suffix="px"
                        value={g.window_width}
                    />
                </SettingRow>
                <SettingRow
                    description="Window height in pixels."
                    htmlFor="win-h"
                    label="Window height"
                >
                    <NumberStepper
                        id="win-h"
                        max={9999}
                        min={0}
                        onChange={(v) => set("GPU", "window_height", v)}
                        suffix="px"
                        value={g.window_height}
                    />
                </SettingRow>
                <SettingRow
                    description="Internal game render width."
                    htmlFor="int-w"
                    label="Internal width"
                >
                    <NumberStepper
                        id="int-w"
                        min={1}
                        onChange={(v) => set("GPU", "internal_screen_width", v)}
                        suffix="px"
                        value={g.internal_screen_width}
                    />
                </SettingRow>
                <SettingRow
                    description="Internal game render height."
                    htmlFor="int-h"
                    label="Internal height"
                >
                    <NumberStepper
                        id="int-h"
                        min={1}
                        onChange={(v) =>
                            set("GPU", "internal_screen_height", v)
                        }
                        suffix="px"
                        value={g.internal_screen_height}
                    />
                </SettingRow>
                <SettingRow
                    description="Window display mode."
                    htmlFor="fs-mode"
                    label="Fullscreen mode"
                >
                    <SelectControl
                        id="fs-mode"
                        onChange={(v) => set("GPU", "full_screen_mode", v)}
                        options={FULL_SCREEN_MODE_OPTIONS}
                        value={g.full_screen_mode}
                    />
                </SettingRow>
                <SettingRow
                    description="Runtime fullscreen state (also toggled by hotkey / IPC)."
                    htmlFor="fullscreen"
                    label="Fullscreen"
                >
                    <SwitchControl
                        checked={g.full_screen}
                        id="fullscreen"
                        onCheckedChange={(v) => set("GPU", "full_screen", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Vulkan presentation mode. Fifo is VSync; Immediate is no VSync."
                    htmlFor="present"
                    label="Present mode"
                >
                    <SelectControl
                        id="present"
                        onChange={(v) => set("GPU", "present_mode", v)}
                        options={PRESENT_MODE_OPTIONS}
                        value={g.present_mode}
                    />
                </SettingRow>
                <SettingRow
                    description="Emulated VBlank frequency. Values below 30 are clamped to 30 at runtime."
                    htmlFor="vblank"
                    label="VBlank frequency"
                >
                    <NumberStepper
                        id="vblank"
                        max={9999}
                        min={30}
                        onChange={(v) => set("GPU", "vblank_frequency", v)}
                        suffix="Hz"
                        value={g.vblank_frequency}
                    />
                </SettingRow>
                <SettingRow
                    description="Allow HDR output."
                    htmlFor="hdr"
                    label="Allow HDR"
                >
                    <SwitchControl
                        checked={g.hdr_allowed}
                        id="hdr"
                        onCheckedChange={(v) => set("GPU", "hdr_allowed", v)}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection
                description="Upscaling and sharpening."
                title="FSR / RCAS"
            >
                <SettingRow
                    description="Enable AMD FidelityFX Super Resolution."
                    htmlFor="fsr"
                    label="FSR"
                >
                    <SwitchControl
                        checked={g.fsr_enabled}
                        id="fsr"
                        onCheckedChange={(v) => set("GPU", "fsr_enabled", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Enable RCAS sharpening."
                    htmlFor="rcas"
                    label="RCAS"
                >
                    <SwitchControl
                        checked={g.rcas_enabled}
                        id="rcas"
                        onCheckedChange={(v) => set("GPU", "rcas_enabled", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="RCAS attenuation. Displayed as value ÷ 1000 (range 0–3000)."
                    htmlFor="rcas-att"
                    label="RCAS attenuation"
                >
                    <SliderControl
                        displayValue={(g.rcas_attenuation / 1000).toFixed(3)}
                        id="rcas-att"
                        max={3000}
                        min={0}
                        onChange={(v) => set("GPU", "rcas_attenuation", v)}
                        value={g.rcas_attenuation}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection
                description="GPU debug and experimental paths."
                title="GPU options"
            >
                <SettingRow
                    description="Disable rendering. Useful for testing."
                    htmlFor="null-gpu"
                    label="Null GPU"
                >
                    <SwitchControl
                        checked={g.null_gpu}
                        id="null-gpu"
                        onCheckedChange={(v) => set("GPU", "null_gpu", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Copy GPU buffers for debugging."
                    htmlFor="copy-buf"
                    label="Copy GPU buffers"
                >
                    <SwitchControl
                        checked={g.copy_gpu_buffers}
                        id="copy-buf"
                        onCheckedChange={(v) =>
                            set("GPU", "copy_gpu_buffers", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Control GPU-to-CPU readbacks."
                    experimental
                    htmlFor="readbacks"
                    label="Readbacks mode"
                >
                    <IntSelectControl
                        id="readbacks"
                        onChange={(v) => set("GPU", "readbacks_mode", v)}
                        options={READBACKS_MODE_OPTIONS}
                        value={g.readbacks_mode}
                    />
                </SettingRow>
                <SettingRow
                    description="Asynchronous readback of GPU-modified linear images."
                    htmlFor="readback-lin"
                    label="Readback linear images"
                >
                    <SwitchControl
                        checked={g.readback_linear_images_enabled}
                        id="readback-lin"
                        onCheckedChange={(v) =>
                            set("GPU", "readback_linear_images_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Allow arbitrary GPU access to CPU memory."
                    experimental
                    htmlFor="dma"
                    label="Direct memory access"
                >
                    <SwitchControl
                        checked={g.direct_memory_access_enabled}
                        id="dma"
                        onCheckedChange={(v) =>
                            set("GPU", "direct_memory_access_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Dump loaded shaders under shader/dumps."
                    htmlFor="dump-sh"
                    label="Dump shaders"
                >
                    <SwitchControl
                        checked={g.dump_shaders}
                        id="dump-sh"
                        onCheckedChange={(v) => set("GPU", "dump_shaders", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Load shader patches from the shader patch directory."
                    htmlFor="patch-sh"
                    label="Patch shaders"
                >
                    <SwitchControl
                        checked={g.patch_shaders}
                        id="patch-sh"
                        onCheckedChange={(v) => set("GPU", "patch_shaders", v)}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}

export function VulkanCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const v = config.Vulkan;
    return (
        <div className="space-y-8">
            <SettingSection
                description="Physical device and validation layers."
                title="Device"
            >
                <SettingRow
                    description="Vulkan physical device index. −1 means automatic."
                    htmlFor="gpu-id"
                    label="GPU ID"
                >
                    <NumberStepper
                        id="gpu-id"
                        min={-1}
                        onChange={(n) => set("Vulkan", "gpu_id", n)}
                        value={v.gpu_id}
                    />
                </SettingRow>
                <SettingRow
                    description="Automatically hook RenderDoc when available."
                    htmlFor="rdoc"
                    label="RenderDoc"
                >
                    <SwitchControl
                        checked={v.renderdoc_enabled}
                        id="rdoc"
                        onCheckedChange={(n) =>
                            set("Vulkan", "renderdoc_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable Vulkan validation layers."
                    htmlFor="vkval"
                    label="Validation"
                >
                    <SwitchControl
                        checked={v.vkvalidation_enabled}
                        id="vkval"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkvalidation_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Core validation inside the validation layer."
                    htmlFor="vkcore"
                    label="Core validation"
                >
                    <SwitchControl
                        checked={v.vkvalidation_core_enabled}
                        id="vkcore"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkvalidation_core_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Synchronization validation."
                    htmlFor="vksync"
                    label="Sync validation"
                >
                    <SwitchControl
                        checked={v.vkvalidation_sync_enabled}
                        id="vksync"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkvalidation_sync_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="GPU-assisted validation."
                    htmlFor="vkgpu"
                    label="GPU validation"
                >
                    <SwitchControl
                        checked={v.vkvalidation_gpu_enabled}
                        id="vkgpu"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkvalidation_gpu_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Vulkan crash diagnostics."
                    htmlFor="vkcrash"
                    label="Crash diagnostics"
                >
                    <SwitchControl
                        checked={v.vkcrash_diagnostic_enabled}
                        id="vkcrash"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkcrash_diagnostic_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Host-side debug markers."
                    htmlFor="vkhost"
                    label="Host markers"
                >
                    <SwitchControl
                        checked={v.vkhost_markers}
                        id="vkhost"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkhost_markers", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Guest-side debug markers."
                    htmlFor="vkguest"
                    label="Guest markers"
                >
                    <SwitchControl
                        checked={v.vkguest_markers}
                        id="vkguest"
                        onCheckedChange={(n) =>
                            set("Vulkan", "vkguest_markers", n)
                        }
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection title="Pipeline cache">
                <SettingRow
                    description="Store compiled pipeline data in the cache."
                    htmlFor="pipe"
                    label="Pipeline cache"
                >
                    <SwitchControl
                        checked={v.pipeline_cache_enabled}
                        id="pipe"
                        onCheckedChange={(n) =>
                            set("Vulkan", "pipeline_cache_enabled", n)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Compress pipeline cache files into an archive."
                    htmlFor="pipe-arch"
                    label="Archive pipeline cache"
                >
                    <SwitchControl
                        checked={v.pipeline_cache_archived}
                        id="pipe-arch"
                        onCheckedChange={(n) =>
                            set("Vulkan", "pipeline_cache_archived", n)
                        }
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}
