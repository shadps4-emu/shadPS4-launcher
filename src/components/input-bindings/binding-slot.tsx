import { SparklesIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import {
    type BindingInputs,
    formatTokenLabel,
    type InputBindingTab,
} from "@/lib/input-config";
import { cn } from "@/lib/utils/ui";
import { Navigable } from "../ui/navigable";
import type { BindingCaptureTarget } from "./use-binding-capture";

type Props = {
    label: string;
    inputs: BindingInputs;
    tab: InputBindingTab;
    output: string;
    index: number;
    listening: BindingCaptureTarget | null;
    className?: string;
    onStart: (target: BindingCaptureTarget) => void;
    onClear: (target: BindingCaptureTarget) => void;
};

/**
 * One bindable slot. The whole surface is the bind target so the chip stays
 * short enough to sit on the controller map without a separate action button.
 */
export function BindingSlot({
    label,
    inputs,
    tab,
    output,
    index,
    listening,
    className,
    onStart,
    onClear,
}: Props) {
    const target = { index, output, tab };
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
                "group relative h-full w-full overflow-hidden rounded-xl border bg-gradient-to-br p-px transition-colors duration-300",
                isListening
                    ? "border-transparent from-violet-500/80 via-fuchsia-500/70 to-amber-400/60 shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                    : "border-white/10 from-white/10 via-white/5 to-transparent hover:from-violet-500/40 hover:via-fuchsia-500/25 hover:to-cyan-400/20",
                className,
            )}
        >
            <div className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-background/95 via-background/90 to-muted/20 px-2.5 backdrop-blur-sm">
                {isListening && (
                    <motion.div
                        animate={{ opacity: [0.35, 0.8, 0.35] }}
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.25),transparent_60%)]"
                        transition={{
                            duration: 1.6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                )}

                <Navigable>
                    <button
                        aria-label={`Bind ${label}`}
                        className="absolute inset-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-inset"
                        onClick={() => onStart(target)}
                        type="button"
                    />
                </Navigable>

                <p className="pointer-events-none relative truncate font-medium text-[10px] text-muted-foreground uppercase leading-none tracking-[0.12em]">
                    {label}
                </p>
                <p
                    className={cn(
                        "pointer-events-none relative mt-1 truncate font-semibold text-xs leading-tight",
                        isListening &&
                            "bg-gradient-to-r from-violet-300 via-fuchsia-200 to-amber-200 bg-clip-text text-transparent",
                        !isListening &&
                            boundTokens.length === 0 &&
                            "text-muted-foreground/60",
                    )}
                >
                    {isListening ? "Press any input…" : display}
                </p>

                {isListening && (
                    <SparklesIcon className="pointer-events-none absolute top-1.5 right-1.5 size-3 animate-pulse text-fuchsia-300" />
                )}

                {boundTokens.length > 0 && !isListening && (
                    <Navigable>
                        <button
                            aria-label={`Clear ${label}`}
                            className="absolute top-1 right-1 grid size-5 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-white/10 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                            onClick={() => onClear(target)}
                            type="button"
                        >
                            <XIcon className="size-3" />
                        </button>
                    </Navigable>
                )}
            </div>
        </div>
    );
}
