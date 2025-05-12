import { Slot } from "@radix-ui/react-slot";
import {
    type PropsWithChildren,
    type Ref,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";
import type { GamepadButtonEvent } from "@/handlers/gamepad";
import type {
    GamepadButton,
    INavTarget,
} from "@/lib/context/gamepad-nav-field";
import { useGamepadNavField } from "@/lib/hooks/useGamepadNavField";

type Props = PropsWithChildren<
    Omit<INavTarget, "element"> & {
        ref?: Ref<HTMLElement>;
        disabled?: boolean;
        tabIndex?: number | undefined;
        defaultMouse?: boolean;
        grabFocus?: boolean;
    }
>;

export function Navigable({
    ref: parentRef,
    disabled,
    tabIndex,
    defaultMouse: defaultInput,
    grabFocus,
    anchor,
    onSelect: propOnSelect,
    onUnselect,
    onButtonPress: propOnButtonPress,
    children,
    ...props
}: Props) {
    const ref = useRef<HTMLElement>(null);
    const navField = useGamepadNavField();

    useImperativeHandle(parentRef, () => {
        return ref.current!;
    }, []);

    const onSelect = useCallback(
        (btn: GamepadButton | null, e: GamepadButtonEvent) => {
            propOnSelect?.(btn, e);
            if (!e.isPreventingDefault) {
                document
                    .querySelectorAll("*[data-gamepad-focus]")
                    .forEach((el) => el.removeAttribute("data-gamepad-focus"));
                const el = ref.current;
                if (el) {
                    el.setAttribute("data-gamepad-focus", "true");
                    el.focus();
                }
            }
        },
        [propOnSelect],
    );
    const onButtonPress = useCallback(
        (btn: GamepadButton, e: GamepadButtonEvent) => {
            propOnButtonPress?.(btn, e);
            if (!e.isPreventingDefault && defaultInput !== false) {
                if (btn === "confirm") {
                    ref.current?.click();
                } else if (btn === "back") {
                    ref.current?.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: "Escape",
                            keyCode: 27,
                            which: 27,
                            code: "Escape",
                        }),
                    );
                }
            }
        },
        [propOnButtonPress, defaultInput],
    );

    useEffect(() => {
        if (disabled) {
            return;
        }
        const t = {
            element: ref,
            anchor,
            onSelect,
            onUnselect,
            onButtonPress,
        };
        const s = navField.register(t, grabFocus);
        return () => navField.unregister(s);
    }, [
        disabled,
        navField,
        anchor,
        onSelect,
        onUnselect,
        onButtonPress,
        grabFocus,
    ]);

    return (
        <>
            <Slot ref={ref} tabIndex={tabIndex ?? 0} {...props}>
                {children}
            </Slot>
        </>
    );
}
