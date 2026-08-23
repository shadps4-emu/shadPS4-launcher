import { useAtomValue, useSetAtom } from "jotai";
import {
    Gamepad2Icon,
    KeyboardIcon,
    MousePointer2Icon,
    RotateCcwIcon,
    SparklesIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
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
    TabsContents,
    TabsList,
    TabsTrigger,
} from "@/components/animate-ui/radix/tabs";
import { useDebounceAction } from "@/lib/hooks/useDebounceAction";
import {
    BINDABLE_OUTPUTS,
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
    type BindingCaptureTarget,
    useBindingCapture,
} from "./use-binding-capture";

const TAB_META: {
    id: InputBindingTab;
    label: string;
    icon: typeof Gamepad2Icon;
    blurb: string;
}[] = [
    {
        id: "controller",
        label: "Controller",
        icon: Gamepad2Icon,
        blurb: "Map gamepad buttons and sticks to PlayStation inputs.",
    },
    {
        id: "keyboard",
        label: "Keyboard",
        icon: KeyboardIcon,
        blurb: "Keyboard and global hotkeys for emulator controls.",
    },
    {
        id: "mouse",
        label: "Mouse",
        icon: MousePointer2Icon,
        blurb: "Mouse buttons, wheels, and pointer modes.",
    },
];

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

    const renderOutputSlots = (output: string) => {
        const entries = entriesForTab(files, tab, output);
        const slots =
            entries.length > 0
                ? entries
                : [{ inputs: ["", undefined, undefined] as BindingInputs }];

        return slots.map((entry, index) => (
            <BindingSlot
                index={index}
                inputs={entry.inputs}
                key={`${output}-${entry.inputs.filter(Boolean).join("+") || "empty"}`}
                label={OUTPUT_LABELS[output] ?? output}
                listening={listening}
                onClear={(target) =>
                    persist(
                        clearBinding(
                            files,
                            target.output,
                            target.tab,
                            target.index,
                        ),
                    )
                }
                onStart={setListening}
                output={output}
                tab={tab}
            />
        ));
    };

    const hotkeyKeys = Object.keys(HOTKEY_LABELS);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="relative overflow-hidden border-white/10 border-b px-5 py-5 sm:px-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.12),transparent_40%)]" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="flex items-center gap-2 font-medium text-[11px] text-violet-200/80 uppercase tracking-[0.18em]">
                            <SparklesIcon className="size-3.5" />
                            Input Forge
                        </p>
                        <h2 className="mt-1 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-amber-100 bg-clip-text font-semibold text-2xl text-transparent tracking-tight sm:text-3xl">
                            Control Bindings
                        </h2>
                        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
                            Craft precise controller, keyboard, and mouse maps.
                            Changes save to{" "}
                            <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">
                                input_config/*.ini
                            </code>
                            .
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasChanges ? (
                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-medium text-emerald-300 text-xs">
                                Saving…
                            </span>
                        ) : (
                            <span className="rounded-full bg-white/5 px-3 py-1 text-muted-foreground text-xs">
                                Saved
                            </span>
                        )}
                        <Navigable>
                            <Button
                                className="border-white/10 bg-white/5 hover:bg-violet-500/10"
                                onClick={resetDefaults}
                                variant="outline"
                            >
                                <RotateCcwIcon className="size-4" />
                                Reset defaults
                            </Button>
                        </Navigable>
                    </div>
                </div>
            </header>

            <Tabs
                className="flex min-h-0 flex-1 flex-col gap-0"
                onValueChange={(value) => {
                    setTab(value as InputBindingTab);
                    setListening(null);
                }}
                value={tab}
            >
                <div className="border-white/10 border-b px-5 py-4 sm:px-6">
                    <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/20 p-1 backdrop-blur-md">
                        {TAB_META.map(({ id, label, icon: Icon }) => (
                            <TabsTrigger
                                className="rounded-xl px-3 py-2.5 data-[state=active]:text-foreground"
                                key={id}
                                value={id}
                            >
                                <Icon className="mr-2 size-4 opacity-80" />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <p className="mt-3 text-muted-foreground text-sm">
                        {TAB_META.find((item) => item.id === tab)?.blurb}
                    </p>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                    <TabsContents>
                        {TAB_META.map(({ id }) => (
                            <TabsContent key={id} value={id}>
                                <div className="space-y-8 p-5 sm:p-6">
                                    {id !== "mouse" &&
                                        OUTPUT_GROUPS.map((group) => (
                                            <section key={group.title}>
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
                                                    <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
                                                        {group.title}
                                                    </h3>
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {group.outputs.map(
                                                        (output) =>
                                                            renderOutputSlots(
                                                                output,
                                                            ),
                                                    )}
                                                </div>
                                            </section>
                                        ))}

                                    {id === "keyboard" && (
                                        <section>
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                                                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
                                                    Global hotkeys
                                                </h3>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent" />
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {hotkeyKeys.map((key) => {
                                                    const value =
                                                        files.globalIni
                                                            .specials[key] ??
                                                        DEFAULT_HOTKEYS[key];
                                                    return (
                                                        <BindingSlot
                                                            index={0}
                                                            inputs={hotkeyInputs(
                                                                value,
                                                            )}
                                                            key={key}
                                                            label={
                                                                HOTKEY_LABELS[
                                                                    key
                                                                ] ?? key
                                                            }
                                                            listening={
                                                                listening
                                                            }
                                                            onClear={() => {
                                                                const next =
                                                                    structuredClone(
                                                                        files.globalIni,
                                                                    );
                                                                delete next
                                                                    .specials[
                                                                    key
                                                                ];
                                                                persist({
                                                                    ...files,
                                                                    globalIni:
                                                                        next,
                                                                });
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
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {id === "mouse" && (
                                        <>
                                            <section>
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                                                    <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
                                                        Mouse bindings
                                                    </h3>
                                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {BINDABLE_OUTPUTS.flatMap(
                                                        (output) => {
                                                            const entries =
                                                                entriesForTab(
                                                                    files,
                                                                    "mouse",
                                                                    output,
                                                                );
                                                            if (
                                                                entries.length ===
                                                                0
                                                            ) {
                                                                return [];
                                                            }
                                                            return renderOutputSlots(
                                                                output,
                                                            );
                                                        },
                                                    )}
                                                    {BINDABLE_OUTPUTS.every(
                                                        (output) =>
                                                            entriesForTab(
                                                                files,
                                                                "mouse",
                                                                output,
                                                            ).length === 0,
                                                    ) && (
                                                        <motion.div
                                                            animate={{
                                                                opacity: [
                                                                    0.7, 1, 0.7,
                                                                ],
                                                            }}
                                                            className="col-span-full rounded-2xl border border-white/10 border-dashed bg-white/5 p-8 text-center"
                                                            transition={{
                                                                duration: 2.4,
                                                                repeat: Number.POSITIVE_INFINITY,
                                                            }}
                                                        >
                                                            <p className="font-medium text-sm">
                                                                No mouse
                                                                bindings yet
                                                            </p>
                                                            <p className="mt-2 text-muted-foreground text-sm">
                                                                Start with
                                                                common actions
                                                                below.
                                                            </p>
                                                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                                {[
                                                                    "cross",
                                                                    "circle",
                                                                    "options",
                                                                ].map(
                                                                    (output) =>
                                                                        renderOutputSlots(
                                                                            output,
                                                                        ),
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </section>

                                            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-5">
                                                <p className="font-medium text-sm">
                                                    Mouse → joystick
                                                </p>
                                                <p className="mt-1 text-muted-foreground text-sm">
                                                    Current mode:{" "}
                                                    <span className="font-semibold text-foreground">
                                                        {files.defaultIni
                                                            .specials
                                                            .mouse_to_joystick ??
                                                            "disabled"}
                                                    </span>
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {(
                                                        [
                                                            "left",
                                                            "right",
                                                            "disabled",
                                                        ] as const
                                                    ).map((mode) => (
                                                        <Navigable key={mode}>
                                                            <Button
                                                                className={cn(
                                                                    "capitalize",
                                                                    (files
                                                                        .defaultIni
                                                                        .specials
                                                                        .mouse_to_joystick ??
                                                                        "disabled") ===
                                                                        mode &&
                                                                        "border-cyan-400/40 bg-cyan-500/15",
                                                                )}
                                                                onClick={() => {
                                                                    const next =
                                                                        structuredClone(
                                                                            files,
                                                                        );
                                                                    if (
                                                                        mode ===
                                                                        "disabled"
                                                                    ) {
                                                                        delete next
                                                                            .defaultIni
                                                                            .specials
                                                                            .mouse_to_joystick;
                                                                    } else {
                                                                        next.defaultIni.specials.mouse_to_joystick =
                                                                            mode;
                                                                    }
                                                                    persist(
                                                                        next,
                                                                    );
                                                                }}
                                                                size="sm"
                                                                variant="outline"
                                                            >
                                                                {mode}
                                                            </Button>
                                                        </Navigable>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        ))}
                    </TabsContents>
                </ScrollArea>
            </Tabs>
        </div>
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
                <InputBindingsPanelLoader />
            </Suspense>
        </div>
    );
}
