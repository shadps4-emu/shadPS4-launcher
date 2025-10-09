import { useAtomValue, useSetAtom } from "jotai";
import { Suspense, startTransition, useState } from "react";

import type toml from "smol-toml";
import { TomlDate, type TomlPrimitive } from "smol-toml";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDebounceAction } from "@/lib/hooks/useDebounceAction";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { atomUserConfig } from "@/store/config";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../animate-ui/radix/tabs";
import { LoadingScreen } from "../loading-overlay";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

type ConfigType = ReturnType<typeof toml.parse>;
type SectionKey = keyof ConfigType;

function FieldRow({
    label,
    children,
    description,
}: {
    label: string;
    children: React.ReactNode;
    description?: string;
}) {
    return (
        <div className="grid w-full grid-cols-4 items-center gap-4 py-2">
            <Label className="col-span-1 text-muted-foreground text-sm">
                {label}
            </Label>
            <div className="col-span-3 flex items-center gap-2">{children}</div>
            {description && (
                <div className="col-span-3 col-start-2 text-muted-foreground text-xs">
                    {description}
                </div>
            )}
        </div>
    );
}

function PrimitiveInput({
    value,
    onChange,
    type,
}: {
    value: TomlPrimitive | null;
    onChange: (v: TomlPrimitive) => void;
    type: "string" | "number" | "boolean";
}) {
    if (type === "boolean") {
        return (
            <Checkbox
                checked={Boolean(value)}
                onCheckedChange={(e) => onChange(e === true)}
            />
        );
    }
    if (type === "number") {
        return (
            <Input
                onChange={(e) => onChange(Number(e.target.value))}
                type="number"
                value={value == null ? "" : String(value)}
            />
        );
    }
    return (
        <Input
            onChange={(e) => onChange(e.target.value)}
            type="text"
            value={value == null ? "" : String(value)}
        />
    );
}

function ConfigView({ defaultValues }: { defaultValues: ConfigType }) {
    const setUserConfig = useSetAtom(atomUserConfig);
    const [configData, setConfigData] = useState(defaultValues);
    const [hasChanges, setHasChanges] = useState(false);

    const saveChanges = useDebounceAction(200, () => {
        startTransition(async () => {
            await setUserConfig(configData);
            startTransition(() => {
                setHasChanges(false);
            });
        });
    });

    const setVal = (section: SectionKey, key: string, value: TomlPrimitive) => {
        setConfigData((prev) => {
            const prevSec = prev[section];
            let next: TomlPrimitive;
            if (Array.isArray(prevSec)) {
                throw new Error("toml array is not supported");
            } else if (
                typeof prevSec === "object" &&
                !(prevSec instanceof TomlDate)
            ) {
                const sectionObj = { ...prevSec };
                sectionObj[key] = value;
                next = { ...prev, [section]: sectionObj };
            } else {
                next = value;
            }
            return {
                ...prev,
                [section]: next,
            };
        });
        setHasChanges(true);
        saveChanges();
    };

    const get = (section: SectionKey, key: string) => {
        const sec = configData[section];
        if (!sec) {
            return null;
        }
        if (
            typeof sec !== "object" ||
            Array.isArray(sec) ||
            sec instanceof TomlDate
        ) {
            throw new Error("only toml object is supported");
        }
        return sec[key] ?? null;
    };

    return (
        <>
            <DialogHeader className="border-b px-6 py-4">
                <DialogTitle className="flex justify-between pr-8">
                    <span className="text-2xl">Emulator Configuration</span>
                    {hasChanges && (
                        <span className="bg-green-700 text-white">
                            Unsaved changes...
                        </span>
                    )}
                </DialogTitle>
            </DialogHeader>
            <div className="flex h-[75vh] flex-col">
                <Tabs className="flex h-full flex-col" defaultValue="general">
                    <div className="px-6 pt-4">
                        <TabsList
                            activeClassName="rounded-none border-primary border-b-2 bg-primary/5"
                            className="w-full justify-start rounded-none p-0 *:basis-0"
                        >
                            <TabsTrigger className="p-3" value="general">
                                General
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="graphics">
                                Graphics
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="audio">
                                Audio
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="input">
                                Input
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="ui">
                                UI
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="network">
                                Network
                            </TabsTrigger>
                            <TabsTrigger className="p-3" value="advanced">
                                Advanced
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-6 pt-4">
                            <TabsContent value="general">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Basics
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Auto Update">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "autoUpdate",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("General", "autoUpdate")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Update Channel">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "updateChannel",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "General",
                                                "updateChannel",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Always Show Changelog">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "alwaysShowChangelog",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "alwaysShowChangelog",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Show Splash">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "showSplash",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("General", "showSplash")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Home Tab">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "chooseHomeTab",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "General",
                                                "chooseHomeTab",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="User Name">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "userName", v)
                                            }
                                            type="string"
                                            value={get("General", "userName")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="PS4 Pro Mode">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "isPS4Pro", v)
                                            }
                                            type="boolean"
                                            value={get("General", "isPS4Pro")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Devkit Mode">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "isDevKit", v)
                                            }
                                            type="boolean"
                                            value={get("General", "isDevKit")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Compatibility Checks">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "checkCompatibilityOnStartup",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "checkCompatibilityOnStartup",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Compatibility Database">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "compatibilityEnabled",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "compatibilityEnabled",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Discord Rich Presence">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "enableDiscordRPC",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "enableDiscordRPC",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Separate Updates">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "separateUpdateEnabled",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "separateUpdateEnabled",
                                            )}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Display (Global)
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Allow HDR (Global)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "allowHDR", v)
                                            }
                                            type="boolean"
                                            value={get("General", "allowHDR")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Fullscreen (Global)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "Fullscreen",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("General", "Fullscreen")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Fullscreen Mode (Global)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "FullscreenMode",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "General",
                                                "FullscreenMode",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Console Language">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Settings",
                                                    "consoleLanguage",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "Settings",
                                                "consoleLanguage",
                                            )}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="graphics">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        GPU
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Allow HDR (GPU)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "allowHDR", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "allowHDR")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Fullscreen (GPU)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "Fullscreen", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "Fullscreen")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Fullscreen Mode (GPU)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "FullscreenMode",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get("GPU", "FullscreenMode")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Screen Width">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "screenWidth", v)
                                            }
                                            type="number"
                                            value={get("GPU", "screenWidth")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Screen Height">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "screenHeight", v)
                                            }
                                            type="number"
                                            value={get("GPU", "screenHeight")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Internal Width">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "internalScreenWidth",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "GPU",
                                                "internalScreenWidth",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Internal Height">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "internalScreenHeight",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "GPU",
                                                "internalScreenHeight",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="FSR Enabled">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "fsrEnabled", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "fsrEnabled")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="RCAS Enabled">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "rcasEnabled", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "rcasEnabled")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="RCAS Attenuation">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "rcasAttenuation",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "GPU",
                                                "rcasAttenuation",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Present Mode">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "presentMode", v)
                                            }
                                            type="string"
                                            value={get("GPU", "presentMode")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Patch Shaders">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "patchShaders", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "patchShaders")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Dump Shaders">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "dumpShaders", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "dumpShaders")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Copy GPU Buffers">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "copyGPUBuffers",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("GPU", "copyGPUBuffers")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Direct Memory Access">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "directMemoryAccess",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "GPU",
                                                "directMemoryAccess",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Readbacks">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "readbacks", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "readbacks")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Readback Linear Images">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "readbackLinearImages",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "GPU",
                                                "readbackLinearImages",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Null GPU (Headless)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "nullGpu", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "nullGpu")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="VBlank Divider">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "vblankDivider",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get("GPU", "vblankDivider")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="VBlank Frequency">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GPU",
                                                    "vblankFrequency",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "GPU",
                                                "vblankFrequency",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Dump PM4">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GPU", "dumpPM4", v)
                                            }
                                            type="boolean"
                                            value={get("GPU", "dumpPM4")}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Vulkan
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="GPU Id">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Vulkan", "gpuId", v)
                                            }
                                            type="number"
                                            value={get("Vulkan", "gpuId")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Crash Diagnostic">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "crashDiagnostic",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Vulkan",
                                                "crashDiagnostic",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Host Markers">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "hostMarkers",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("Vulkan", "hostMarkers")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Guest Markers">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "guestMarkers",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Vulkan",
                                                "guestMarkers",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="RenderDoc Enable">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "rdocEnable",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("Vulkan", "rdocEnable")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="RenderDoc Markers">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "rdocMarkersEnable",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Vulkan",
                                                "rdocMarkersEnable",
                                            )}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="audio">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Audio
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Play BGM">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "playBGM", v)
                                            }
                                            type="boolean"
                                            value={get("General", "playBGM")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="BGM Volume">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "BGMvolume",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get("General", "BGMvolume")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Master Volume">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "volumeSlider",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "General",
                                                "volumeSlider",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Trophy Notifications">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "isTrophyPopupDisabled",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "isTrophyPopupDisabled",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Trophy Notification Duration (s)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "trophyNotificationDuration",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "General",
                                                "trophyNotificationDuration",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Trophy Popup Side">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "sideTrophy",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get("General", "sideTrophy")}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="input">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Controllers
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Unified Input Config">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "useUnifiedInputConfig",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Input",
                                                "useUnifiedInputConfig",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Background Controller Input">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "backgroundControllerInput",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Input",
                                                "backgroundControllerInput",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Back Button Behavior">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "backButtonBehavior",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "Input",
                                                "backButtonBehavior",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Motion Controls">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "isMotionControlsEnabled",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Input",
                                                "isMotionControlsEnabled",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Microphone Device">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Input", "micDevice", v)
                                            }
                                            type="string"
                                            value={get("Input", "micDevice")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Cursor State">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "cursorState",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get("Input", "cursorState")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Cursor Hide Timeout (s)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "cursorHideTimeout",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "Input",
                                                "cursorHideTimeout",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Use Special Pad">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "useSpecialPad",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Input",
                                                "useSpecialPad",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Special Pad Class">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Input",
                                                    "specialPadClass",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "Input",
                                                "specialPadClass",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Default Controller ID">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "defaultControllerID",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "General",
                                                "defaultControllerID",
                                            )}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Keys
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Trophy Key">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Keys", "TrophyKey", v)
                                            }
                                            type="string"
                                            value={get("Keys", "TrophyKey")}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="ui">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Appearance
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Theme">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "theme", v)
                                            }
                                            type="number"
                                            value={get("GUI", "theme")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Show Background Image">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "showBackgroundImage",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "GUI",
                                                "showBackgroundImage",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Background Image Opacity">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "backgroundImageOpacity",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get(
                                                "GUI",
                                                "backgroundImageOpacity",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Icon Size (List)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "iconSize", v)
                                            }
                                            type="number"
                                            value={get("GUI", "iconSize")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Icon Size (Grid)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "iconSizeGrid", v)
                                            }
                                            type="number"
                                            value={get("GUI", "iconSizeGrid")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Slider Position (List)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "sliderPos", v)
                                            }
                                            type="number"
                                            value={get("GUI", "sliderPos")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Slider Position (Grid)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "sliderPosGrid",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get("GUI", "sliderPosGrid")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Language">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "emulatorLanguage",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "GUI",
                                                "emulatorLanguage",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Game Table Mode">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "gameTableMode",
                                                    v,
                                                )
                                            }
                                            type="number"
                                            value={get("GUI", "gameTableMode")}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Window Geometry
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Main Window Width">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "mw_width", v)
                                            }
                                            type="number"
                                            value={get("GUI", "mw_width")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Main Window Height">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "mw_height", v)
                                            }
                                            type="number"
                                            value={get("GUI", "mw_height")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Window X">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "geometry_x", v)
                                            }
                                            type="number"
                                            value={get("GUI", "geometry_x")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Window Y">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "geometry_y", v)
                                            }
                                            type="number"
                                            value={get("GUI", "geometry_y")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Window Width">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "geometry_w", v)
                                            }
                                            type="number"
                                            value={get("GUI", "geometry_w")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Window Height">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "geometry_h", v)
                                            }
                                            type="number"
                                            value={get("GUI", "geometry_h")}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Paths
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Add-on Install Dir">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "GUI",
                                                    "addonInstallDir",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "GUI",
                                                "addonInstallDir",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Save Data Path">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("GUI", "saveDataPath", v)
                                            }
                                            type="string"
                                            value={get("GUI", "saveDataPath")}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="network">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Network & Account
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Connected to Network">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "isConnectedToNetwork",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "isConnectedToNetwork",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="PSN Signed In">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "isPSNSignedIn",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "General",
                                                "isPSNSignedIn",
                                            )}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>

                            <TabsContent value="advanced">
                                <div className="rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Logging
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Log Enabled">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Debug", "logEnabled", v)
                                            }
                                            type="boolean"
                                            value={get("Debug", "logEnabled")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Separate Log Files">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Debug",
                                                    "isSeparateLogFilesEnabled",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Debug",
                                                "isSeparateLogFilesEnabled",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Log Type">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("General", "logType", v)
                                            }
                                            type="string"
                                            value={get("General", "logType")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Log Filter">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "General",
                                                    "logFilter",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get("General", "logFilter")}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Debug
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Collect Shader">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Debug",
                                                    "CollectShader",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Debug",
                                                "CollectShader",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="FPS Color">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Debug", "FPSColor", v)
                                            }
                                            type="boolean"
                                            value={get("Debug", "FPSColor")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Debug Dump">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal("Debug", "DebugDump", v)
                                            }
                                            type="boolean"
                                            value={get("Debug", "DebugDump")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Config Version">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Debug",
                                                    "ConfigVersion",
                                                    v,
                                                )
                                            }
                                            type="string"
                                            value={get(
                                                "Debug",
                                                "ConfigVersion",
                                            )}
                                        />
                                    </FieldRow>
                                </div>

                                <div className="mt-6 rounded-lg border p-4">
                                    <h3 className="mb-2 font-semibold text-lg">
                                        Vulkan Validation
                                    </h3>
                                    <Separator className="mb-4" />
                                    <FieldRow label="Validation">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "validation",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get("Vulkan", "validation")}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Validation (GPU)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "validation_gpu",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Vulkan",
                                                "validation_gpu",
                                            )}
                                        />
                                    </FieldRow>
                                    <FieldRow label="Validation (Sync)">
                                        <PrimitiveInput
                                            onChange={(v) =>
                                                setVal(
                                                    "Vulkan",
                                                    "validation_sync",
                                                    v,
                                                )
                                            }
                                            type="boolean"
                                            value={get(
                                                "Vulkan",
                                                "validation_sync",
                                            )}
                                        />
                                    </FieldRow>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </div>
        </>
    );
}

function ReadFileState() {
    const configData = useAtomValue(atomUserConfig);

    if (!configData) {
        return (
            <div className="center h-[75vh] flex-col gap-2 p-6">
                <div>No config file found</div>
                <div className="text-xs">Open some game to create it.</div>
            </div>
        );
    }

    return <ConfigView defaultValues={configData} />;
}

function LoadingState() {
    return (
        <>
            <DialogTitle>Emulator configuration</DialogTitle>
            <LoadingScreen />
        </>
    );
}

export function EmuConfigModal() {
    const { popModal } = useNavigator();
    return (
        <Dialog onOpenChange={() => popModal()} open>
            <DialogContent
                aria-describedby={undefined}
                className="flex h-full max-w-full flex-col gap-0 p-0 sm:max-w-[95vw] md:max-h-[90vh] lg:max-w-5xl"
            >
                <Suspense fallback={<LoadingState />}>
                    <ReadFileState />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}
