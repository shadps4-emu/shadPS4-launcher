import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { MinusIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { stringifyError } from "@/lib/utils/error";
import { cn } from "@/lib/utils/ui";

export function SettingSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="space-y-1">
                <h3 className="font-semibold text-base tracking-tight">
                    {title}
                </h3>
                {description ? (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/40">
                {children}
            </div>
        </section>
    );
}

export function SettingRow({
    label,
    description,
    htmlFor,
    children,
    experimental,
}: {
    label: string;
    description?: string;
    htmlFor?: string;
    children: ReactNode;
    experimental?: boolean;
}) {
    const titleNode = (
        <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
                <Label
                    className="font-medium text-sm leading-none"
                    htmlFor={htmlFor}
                >
                    {label}
                </Label>
                {experimental ? (
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-medium text-[10px] text-amber-700 uppercase tracking-wide dark:text-amber-300">
                        Experimental
                    </span>
                ) : null}
            </div>
            {description ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                    {description}
                </p>
            ) : null}
        </div>
    );

    return (
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            {description ? (
                <Tooltip delayDuration={250}>
                    <TooltipTrigger asChild>
                        <div className="min-w-0 flex-1 cursor-help">
                            {titleNode}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left">
                        {description}
                    </TooltipContent>
                </Tooltip>
            ) : (
                <div className="min-w-0 flex-1">{titleNode}</div>
            )}
            <div className="flex shrink-0 items-center justify-end sm:max-w-[55%]">
                {children}
            </div>
        </div>
    );
}

export function SwitchControl({
    id,
    checked,
    onCheckedChange,
    disabled,
}: {
    id?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            aria-checked={checked}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-primary" : "bg-input",
            )}
            disabled={disabled}
            id={id}
            onClick={() => onCheckedChange(!checked)}
            role="switch"
            type="button"
        >
            <span
                className={cn(
                    "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform",
                    checked ? "translate-x-[1.35rem]" : "translate-x-0.5",
                )}
            />
        </button>
    );
}

export function NumberStepper({
    id,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
}: {
    id?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
}) {
    const clamp = (n: number) => {
        let next = n;
        if (min != null) {
            next = Math.max(min, next);
        }
        if (max != null) {
            next = Math.min(max, next);
        }
        return next;
    };

    return (
        <div className="flex items-center gap-1">
            <Button
                aria-label="Decrease"
                className="size-8"
                onClick={() => onChange(clamp(value - step))}
                size="icon"
                type="button"
                variant="outline"
            >
                <MinusIcon className="size-3.5" />
            </Button>
            <Input
                className="h-8 w-24 text-center tabular-nums"
                id={id}
                max={max}
                min={min}
                onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n)) {
                        onChange(clamp(n));
                    }
                }}
                step={step}
                type="number"
                value={value}
            />
            <Button
                aria-label="Increase"
                className="size-8"
                onClick={() => onChange(clamp(value + step))}
                size="icon"
                type="button"
                variant="outline"
            >
                <PlusIcon className="size-3.5" />
            </Button>
            {suffix ? (
                <span className="ml-1 text-muted-foreground text-xs">
                    {suffix}
                </span>
            ) : null}
        </div>
    );
}

export function SliderControl({
    id,
    value,
    onChange,
    min,
    max,
    step = 1,
    displayValue,
}: {
    id?: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    displayValue?: string;
}) {
    return (
        <div className="flex w-full min-w-[12rem] max-w-xs items-center gap-3">
            <input
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                id={id}
                max={max}
                min={min}
                onChange={(e) => onChange(Number(e.target.value))}
                step={step}
                type="range"
                value={value}
            />
            <span className="w-14 shrink-0 text-right font-medium text-xs tabular-nums">
                {displayValue ?? String(value)}
            </span>
        </div>
    );
}

export function SelectControl<T extends string>({
    id,
    value,
    onChange,
    options,
    className,
}: {
    id?: string;
    value: T;
    onChange: (value: T) => void;
    options: readonly { value: T; label: string }[];
    className?: string;
}) {
    return (
        <Select onValueChange={(v) => onChange(v as T)} value={value}>
            <SelectTrigger
                className={cn("w-[min(100%,16rem)]", className)}
                id={id}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function IntSelectControl({
    id,
    value,
    onChange,
    options,
    className,
}: {
    id?: string;
    value: number;
    onChange: (value: number) => void;
    options: readonly { value: number; label: string }[];
    className?: string;
}) {
    return (
        <Select
            onValueChange={(v) => onChange(Number(v))}
            value={String(value)}
        >
            <SelectTrigger
                className={cn("w-[min(100%,16rem)]", className)}
                id={id}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function TextControl({
    id,
    value,
    onChange,
    placeholder,
    className,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <Input
            className={cn("w-[min(100%,18rem)]", className)}
            id={id}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            type="text"
            value={value}
        />
    );
}

export function PathControl({
    id,
    value,
    onChange,
    placeholder,
}: {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const browse = () => {
        openDialog({ directory: true })
            .then((path) => {
                if (path) {
                    onChange(path);
                }
            })
            .catch((e: unknown) => {
                toast.error(stringifyError(e));
                console.error(e);
            });
    };

    return (
        <div className="flex w-[min(100%,22rem)] items-center">
            <Input
                className="rounded-r-none"
                id={id}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? "Directory path"}
                type="text"
                value={value}
            />
            <Button
                className="rounded-l-none"
                onClick={browse}
                type="button"
                variant="secondary"
            >
                Browse
            </Button>
        </div>
    );
}
