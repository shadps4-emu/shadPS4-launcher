import { createAbort } from "@/utils/events";
import { useEffect, useState } from "react";

import { cn } from "@/utils/ui";
import { CircleHelp } from "lucide-react";
import { type GamepadButtons } from "./gamepad-nav-field";

export interface GamepadIconProps {
  icon: GamepadButtons;
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
        if (signal.aborted) return;
        setLoadedIcon(module.default);
      })
      .catch(() => {
        setLoadedIcon(null);
      });

    return () => {
      abort();
      setLoadedIcon(undefined);
    };
  }, [icon]);

  if (loadedIcon === undefined) return null;
  if (loadedIcon === null)
    return <CircleHelp {...rest} className={cn("scale-90")} />;

  return <img src={loadedIcon} {...rest} />;
}
