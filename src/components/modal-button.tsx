import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useNavigator } from "@/lib/hooks/useNavigator";
import {
    isWindowableModalId,
    type ModalId,
    type ModalParamsById,
    type OpenModalRequest,
    type OpenMode,
} from "@/lib/modals";

type ModalButtonProps<I extends ModalId> = Omit<
    ButtonProps,
    "onClick" | "type"
> & {
    modal: I;
    /** Optional click handler; runs before the modal opens. Call preventDefault to cancel. */
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
    children?: ReactNode;
} & ([ModalParamsById[I]] extends [undefined]
        ? { params?: undefined }
        : { params: ModalParamsById[I] });

/**
 * Button that opens a registered modal by id.
 * Click → panel overlay (default). Shift+click → new window when the modal is windowable.
 */
export function ModalButton<I extends ModalId>({
    modal,
    params,
    onClick,
    type = "button",
    children,
    ...buttonProps
}: ModalButtonProps<I>) {
    const { openModal } = useNavigator();

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) {
            return;
        }

        const mode: OpenMode =
            event.shiftKey && isWindowableModalId(modal) ? "window" : "panel";

        openModal({
            id: modal,
            mode,
            params,
        } as OpenModalRequest<I>);
    };

    return (
        <Button onClick={handleClick} type={type} {...buttonProps}>
            {children}
        </Button>
    );
}
