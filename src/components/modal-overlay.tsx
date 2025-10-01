import { useNavigator } from "@/lib/hooks/useNavigator";

export function ModalOverlay() {
    const { openModals } = useNavigator();

    if (openModals.length === 0) {
        return <></>;
    }

    return openModals[openModals.length - 1];
}
