import type { ReactNode } from "react";
import dualsenseSvg from "@/assets/controllers/dualsense.svg";
import type { BindableOutput } from "@/lib/input-config";
import { cn } from "@/lib/utils/ui";

export const CONTROLLER_DIAGRAM_OUTPUTS = new Set<BindableOutput>([
    "triangle",
    "circle",
    "cross",
    "square",
    "l1",
    "r1",
    "l2",
    "r2",
    "l3",
    "r3",
    "options",
    "touchpad_left",
    "touchpad_center",
    "touchpad_right",
    "pad_up",
    "pad_down",
    "pad_left",
    "pad_right",
]);

type PinPosition = {
    left: string;
    top: string;
};

const PIN_POSITIONS: Partial<Record<BindableOutput, PinPosition>> = {
    triangle: { left: "71%", top: "18%" },
    circle: { left: "71%", top: "34%" },
    cross: { left: "64%", top: "26%" },
    square: { left: "78%", top: "26%" },
    pad_up: { left: "17%", top: "24%" },
    pad_down: { left: "17%", top: "36%" },
    pad_left: { left: "11%", top: "30%" },
    pad_right: { left: "23%", top: "30%" },
    l1: { left: "16%", top: "4%" },
    l2: { left: "26%", top: "0%" },
    r1: { left: "72%", top: "4%" },
    r2: { left: "62%", top: "0%" },
    l3: { left: "31%", top: "44%" },
    r3: { left: "57%", top: "44%" },
    options: { left: "43%", top: "12%" },
    touchpad_left: { left: "37%", top: "8%" },
    touchpad_center: { left: "45%", top: "6%" },
    touchpad_right: { left: "53%", top: "8%" },
};

type Props = {
    outputs: BindableOutput[];
    renderSlot: (output: BindableOutput) => ReactNode;
    className?: string;
};

export function ControllerDiagram({ outputs, renderSlot, className }: Props) {
    const diagramOutputs = outputs.filter((output) =>
        CONTROLLER_DIAGRAM_OUTPUTS.has(output),
    );

    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-black/30 to-amber-500/10 p-4 sm:p-6",
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_45%)]" />
            <div className="relative mx-auto max-w-3xl">
                <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                    <div className="pointer-events-none absolute inset-[8%] flex items-center justify-center">
                        <img
                            alt=""
                            aria-hidden
                            className="h-full w-full max-w-[92%] object-contain opacity-90 brightness-0 drop-shadow-[0_0_28px_rgba(168,85,247,0.35)] invert"
                            draggable={false}
                            src={dualsenseSvg}
                        />
                    </div>
                    {diagramOutputs.map((output) => {
                        const position = PIN_POSITIONS[output];
                        if (!position) {
                            return null;
                        }
                        return (
                            <div
                                className="-translate-x-1/2 -translate-y-1/2 absolute z-10 w-[min(34%,9.5rem)]"
                                key={output}
                                style={{
                                    left: position.left,
                                    top: position.top,
                                }}
                            >
                                {renderSlot(output)}
                            </div>
                        );
                    })}
                </div>
            </div>
            <p className="pointer-events-none absolute right-3 bottom-2 text-[9px] text-muted-foreground/45 leading-tight">
                LICENSE: CC Attribution License
                <br />
                AUTHOR: Alex Martynov
            </p>
        </section>
    );
}
