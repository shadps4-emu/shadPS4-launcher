import { InfoIcon } from "lucide-react";
import {
    LOG_LEVEL_OPTIONS,
    LOG_TYPE_OPTIONS,
    RED_ZONE_MODE_OPTIONS,
    type ResolvedEmulatorConfig,
} from "@/lib/emulator-config";
import {
    NumberStepper,
    SelectControl,
    SettingRow,
    SettingSection,
    SwitchControl,
    TextControl,
} from "./fields";
import type { ConfigUpdater } from "./types";

/** Radix Select rejects empty string item values; map emulator default to a sentinel. */
const LOG_FLUSH_DEFAULT_SENTINEL = "__default__";

const LOG_FLUSH_LEVEL_OPTIONS = LOG_LEVEL_OPTIONS.map((option) =>
    option.value === ""
        ? { value: LOG_FLUSH_DEFAULT_SENTINEL, label: option.label }
        : option,
);

export function NetworkCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const g = config.General;
    return (
        <div className="space-y-8">
            <SettingSection
                description="Reports network state to games and configures ShadNet. This does not provide PlayStation Network."
                title="Connectivity"
            >
                <SettingRow
                    description="Report a connected network state to games."
                    htmlFor="net"
                    label="Connected to network"
                >
                    <SwitchControl
                        checked={g.connected_to_network}
                        id="net"
                        onCheckedChange={(v) =>
                            set("General", "connected_to_network", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable ShadNet for the emulator."
                    htmlFor="shadnet"
                    label="ShadNet enabled"
                >
                    <SwitchControl
                        checked={g.shad_net_enabled}
                        id="shadnet"
                        onCheckedChange={(v) =>
                            set("General", "shad_net_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable UPnP support for ShadNet networking."
                    htmlFor="upnp"
                    label="UPnP"
                >
                    <SwitchControl
                        checked={g.enable_upnp}
                        id="upnp"
                        onCheckedChange={(v) =>
                            set("General", "enable_upnp", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="ShadNet server host and port."
                    htmlFor="sn-srv"
                    label="ShadNet server"
                >
                    <TextControl
                        className="w-[min(100%,20rem)]"
                        id="sn-srv"
                        onChange={(v) => set("General", "shadnet_server", v)}
                        value={g.shadnet_server}
                    />
                </SettingRow>
                <SettingRow
                    description="ShadNet Web API endpoint URL."
                    htmlFor="sn-api"
                    label="ShadNet Web API"
                >
                    <TextControl
                        className="w-[min(100%,20rem)]"
                        id="sn-api"
                        onChange={(v) =>
                            set("General", "shadnet_webapi_server", v)
                        }
                        value={g.shadnet_webapi_server}
                    />
                </SettingRow>
                <SettingRow
                    description="ShadNet signaling information."
                    htmlFor="signal"
                    label="Signaling info"
                >
                    <TextControl
                        className="w-[min(100%,20rem)]"
                        id="signal"
                        onChange={(v) => set("General", "signaling_info", v)}
                        value={g.signaling_info}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}

export function LoggingCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const l = config.Log;
    const flushValue =
        l.flush_level === "" ||
        LOG_LEVEL_OPTIONS.some((o) => o.value === l.flush_level)
            ? l.flush_level === ""
                ? LOG_FLUSH_DEFAULT_SENTINEL
                : l.flush_level
            : LOG_FLUSH_DEFAULT_SENTINEL;

    return (
        <div className="space-y-8">
            <SettingSection
                description="File logging under the user log directory."
                title="Log file"
            >
                <SettingRow
                    description="Enable file logging."
                    htmlFor="log-en"
                    label="Enable logging"
                >
                    <SwitchControl
                        checked={l.enable}
                        id="log-en"
                        onCheckedChange={(v) => set("Log", "enable", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Append instead of replacing the log file."
                    htmlFor="log-app"
                    label="Append"
                >
                    <SwitchControl
                        checked={l.append}
                        id="log-app"
                        onCheckedChange={(v) => set("Log", "append", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Write a game-specific log instead of the common log file."
                    htmlFor="log-sep"
                    label="Separate per game"
                >
                    <SwitchControl
                        checked={l.separate}
                        id="log-sep"
                        onCheckedChange={(v) => set("Log", "separate", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Group repeated identical log lines."
                    htmlFor="log-skip"
                    label="Skip duplicates"
                >
                    <SwitchControl
                        checked={l.skip_duplicate}
                        id="log-skip"
                        onCheckedChange={(v) => set("Log", "skip_duplicate", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Write logs synchronously. Disabling can improve performance."
                    htmlFor="log-sync"
                    label="Synchronous"
                >
                    <SwitchControl
                        checked={l.sync}
                        id="log-sync"
                        onCheckedChange={(v) => set("Log", "sync", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Time during which duplicate lines are suppressed (ms)."
                    htmlFor="log-skip-ms"
                    label="Max skip duration"
                >
                    <NumberStepper
                        id="log-skip-ms"
                        min={0}
                        onChange={(v) => set("Log", "max_skip_duration", v)}
                        suffix="ms"
                        value={l.max_skip_duration}
                    />
                </SettingRow>
                <SettingRow
                    description="Maximum log size in bytes."
                    htmlFor="log-size"
                    label="Size limit"
                >
                    <NumberStepper
                        id="log-size"
                        max={999999999}
                        min={0}
                        onChange={(v) => set("Log", "size_limit", v)}
                        step={1024 * 1024}
                        suffix="B"
                        value={l.size_limit}
                    />
                </SettingRow>
                <SettingRow
                    description="Filter as class:level entries separated by spaces."
                    htmlFor="log-filter"
                    label="Filter"
                >
                    <TextControl
                        className="w-[min(100%,22rem)]"
                        id="log-filter"
                        onChange={(v) => set("Log", "filter", v)}
                        placeholder="LibKernel:info Common:warning"
                        value={l.filter}
                    />
                </SettingRow>
                <SettingRow
                    description="Flush output at or above this level."
                    htmlFor="flush"
                    label="Flush level"
                >
                    <SelectControl
                        id="flush"
                        onChange={(v) =>
                            set(
                                "Log",
                                "flush_level",
                                v === LOG_FLUSH_DEFAULT_SENTINEL ? "" : v,
                            )
                        }
                        options={LOG_FLUSH_LEVEL_OPTIONS}
                        value={flushValue}
                    />
                </SettingRow>
                <SettingRow
                    description="Windows only: WriteConsole colored output or OutputDebugString."
                    htmlFor="log-type"
                    label="Log type"
                >
                    <SelectControl
                        id="log-type"
                        onChange={(v) => set("Log", "type", v)}
                        options={LOG_TYPE_OPTIONS}
                        value={l.type}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}

export function DebugCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const d = config.Debug;
    return (
        <div className="space-y-8">
            <SettingSection title="Debug dumps">
                <SettingRow
                    description="Dump linker/module debugging information under log/debugdump."
                    htmlFor="dbg-dump"
                    label="Debug dump"
                >
                    <SwitchControl
                        checked={d.debug_dump}
                        id="dbg-dump"
                        onCheckedChange={(v) => set("Debug", "debug_dump", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Collect shaders for debugging or shader tooling."
                    htmlFor="shader-col"
                    label="Shader collect"
                >
                    <SwitchControl
                        checked={d.shader_collect}
                        id="shader-col"
                        onCheckedChange={(v) =>
                            set("Debug", "shader_collect", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Written by the emulator to identify the settings version. Not a user control."
                    label="Config version"
                >
                    <span className="max-w-[18rem] truncate font-mono text-muted-foreground text-xs">
                        {d.config_version || "(not set)"}
                    </span>
                </SettingRow>
            </SettingSection>
        </div>
    );
}

export function AdvancedCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const w = config.WindowsGuestRedZoneProtection;
    return (
        <div className="space-y-8">
            <SettingSection
                description="Windows-specific guest red-zone protection."
                title="Windows guest red zone"
            >
                <SettingRow
                    description="Protect the Windows guest red zone with static patching."
                    htmlFor="redzone"
                    label="Protection mode"
                >
                    <SelectControl
                        id="redzone"
                        onChange={(v) =>
                            set(
                                "WindowsGuestRedZoneProtection",
                                "windows_guest_red_zone_protection_mode",
                                v,
                            )
                        }
                        options={RED_ZONE_MODE_OPTIONS}
                        value={w.windows_guest_red_zone_protection_mode}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection
                description="These live outside config.json and are not edited in this panel."
                title="Not covered here"
            >
                <div className="space-y-3 px-4 py-4 text-muted-foreground text-sm leading-relaxed">
                    <p className="flex gap-2">
                        <InfoIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="text-foreground">
                                Input bindings
                            </strong>{" "}
                            — keyboard/controller maps and hotkeys live in{" "}
                            <code className="text-xs">input_config/*.ini</code>.
                        </span>
                    </p>
                    <p className="flex gap-2">
                        <InfoIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="text-foreground">
                                User profiles
                            </strong>{" "}
                            — ShadNet accounts and NP fields are in{" "}
                            <code className="text-xs">users.json</code>.
                        </span>
                    </p>
                    <p className="flex gap-2">
                        <InfoIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="text-foreground">
                                CLI, env, CMake, ImGui overlay
                            </strong>{" "}
                            — launch flags, environment variables, build
                            switches, and developer overlay state are not
                            runtime JSON settings.
                        </span>
                    </p>
                    <p className="flex gap-2">
                        <InfoIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                            <strong className="text-foreground">
                                Launcher-only preferences
                            </strong>{" "}
                            — library paths and version selection use the folder
                            settings and version manager modals.
                        </span>
                    </p>
                </div>
            </SettingSection>
        </div>
    );
}
