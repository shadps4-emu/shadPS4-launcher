import { Button } from "@/components/ui/button";
import {
    CONSOLE_LANGUAGES,
    type GameInstallDir,
    type ResolvedEmulatorConfig,
    TROPHY_SIDE_OPTIONS,
} from "@/lib/emulator-config";
import {
    IntSelectControl,
    NumberStepper,
    PathControl,
    SelectControl,
    SettingRow,
    SettingSection,
    SliderControl,
    SwitchControl,
} from "./fields";
import type { ConfigUpdater } from "./types";

export function GeneralCategory({
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
                description="Console behavior, volume, and trophy notifications."
                title="Basics"
            >
                <SettingRow
                    description="Master emulator volume. Range 0–500."
                    htmlFor="volume"
                    label="Volume"
                >
                    <SliderControl
                        id="volume"
                        max={500}
                        min={0}
                        onChange={(v) => set("General", "volume_slider", v)}
                        value={g.volume_slider}
                    />
                </SettingRow>
                <SettingRow
                    description="System language used by UI and trophy text."
                    htmlFor="console-lang"
                    label="Console language"
                >
                    <IntSelectControl
                        className="w-[min(100%,18rem)]"
                        id="console-lang"
                        onChange={(v) => set("General", "console_language", v)}
                        options={CONSOLE_LANGUAGES.map((l) => ({
                            value: l.id,
                            label: l.label,
                        }))}
                        value={g.console_language}
                    />
                </SettingRow>
                <SettingRow
                    description="Enable PS4 Pro / Neo memory and behavior."
                    experimental
                    htmlFor="neo"
                    label="Neo mode"
                >
                    <SwitchControl
                        checked={g.neo_mode}
                        id="neo"
                        onCheckedChange={(v) => set("General", "neo_mode", v)}
                    />
                </SettingRow>
                <SettingRow
                    description="Use devkit console memory behavior."
                    experimental
                    htmlFor="devkit"
                    label="Dev kit mode"
                >
                    <SwitchControl
                        checked={g.dev_kit_mode}
                        id="devkit"
                        onCheckedChange={(v) =>
                            set("General", "dev_kit_mode", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Additional direct memory allocation in MB (0–100000)."
                    htmlFor="extra-dmem"
                    label="Extra DMEM"
                >
                    <NumberStepper
                        id="extra-dmem"
                        max={100000}
                        min={0}
                        onChange={(v) =>
                            set("General", "extra_dmem_in_mbytes", v)
                        }
                        suffix="MB"
                        value={g.extra_dmem_in_mbytes}
                    />
                </SettingRow>
                <SettingRow
                    description="Additional flexible memory allocation in MB."
                    htmlFor="extra-fmem"
                    label="Extra FMEM"
                >
                    <NumberStepper
                        id="extra-fmem"
                        min={0}
                        onChange={(v) =>
                            set("General", "extra_fmem_in_mbytes", v)
                        }
                        suffix="MB"
                        value={g.extra_fmem_in_mbytes}
                    />
                </SettingRow>
                <SettingRow
                    description="Show the game launch splash screen."
                    htmlFor="splash"
                    label="Show splash"
                >
                    <SwitchControl
                        checked={g.show_splash}
                        id="splash"
                        onCheckedChange={(v) =>
                            set("General", "show_splash", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Show the simple FPS counter (also toggled by hotkey / --show-fps)."
                    htmlFor="fps"
                    label="FPS counter"
                >
                    <SwitchControl
                        checked={g.show_fps_counter}
                        id="fps"
                        onCheckedChange={(v) =>
                            set("General", "show_fps_counter", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Enable Discord Rich Presence when the build includes it."
                    htmlFor="discord"
                    label="Discord RPC"
                >
                    <SwitchControl
                        checked={g.discord_rpc_enabled}
                        id="discord"
                        onCheckedChange={(v) =>
                            set("General", "discord_rpc_enabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="Big Picture UI scale (internal units; default 1000)."
                    htmlFor="bp-scale"
                    label="Big Picture scale"
                >
                    <NumberStepper
                        id="bp-scale"
                        min={1}
                        onChange={(v) => set("General", "big_picture_scale", v)}
                        value={g.big_picture_scale}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection
                description="Trophy popup placement and timing."
                title="Trophies"
            >
                <SettingRow
                    description="Disable trophy notifications."
                    htmlFor="trophy-off"
                    label="Disable trophy popups"
                >
                    <SwitchControl
                        checked={g.trophy_popup_disabled}
                        id="trophy-off"
                        onCheckedChange={(v) =>
                            set("General", "trophy_popup_disabled", v)
                        }
                    />
                </SettingRow>
                <SettingRow
                    description="How long trophy notifications stay on screen."
                    htmlFor="trophy-dur"
                    label="Notification duration"
                >
                    <NumberStepper
                        id="trophy-dur"
                        min={0}
                        onChange={(v) =>
                            set("General", "trophy_notification_duration", v)
                        }
                        step={0.5}
                        suffix="s"
                        value={g.trophy_notification_duration}
                    />
                </SettingRow>
                <SettingRow
                    description="On-screen position for trophy notifications."
                    htmlFor="trophy-side"
                    label="Notification side"
                >
                    <SelectControl
                        id="trophy-side"
                        onChange={(v) =>
                            set("General", "trophy_notification_side", v)
                        }
                        options={TROPHY_SIDE_OPTIONS}
                        value={g.trophy_notification_side}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    );
}

export function PathsCategory({
    config,
    set,
}: {
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    const g = config.General;
    const dirs = g.install_dirs ?? [];

    const updateDirs = (next: GameInstallDir[]) => {
        set("General", "install_dirs", next);
    };

    return (
        <div className="space-y-8">
            <SettingSection
                description="Empty paths fall back to defaults under the emulator user directory."
                title="Data directories"
            >
                <SettingRow
                    description="Add-on / content installation directory."
                    htmlFor="addon-dir"
                    label="Addon install dir"
                >
                    <PathControl
                        id="addon-dir"
                        onChange={(v) => set("General", "addon_install_dir", v)}
                        value={g.addon_install_dir}
                    />
                </SettingRow>
                <SettingRow
                    description="PS4 home directory containing per-user data."
                    htmlFor="home-dir"
                    label="Home dir"
                >
                    <PathControl
                        id="home-dir"
                        onChange={(v) => set("General", "home_dir", v)}
                        value={g.home_dir}
                    />
                </SettingRow>
                <SettingRow
                    description="Firmware / system module directory."
                    htmlFor="sys-dir"
                    label="Sys modules dir"
                >
                    <PathControl
                        id="sys-dir"
                        onChange={(v) => set("General", "sys_modules_dir", v)}
                        value={g.sys_modules_dir}
                    />
                </SettingRow>
                <SettingRow
                    description="Dumped or supplied system font directory."
                    htmlFor="font-dir"
                    label="Font dir"
                >
                    <PathControl
                        id="font-dir"
                        onChange={(v) => set("General", "font_dir", v)}
                        value={g.font_dir}
                    />
                </SettingRow>
            </SettingSection>

            <SettingSection
                description="Game library folders searched when a game ID is supplied."
                title="Install directories"
            >
                {dirs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No install directories yet.
                    </div>
                ) : (
                    dirs.map((dir, index) => (
                        <div
                            className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
                            key={`${dir.path}-${index}`}
                        >
                            <div className="min-w-0 flex-1">
                                <PathControl
                                    onChange={(path) => {
                                        const next = [...dirs];
                                        next[index] = { ...dir, path };
                                        updateDirs(next);
                                    }}
                                    value={dir.path}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <SwitchControl
                                        checked={dir.enabled}
                                        onCheckedChange={(enabled) => {
                                            const next = [...dirs];
                                            next[index] = { ...dir, enabled };
                                            updateDirs(next);
                                        }}
                                    />
                                    <span>Enabled</span>
                                </div>
                                <Button
                                    onClick={() =>
                                        updateDirs(
                                            dirs.filter((_, i) => i !== index),
                                        )
                                    }
                                    size="sm"
                                    type="button"
                                    variant="ghost"
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))
                )}
                <div className="px-4 py-3">
                    <Button
                        onClick={() =>
                            updateDirs([...dirs, { path: "", enabled: true }])
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                    >
                        Add directory
                    </Button>
                </div>
            </SettingSection>
        </div>
    );
}
