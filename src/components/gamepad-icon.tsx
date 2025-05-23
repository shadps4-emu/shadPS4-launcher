import { CircleHelpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createAbort } from "@/lib/utils/events";
import { cn } from "@/lib/utils/ui";

export enum ButtonType {
    DPAD_UP = "dpad_up",
    DPAD_DOWN = "dpad_down",
    DPAD_LEFT = "dpad_left",
    DPAD_RIGHT = "dpad_right",
    BUTTON_UP = "button_up",
    BUTTON_DOWN = "button_down",
    BUTTON_LEFT = "button_left",
    BUTTON_RIGHT = "button_right",
    OPTIONS = "options",
    L1 = "l1",
    R1 = "r1",
    L2 = "l2",
    R2 = "r2",
    L3 = "l3",
    R3 = "r3",
    LEFT_STICK = "left_stick",
    RIGHT_STICK = "right_stick",
}

export enum ButtonFamily {
    xbox = "xbox",
    ps = "ps",
}

export interface GamepadIconProps {
    icon: ButtonType;
    type?: ButtonFamily;
    color?: boolean; // not all icons supports color
    outline?: boolean;
    className?: string;
}

export default function GamepadIcon({
    icon,
    type = ButtonFamily.ps,
    color,
    outline,
    className,
}: GamepadIconProps) {
    const [loadedIcon, setLoadedIcon] = useState<string | undefined | null>();

    useEffect(() => {
        const { abort, signal } = createAbort();

        void import(
            `@/assets/gamepad/${type}/${icon}${color ? "_color" : ""}${outline ? "_outline" : ""}.svg`
        )
            .then((module: { default: string }) => {
                if (signal.aborted) {
                    return;
                }
                setLoadedIcon(module.default);
            })
            .catch(() => {
                setLoadedIcon(null);
            });

        return () => {
            abort();
            setLoadedIcon(undefined);
        };
    }, [icon, color, outline, type]);

    if (loadedIcon === undefined) {
        return null;
    }
    if (loadedIcon === null) {
        return <CircleHelpIcon className={cn("scale-90", className)} />;
    }

    return <img alt={icon} className={className} src={loadedIcon} />;
}
