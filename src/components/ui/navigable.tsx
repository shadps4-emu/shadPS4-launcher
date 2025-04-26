import { Slot } from "@radix-ui/react-slot";
import { type PropsWithChildren, useCallback, useEffect, useRef } from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import type { INavTarget } from "@/lib/context/gamepad-nav-field";
import { useGamepadNavField } from "@/lib/hooks/useGamepadNavField";

type Props = PropsWithChildren<
    Omit<INavTarget, "element"> & {
        tabIndex?: number | undefined;
    }
>;

export function Navigable({
    onSelect: propOnSelect,
    tabIndex,
    children,
    ...props
}: Props) {
    const ref = useRef<HTMLElement>(null);
    const navField = useGamepadNavField();

    const onSelect = useCallback(
        (e: GamepadButtonEvent) => {
            propOnSelect?.(e);
            if (!e.isPreventingDefault) {
                ref.current?.focus();
            }
        },
        [propOnSelect, ref],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: Props as varidic
    useEffect(() => {
        const t = {
            element: ref,
            onSelect,
            ...props,
        };
        navField.register(t);
        () => navField.unregister(t);
    }, [navField, ref, onSelect, ...Object.values(props)]);

    return (
        <>
            <Slot ref={ref} tabIndex={tabIndex ?? 0}>
                {children}
            </Slot>
        </>
    );
}
