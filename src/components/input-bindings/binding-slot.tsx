import { SparklesIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import {
    type BindingInputs,
    formatBindingInputs,
    formatTokenLabel,
    type InputBindingTab,
} from "@/lib/input-config";
import { cn } from "@/lib/utils/ui";
import { Button } from "../ui/button";
import { Navigable } from "../ui/navigable";
import type { BindingCaptureTarget } from "./use-binding-capture";

type Props = {
    label: string;
    inputs: BindingInputs;
    tab: InputBindingTab;
    output: string;
    index: number;
    listening: BindingCaptureTarget | null;
    conflict?: string;
    onStart: (target: BindingCaptureTarget) => void;
    onClear: (target: BindingCaptureTarget) => void;
};

export function BindingSlot({
    label,
    inputs,
    tab,
    output,
    index,
    listening,
    conflict,
    onStart,
    onClear,
}: Props) {
    const target = { tab, output, index };
    const isListening =
        listening?.output === output &&
        listening.index === index &&
        listening.tab === tab;
    const boundTokens = inputs.filter((token): token is string =>
        Boolean(token),
    );
    const display = boundTokens.length
        ? boundTokens.map(formatTokenLabel).join(" + ")
        : "Unbound";

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-[1px] transition-all duration-300",
                isListening
                    ? "border-transparent from-violet-500/80 via-fuchsia-500/70 to-amber-400/60 shadow-[0_0_32px_rgba(168,85,247,0.35)]"
                    : "border-white/10 from-white/10 via-white/5 to-transparent hover:from-violet-500/30 hover:via-fuchsia-500/20 hover:to-cyan-400/20",
            )}
        >
            <div className="relative rounded-[calc(1rem-1px)] bg-gradient-to-br from-background/95 via-background/90 to-muted/20 p-4 backdrop-blur-sm">
                {isListening && (
                    <motion.div
                        animate={{ opacity: [0.35, 0.75, 0.35] }}
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_55%)]"
                        transition={{
                            duration: 1.6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                )}
                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
                            {label}
                        </p>
                        <p
                            className={cn(
                                "mt-2 truncate font-semibold text-base tracking-tight",
                                isListening &&
                                    "bg-gradient-to-r from-violet-300 via-fuchsia-200 to-amber-200 bg-clip-text text-transparent",
                            )}
                        >
                            {isListening ? "Press a control…" : display}
                        </p>
                        {!isListening && inputs.filter(Boolean).length > 0 && (
                            <p className="mt-1 truncate text-muted-foreground text-xs">
                                {formatBindingInputs([
                                    inputs[0] ?? "",
                                    inputs[1],
                                    inputs[2],
                                ])}
                            </p>
                        )}
                        {conflict && (
                            <p className="mt-2 text-amber-300 text-xs">
                                Also used by {conflict}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {isListening && (
                            <SparklesIcon className="size-4 animate-pulse text-fuchsia-300" />
                        )}
                        {inputs.some(Boolean) && !isListening && (
                            <Navigable>
                                <Button
                                    className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => onClear(target)}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <XIcon className="size-4" />
                                </Button>
                            </Navigable>
                        )}
                    </div>
                </div>
                <Navigable>
                    <button
                        className={cn(
                            "mt-4 w-full rounded-xl border px-3 py-2 font-medium text-sm transition-all",
                            isListening
                                ? "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100"
                                : "border-white/10 bg-white/5 text-foreground hover:border-violet-400/30 hover:bg-violet-500/10",
                        )}
                        onClick={() => onStart(target)}
                        type="button"
                    >
                        {isListening
                            ? "Listening… (Esc to cancel)"
                            : "Click to bind"}
                    </button>
                </Navigable>
            </div>
        </div>
    );
}
