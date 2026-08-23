import { useAtomValue, useSetAtom } from "jotai";
import {
    Gamepad2Icon,
    KeyboardIcon,
    MousePointer2Icon,
    RotateCcwIcon,
} from "lucide-react";
import {
    Fragment,
    Suspense,
    startTransition,
    useCallback,
    useMemo,
    useState,
} from "react";
import { toast } from "sonner";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/animate-ui/radix/tabs";
import { useDebounceAction } from "@/lib/hooks/useDebounceAction";
import {
    BINDABLE_OUTPUTS,
    type BindableOutput,
    type BindingInputs,
    classifyBindingInputs,
    DEFAULT_GLOBAL_INI,
    DEFAULT_HOTKEYS,
    DEFAULT_INPUT_INI,
    HOTKEY_LABELS,
    type InputBindingEntry,
    type InputBindingTab,
    mergeDefaultHotkeys,
    OUTPUT_GROUPS,
    OUTPUT_LABELS,
    parseInputIni,
} from "@/lib/input-config";
import { cn } from "@/lib/utils/ui";
import {
    atomInputConfigFiles,
    type InputConfigFiles,
} from "@/store/input-config";
import { LoadingScreen } from "../loading-overlay";
import { Button } from "../ui/button";
import { Navigable } from "../ui/navigable";
import { ScrollArea } from "../ui/scroll-area";
import { BindingSlot } from "./binding-slot";
import {
    CONTROLLER_DIAGRAM_OUTPUTS,
    ControllerDiagram,
} from "./controller-diagram";
import {
    type BindingCaptureTarget,
    useBindingCapture,
} from "./use-binding-capture";

const TAB_META: {
    id: InputBindingTab;
    label: string;
    icon: typeof Gamepad2Icon;
}[] = [
    { icon: Gamepad2Icon, id: "controller", label: "Controller" },
    { icon: KeyboardIcon, id: "keyboard", label: "Keyboard" },
    { icon: MousePointer2Icon, id: "mouse", label: "Mouse" },
];

/** Slot height in the dense grids; matches the controller map chips. */
const GRID_SLOT = "h-12";

function entriesForTab(
    files: InputConfigFiles,
    tab: InputBindingTab,
    output: string,
): InputBindingEntry[] {
    return (files.defaultIni.bindings[output] ?? []).filter(
        (entry) => classifyBindingInputs(entry.inputs) === tab,
    );
}

function findInputConflict(
    files: InputConfigFiles,
    token: string,
    skipOutput: string,
): string | undefined {
    for (const [output, entries] of Object.entries(files.defaultIni.bindings)) {
        for (const entry of entries) {
            if (output === skipOutput) {
                continue;
            }
            if (entry.inputs.includes(token)) {
                return OUTPUT_LABELS[output] ?? output;
            }
        }
    }
    for (const [key, value] of Object.entries(files.globalIni.specials)) {
        if (!key.startsWith("hotkey_") || key === skipOutput) {
            continue;
        }
        if (value.split(",").some((part) => part.trim() === token)) {
            return HOTKEY_LABELS[key] ?? key;
        }
    }
    return undefined;
}

function upsertBinding(
    files: InputConfigFiles,
    output: string,
    tab: InputBindingTab,
    index: number,
    token: string,
): InputConfigFiles {
    const next = structuredClone(files);
    const allEntries = next.defaultIni.bindings[output] ?? [];
    const tabEntries = allEntries.filter(
        (entry) => classifyBindingInputs(entry.inputs) === tab,
    );
    const otherEntries = allEntries.filter(
        (entry) => classifyBindingInputs(entry.inputs) !== tab,
    );

    while (tabEntries.length <= index) {
        tabEntries.push({ inputs: ["", undefined, undefined] });
    }

    tabEntries[index] = { inputs: [token, undefined, undefined] };
    next.defaultIni.bindings[output] = [...otherEntries, ...tabEntries];
    return next;
}

function clearBinding(
    files: InputConfigFiles,
    output: string,
    tab: InputBindingTab,
    index: number,
): InputConfigFiles {
    const next = structuredClone(files);
    const allEntries = next.defaultIni.bindings[output] ?? [];
    const tabEntries = allEntries.filter(
        (entry) => classifyBindingInputs(entry.inputs) === tab,
    );
    const otherEntries = allEntries.filter(
        (entry) => classifyBindingInputs(entry.inputs) !== tab,
    );

    if (tabEntries[index]) {
        tabEntries.splice(index, 1);
    }

    next.defaultIni.bindings[output] = [...otherEntries, ...tabEntries];
    return next;
}

function hotkeyInputs(value: string | undefined): BindingInputs {
    const parts = (value ?? "").split(",").map((part) => part.trim());
    return [parts[0] ?? "", parts[1], parts[2]];
}

function SectionHeading({ title }: { title: string }) {
    return (
        <div className="col-span-full flex items-center gap-2.5">
            <h3 className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                {title}
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-violet-400/30 via-amber-400/20 to-transparent" />
        </div>
    );
}

function InputBindingsPanelBody({ initial }: { initial: InputConfigFiles }) {
    const setFiles = useSetAtom(atomInputConfigFiles);
    const [files, setLocalFiles] = useState(initial);
    const [tab, setTab] = useState<InputBindingTab>("controller");
    const [listening, setListening] = useState<BindingCaptureTarget | null>(
        null,
    );
    const [hasChanges, setHasChanges] = useState(false);
    const filesRef = useMemo(() => ({ current: files }), [files]);
    filesRef.current = files;

    const saveChanges = useDebounceAction(250, () => {
        startTransition(async () => {
            await setFiles(filesRef.current);
            startTransition(() => setHasChanges(false));
        });
    });

    const persist = useCallback(
        (next: InputConfigFiles) => {
            setLocalFiles(next);
            setHasChanges(true);
            saveChanges();
        },
        [saveChanges],
    );

    const handleCapture = useCallback(
        (target: BindingCaptureTarget, token: string) => {
            const conflict = findInputConflict(files, token, target.output);
            if (conflict) {
                toast.warning(`${token} is already bound to ${conflict}`, {
                    description:
                        "Binding applied anyway — adjust the other slot if needed.",
                });
            }

            if (HOTKEY_LABELS[target.output]) {
                const nextGlobal = structuredClone(files.globalIni);
                nextGlobal.specials[target.output] = token;
                persist({
                    ...files,
                    globalIni: nextGlobal,
                });
            } else {
                persist(
                    upsertBinding(
                        files,
                        target.output,
                        target.tab,
                        target.index,
                        token,
                    ),
                );
            }

            setListening(null);
        },
        [files, persist],
    );

    useBindingCapture({
        active: listening,
        onCapture: handleCapture,
        onCancel: () => setListening(null),
    });

    const resetDefaults = () => {
        persist({
            defaultIni: parseInputIni(DEFAULT_INPUT_INI),
            globalIni: mergeDefaultHotkeys(parseInputIni(DEFAULT_GLOBAL_INI)),
        });
        toast.success("Restored default input bindings");
    };

    const clearSlot = (target: BindingCaptureTarget) =>
        persist(clearBinding(files, target.output, target.tab, target.index));

    const renderMapSlot = (output: BindableOutput) => {
        const entry = entriesForTab(files, "controller", output)[0] ?? {
            inputs: ["", undefined, undefined] as BindingInputs,
        };

        return (
            <BindingSlot
                index={0}
                inputs={entry.inputs}
                label={OUTPUT_LABELS[output] ?? output}
                listening={listening}
                onClear={clearSlot}
                onStart={setListening}
                output={output}
                tab="controller"
            />
        );
    };

    const renderOutputSlots = (output: string) => {
        const entries = entriesForTab(files, tab, output);
        const slots =
            entries.length > 0
                ? entries
                : [{ inputs: ["", undefined, undefined] as BindingInputs }];

        return slots.map((entry, index) => (
            <BindingSlot
                className={GRID_SLOT}
                index={index}
                inputs={entry.inputs}
                key={`${output}-${index}-${entry.inputs.filter(Boolean).join("+") || "empty"}`}
                label={OUTPUT_LABELS[output] ?? output}
                listening={listening}
                onClear={clearSlot}
                onStart={setListening}
                output={output}
                tab={tab}
            />
        ));
    };

    /** Controller bindings on outputs the map does not draw (rare setups). */
    const mapOverflow = BINDABLE_OUTPUTS.filter(
        (output) =>
            !CONTROLLER_DIAGRAM_OUTPUTS.has(output) &&
            entriesForTab(files, "controller", output).length > 0,
    );

    const mouseBound = BINDABLE_OUTPUTS.filter(
        (output) => entriesForTab(files, "mouse", output).length > 0,
    );
    const mouseToJoystick =
        files.defaultIni.specials.mouse_to_joystick ?? "disabled";

    return (
        <Tabs
            className="flex min-h-0 flex-1 flex-col gap-0"
            onValueChange={(value) => {
                setTab(value as InputBindingTab);
                setListening(null);
            }}
            value={tab}
        >
            <header className="relative flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden border-white/10 border-b px-4 py-2 pr-14">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(circle_at_85%_0%,rgba(245,158,11,0.1),transparent_50%)]" />

                <div className="relative flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                        <Gamepad2Icon className="size-4 text-violet-200" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="bg-gradient-to-r from-violet-100 via-fuchsia-100 to-amber-100 bg-clip-text font-semibold text-sm text-transparent leading-tight tracking-tight">
                            Control Bindings
                        </h2>
                        <p className="truncate text-[10px] text-muted-foreground leading-tight">
                            Click a slot, then press an input · Esc cancels
                        </p>
                    </div>
                </div>

                <TabsList className="relative h-9 w-auto gap-1 rounded-xl border border-white/10 bg-black/25 p-1 backdrop-blur-md">
                    {TAB_META.map(({ id, label, icon: Icon }) => (
                        <TabsTrigger
                            className="rounded-lg px-3 text-xs data-[state=active]:text-foreground"
                            key={id}
                            value={id}
                        >
                            <Icon className="mr-1.5 size-3.5 opacity-80" />
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="relative ml-auto flex items-center gap-2">
                    <span
                        className={cn(
                            "rounded-full px-2.5 py-1 font-medium text-[11px]",
                            hasChanges
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/5 text-muted-foreground",
                        )}
                    >
                        {hasChanges ? "Saving…" : "Saved"}
                    </span>
                    <Navigable>
                        <Button
                            className="h-8 border-white/10 bg-white/5 text-xs hover:bg-violet-500/10"
                            onClick={resetDefaults}
                            size="sm"
                            variant="outline"
                        >
                            <RotateCcwIcon className="size-3.5" />
                            Reset
                        </Button>
                    </Navigable>
                </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col">
                <TabsContent
                    className="flex min-h-0 flex-1 flex-col gap-2 p-3"
                    value="controller"
                >
                    <ControllerDiagram
                        activeOutput={
                            listening?.tab === "controller"
                                ? listening.output
                                : null
                        }
                        className="min-h-0 flex-1"
                        renderSlot={renderMapSlot}
                    />
                    {mapOverflow.length > 0 && (
                        <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <SectionHeading title="Other controller bindings" />
                                {mapOverflow.map((output) =>
                                    renderOutputSlots(output),
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent
                    className="flex min-h-0 flex-1 flex-col"
                    value="keyboard"
                >
                    <ScrollArea className="min-h-0 flex-1">
                        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-3 xl:grid-cols-4">
                            {OUTPUT_GROUPS.map((group) => (
                                <Fragment key={group.title}>
                                    <SectionHeading title={group.title} />
                                    {group.outputs.map((output) =>
                                        renderOutputSlots(output),
                                    )}
                                </Fragment>
                            ))}
                            <SectionHeading title="Global hotkeys" />
                            {Object.keys(HOTKEY_LABELS).map((key) => (
                                <BindingSlot
                                    className={GRID_SLOT}
                                    index={0}
                                    inputs={hotkeyInputs(
                                        files.globalIni.specials[key] ??
                                            DEFAULT_HOTKEYS[key],
                                    )}
                                    key={key}
                                    label={HOTKEY_LABELS[key] ?? key}
                                    listening={listening}
                                    onClear={() => {
                                        const next = structuredClone(
                                            files.globalIni,
                                        );
                                        delete next.specials[key];
                                        persist({ ...files, globalIni: next });
                                    }}
                                    onStart={(target) =>
                                        setListening({
                                            ...target,
                                            output: key,
                                            tab: "keyboard",
                                        })
                                    }
                                    output={key}
                                    tab="keyboard"
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent
                    className="flex min-h-0 flex-1 flex-col gap-3 p-3"
                    value="mouse"
                >
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <p className="font-medium text-sm">
                                Mouse → joystick
                            </p>
                            {(["left", "right", "disabled"] as const).map(
                                (mode) => (
                                    <Navigable key={mode}>
                                        <Button
                                            className={cn(
                                                "h-8 capitalize",
                                                mouseToJoystick === mode &&
                                                    "border-cyan-400/40 bg-cyan-500/15",
                                            )}
                                            onClick={() => {
                                                const next =
                                                    structuredClone(files);
                                                if (mode === "disabled") {
                                                    delete next.defaultIni
                                                        .specials
                                                        .mouse_to_joystick;
                                                } else {
                                                    next.defaultIni.specials.mouse_to_joystick =
                                                        mode;
                                                }
                                                persist(next);
                                            }}
                                            size="sm"
                                            variant="outline"
                                        >
                                            {mode}
                                        </Button>
                                    </Navigable>
                                ),
                            )}
                        </div>
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                            <SectionHeading
                                title={
                                    mouseBound.length > 0
                                        ? "Mouse bindings"
                                        : "Start with these"
                                }
                            />
                            {(mouseBound.length > 0
                                ? mouseBound
                                : (["cross", "circle", "options"] as const)
                            ).map((output) => renderOutputSlots(output))}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </div>
        </Tabs>
    );
}

function InputBindingsPanelLoader() {
    const files = useAtomValue(atomInputConfigFiles);
    return <InputBindingsPanelBody initial={files} />;
}

export function InputBindingsPanel({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
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
                <InputBindingsPanelLoader />
            </Suspense>
        </div>
    );
}
