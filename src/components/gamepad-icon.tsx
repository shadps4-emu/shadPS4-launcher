import { CircleHelpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createAbort } from "@/lib/utils/events";
import { cn } from "@/lib/utils/ui";
import type { GamepadButton } from "../lib/context/gamepad-nav-field";

export interface GamepadIconProps {
    icon: GamepadButton;
    type?: "xbox";
    outline?: boolean;
    className?: string;
}

export default function GamepadIcon({
    icon,
    type = "xbox",
    outline,
    ...rest
}: GamepadIconProps) {
    const [loadedIcon, setLoadedIcon] = useState<string | undefined | null>();

    useEffect(() => {
        const { abort, signal } = createAbort();

        void import(
            `@/assets/gamepad/${type}/${icon}${outline ? "_outline" : ""}.svg`
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
    }, [icon, outline, type]);

    if (loadedIcon === undefined) {
        return null;
    }
    if (loadedIcon === null) {
        return <CircleHelpIcon {...rest} className={cn("scale-90")} />;
    }

    return <img src={loadedIcon} {...rest} alt={icon} />;
}
