import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { ModalOverlay } from "@/components/modal-overlay";
import { useNavigator } from "@/lib/hooks/useNavigator";

/**
 * Host for a dedicated modal window. The modal is seeded via NavigatorProvider
 * `initialModal`; when the user dismisses it (stack empty), the webview closes.
 */
export function ModalWindowHost() {
    const { modalStack } = useNavigator();
    const sawModal = useRef(modalStack.length > 0);
    const closing = useRef(false);

    if (modalStack.length > 0) {
        sawModal.current = true;
    }

    useEffect(() => {
        if (!sawModal.current || closing.current) {
            return;
        }
        if (modalStack.length > 0) {
            return;
        }
        closing.current = true;
        void getCurrentWindow().close();
    }, [modalStack.length]);

    return <ModalOverlay />;
}
