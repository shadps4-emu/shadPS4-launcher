import { useAtomValue, useStore } from "jotai";
import { MenuIcon } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import type toml from "smol-toml";
import type { TomlPrimitive } from "smol-toml";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/ui";
import { atomUserConfig } from "@/store/config";
import { LoadingScreen } from "../loading-overlay";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

type ConfigType = ReturnType<typeof toml.parse>;

function TomlInput({
    value: defaultValue,
    onChange,
}: {
    value: TomlPrimitive;
    onChange: (p: TomlPrimitive) => void;
}) {
    const [value, setValue] = useState(defaultValue);

    const onBlur = () => {
        onChange(value);
    };

    switch (typeof value) {
        case "string":
            return (
                <Input
                    onBlur={onBlur}
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                />
            );
            break;
        case "number":
            return (
                <Input
                    onBlur={onBlur}
                    onChange={(e) => setValue(Number(e.target.value))}
                    type="number"
                    value={String(value)}
                />
            );
            break;
        case "boolean":
            return (
                <Select
                    onValueChange={(e) => {
                        const v = e === "true";
                        setValue(v);
                        onChange(v);
                    }}
                    value={String(value)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            );
            break;
    }
    return (
        <div>
            <span>Unsupported entry type</span>
            <Input disabled value={value.toString()} />
        </div>
    );
}

function ConfigWindow({ defaultValues }: { defaultValues: ConfigType }) {
    const store = useStore();
    const [configData, setConfigData] = useState(defaultValues);
    const [hasChanges, setHasChanges] = useState(false);

    const [activeSection, setActiveSection] = useState("");
    const [activeSubsection, setActiveSubsection] = useState("");
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Register all section refs
    const registerSectionRef = (id: string, ref: HTMLDivElement | null) => {
        if (ref) {
            sectionRefs.current[id] = ref;
        }
    };

    // Scroll to section when clicking on sidebar item
    const scrollToSection = (sectionId: string, subsectionId?: string) => {
        const targetId = subsectionId
            ? `${sectionId}-${subsectionId}`
            : sectionId;
        const element = sectionRefs.current[targetId];

        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setActiveSection(sectionId);
            setActiveSubsection(subsectionId || "");
        }

        setIsMobileOpen(false);
    };

    // Set up intersection observer to track which section is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        const [section, subsection] = id.includes("-")
                            ? id.split("-")
                            : [id, ""];

                        if (section) {
                            setActiveSection(section);
                        }
                        if (subsection) {
                            setActiveSubsection(subsection);
                        }
                    }
                });
            },
            { threshold: 0.3 },
        );

        // Observe all section elements
        Object.values(sectionRefs.current).forEach((ref) => {
            if (ref) {
                observer.observe(ref);
            }
        });

        return () => {
            Object.values(sectionRefs.current).forEach((ref) => {
                if (ref) {
                    observer.unobserve(ref);
                }
            });
        };
    }, []);

    const saveChanges = () => {
        store.set(atomUserConfig, configData);
        setHasChanges(false);
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Mobile menu trigger */}
            <div className="flex h-16 items-center border-b px-4 md:hidden">
                <Sheet onOpenChange={setIsMobileOpen} open={isMobileOpen}>
                    <SheetTrigger asChild>
                        <Button className="mr-4" size="icon" variant="outline">
                            <MenuIcon className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[240px] p-0" side="left">
                        <SidebarContent
                            activeSection={activeSection}
                            activeSubsection={activeSubsection}
                            configData={configData}
                            scrollToSection={scrollToSection}
                        />
                    </SheetContent>
                </Sheet>
                <h1 className="font-semibold text-xl">Configuration</h1>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden border-r md:block md:w-[240px] md:shrink-0">
                <SidebarContent
                    activeSection={activeSection}
                    activeSubsection={activeSubsection}
                    configData={configData}
                    scrollToSection={scrollToSection}
                />
            </div>

            {/* Main content */}
            <div className="flex-1">
                <ScrollArea className="h-screen">
                    <div className="hidden h-16 items-center border-b px-6 md:flex">
                        <h1 className="font-semibold text-xl">Configuration</h1>
                    </div>
                    <div className="p-6">
                        {Object.entries(
                            configData as Record<
                                string,
                                { [key: string]: TomlPrimitive }
                            >,
                        ).map(([section, valueList]) => {
                            if (typeof valueList !== "object") {
                                return (
                                    <span>Unsupported config data type.</span>
                                );
                            }
                            return (
                                <div className="mb-12" key={section}>
                                    <div
                                        className="mb-4 scroll-mt-16"
                                        id={section}
                                        ref={(ref) =>
                                            registerSectionRef(section, ref)
                                        }
                                    >
                                        <h2 className="flex items-center gap-2 font-bold text-2xl">
                                            {section}
                                        </h2>
                                        <Separator className="mt-2" />
                                    </div>

                                    {Object.entries(valueList).map(
                                        ([entryName, value]) => (
                                            <div
                                                className="mb-8 scroll-mt-16"
                                                id={`${section}-${entryName}`}
                                                key={`${section}-${entryName}`}
                                                ref={(ref) =>
                                                    registerSectionRef(
                                                        `${section}-${entryName}`,
                                                        ref,
                                                    )
                                                }
                                            >
                                                <div className="rounded-lg border p-4">
                                                    <h3 className="mb-4 font-semibold text-xl">
                                                        {entryName}
                                                    </h3>
                                                    <TomlInput
                                                        onChange={(e) => {
                                                            valueList[
                                                                entryName
                                                            ] = e;
                                                            setHasChanges(true);
                                                            setConfigData({
                                                                ...configData,
                                                            });
                                                        }}
                                                        value={value}
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {hasChanges && (
                <div className="absolute right-12 bottom-4 overflow-hidden">
                    <Button
                        className="bg-green-800 p-6 text-white"
                        onClick={saveChanges}
                        type="submit"
                    >
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
}

function SidebarContent({
    activeSection,
    activeSubsection,
    scrollToSection,
    configData,
}: {
    activeSection: string;
    activeSubsection: string;
    scrollToSection: (section: string, subsection?: string) => void;
    configData: ConfigType;
}) {
    return (
        <ScrollArea className="h-screen py-4">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 font-semibold text-lg">
                    Configuration
                </h2>
                <div className="space-y-1">
                    {Object.entries(configData).map(([section, valueList]) => {
                        if (typeof valueList !== "object") {
                            return null;
                        }
                        return (
                            <div className="mb-4" key={section}>
                                <Button
                                    className={cn(
                                        "w-full justify-start",
                                        activeSection === section &&
                                            !activeSubsection &&
                                            "bg-accent",
                                    )}
                                    onClick={() => scrollToSection(section)}
                                    variant="ghost"
                                >
                                    {section}
                                </Button>

                                {Object.keys(valueList).map((entryName) => (
                                    <Button
                                        className={cn(
                                            "ml-6 w-[calc(100%-24px)] justify-start",
                                            activeSection === section &&
                                                activeSubsection ===
                                                    entryName &&
                                                "bg-accent",
                                        )}
                                        key={`${section}-${entryName}`}
                                        onClick={() =>
                                            scrollToSection(section, entryName)
                                        }
                                        size="sm"
                                        variant="ghost"
                                    >
                                        {entryName}
                                    </Button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </ScrollArea>
    );
}

function ReadFileState() {
    const configData = useAtomValue(atomUserConfig);

    if (!configData) {
        return (
            <div className="center h-screen flex-col gap-2">
                <div>No config file found</div>
                <div className="text-xs">Open some game to create it.</div>
            </div>
        );
    }

    return <ConfigWindow defaultValues={configData} />;
}

export function EmuConfigWindow() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ReadFileState />
        </Suspense>
    );
}
