import {
    GamepadNavField,
    type NavButton,
} from "@/lib/context/gamepad-nav-field";
import { useNavigator } from "@/lib/hooks/useNavigator";
import { InputBindingsPanel } from "../input-bindings/panel";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

export function InputBindingsModal() {
    const { popModal } = useNavigator();

    const onButtonPress = (btn: NavButton) => {
        if (btn === "back") {
            popModal();
        }
    };

    return (
        <GamepadNavField
            debugName="input-bindings-modal"
            onButtonPress={onButtonPress}
            zIndex={100}
        >
            <Dialog onOpenChange={() => popModal()} open>
                <DialogTitle className="sr-only">Input Bindings</DialogTitle>
                <DialogContent
                    aria-describedby={undefined}
                    className="flex h-[min(92vh,780px)] max-h-[92vh] w-full max-w-full flex-col gap-0 overflow-hidden border-white/10 bg-gradient-to-br from-background via-background to-violet-950/20 p-0 sm:max-w-[95vw] lg:max-w-6xl"
                    showCloseButton
                >
                    <InputBindingsPanel className="min-h-0 flex-1" />
                </DialogContent>
            </Dialog>
        </GamepadNavField>
    );
}
