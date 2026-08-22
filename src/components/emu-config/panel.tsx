import { useAtomValue, useSetAtom } from "jotai";
import {
    BugIcon,
    FolderTreeIcon,
    Gamepad2Icon,
    HardDriveIcon,
    LayersIcon,
    type LucideIcon,
    MonitorIcon,
    NetworkIcon,
    ScrollTextIcon,
    Settings2Icon,
    Volume2Icon,
} from "lucide-react";
import { Suspense, startTransition, useId, useRef, useState } from "react";
import type { ResolvedEmulatorConfig } from "@/lib/emulator-config";
import { useDebounceAction } from "@/lib/hooks/useDebounceAction";
import { cn } from "@/lib/utils/ui";
import { atomUserConfig } from "@/store/config";
import { LoadingScreen } from "../loading-overlay";
import { ScrollArea } from "../ui/scroll-area";
import { AudioCategory, InputCategory } from "./category-audio-input";
import { GeneralCategory, PathsCategory } from "./category-general";
import { GraphicsCategory, VulkanCategory } from "./category-graphics";
import {
    AdvancedCategory,
    DebugCategory,
    LoggingCategory,
    NetworkCategory,
} from "./category-rest";
import type { CategoryId, ConfigUpdater } from "./types";

const CATEGORIES: {
    id: CategoryId;
    label: string;
    icon: LucideIcon;
}[] = [
    { id: "general", label: "General", icon: Settings2Icon },
    { id: "paths", label: "Paths", icon: FolderTreeIcon },
    { id: "graphics", label: "Graphics", icon: MonitorIcon },
    { id: "vulkan", label: "Vulkan", icon: LayersIcon },
    { id: "audio", label: "Audio", icon: Volume2Icon },
    { id: "input", label: "Input", icon: Gamepad2Icon },
    { id: "network", label: "Network", icon: NetworkIcon },
    { id: "logging", label: "Logging", icon: ScrollTextIcon },
    { id: "debug", label: "Debug", icon: BugIcon },
    { id: "advanced", label: "Advanced", icon: HardDriveIcon },
];

function CategoryContent({
    id,
    config,
    set,
}: {
    id: CategoryId;
    config: ResolvedEmulatorConfig;
    set: ConfigUpdater;
}) {
    switch (id) {
        case "general":
            return <GeneralCategory config={config} set={set} />;
        case "paths":
            return <PathsCategory config={config} set={set} />;
        case "graphics":
            return <GraphicsCategory config={config} set={set} />;
        case "vulkan":
            return <VulkanCategory config={config} set={set} />;
        case "audio":
            return <AudioCategory config={config} set={set} />;
        case "input":
            return <InputCategory config={config} set={set} />;
        case "network":
            return <NetworkCategory config={config} set={set} />;
        case "logging":
            return <LoggingCategory config={config} set={set} />;
        case "debug":
            return <DebugCategory config={config} set={set} />;
        case "advanced":
            return <AdvancedCategory config={config} set={set} />;
        default: {
            const _exhaustive: never = id;
            return _exhaustive;
        }
    }
}

function ConfigPanelBody({
    defaultValues,
}: {
    defaultValues: ResolvedEmulatorConfig;
}) {
    const setUserConfig = useSetAtom(atomUserConfig);
    const [config, setConfig] = useState(defaultValues);
    const [hasChanges, setHasChanges] = useState(false);
    const [category, setCategory] = useState<CategoryId>("general");
    const navId = useId();
    const configRef = useRef(config);
    configRef.current = config;

    const saveChanges = useDebounceAction(250, () => {
        startTransition(async () => {
            await setUserConfig(configRef.current);
            startTransition(() => {
                setHasChanges(false);
            });
        });
    });

    const set: ConfigUpdater = (section, key, value) => {
        setConfig((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
        setHasChanges(true);
        saveChanges();
    };

    const active = CATEGORIES.find((c) => c.id === category);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-border/80 border-b bg-gradient-to-r from-background via-background to-muted/30 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                    <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                        Emulator
                    </p>
                    <h2 className="truncate font-semibold text-xl tracking-tight sm:text-2xl">
                        Configuration
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-700 text-xs dark:text-emerald-300">
                            Saving…
                        </span>
                    ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground text-xs">
                            Saved
                        </span>
                    )}
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <nav
                    aria-label="Settings categories"
                    className="shrink-0 border-border/80 border-b md:w-52 md:border-r md:border-b-0 lg:w-56"
                >
                    <ScrollArea className="h-auto md:h-full">
                        <div
                            className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-3"
                            role="tablist"
                        >
                            {CATEGORIES.map((item) => {
                                const Icon = item.icon;
                                const selected = item.id === category;
                                return (
                                    <button
                                        aria-controls={`${navId}-${item.id}`}
                                        aria-selected={selected}
                                        className={cn(
                                            "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            selected
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                        )}
                                        key={item.id}
                                        onClick={() => setCategory(item.id)}
                                        role="tab"
                                        type="button"
                                    >
                                        <Icon className="size-4 shrink-0 opacity-80" />
                                        <span className="whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </nav>

                <div className="min-h-0 min-w-0 flex-1">
                    <ScrollArea className="h-[min(70vh,640px)] md:h-full">
                        <div
                            className="space-y-2 p-5 sm:p-6"
                            id={`${navId}-${category}`}
                            role="tabpanel"
                        >
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg tracking-tight">
                                    {active?.label}
                                </h3>
                            </div>
                            <CategoryContent
                                config={config}
                                id={category}
                                set={set}
                            />
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}

function ConfigPanelLoader() {
    const config = useAtomValue(atomUserConfig);
    return <ConfigPanelBody defaultValues={config} />;
}

export function EmuConfigPanel({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex h-full min-h-[28rem] w-full flex-col overflow-hidden bg-background",
                className,
            )}
        >
            <Suspense
                fallback={
                    <div className="center flex-1 p-8">
                        <LoadingScreen />
                    </div>
                }
            >
                <ConfigPanelLoader />
            </Suspense>
        </div>
    );
}
