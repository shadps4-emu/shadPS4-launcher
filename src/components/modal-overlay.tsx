import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-overlay";
import { useNavigator } from "@/lib/hooks/useNavigator";

export function ModalOverlay() {
    const { modalStack } = useNavigator();

    if (modalStack.length === 0) {
        return <></>;
    }

    const modal = modalStack[modalStack.length - 1];
    return <Suspense fallback={<LoadingScreen />}>{modal}</Suspense>;
}
