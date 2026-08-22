import { EmuConfigPanel } from "@/components/emu-config/panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useNavigator } from "@/lib/hooks/useNavigator";

export function EmuConfigModal() {
    const { popModal } = useNavigator();

    return (
        <Dialog onOpenChange={() => popModal()} open>
            <DialogTitle className="sr-only">
                Emulator Configuration
            </DialogTitle>
            <DialogContent
                aria-describedby={undefined}
                className="flex h-[min(90vh,760px)] max-h-[90vh] w-full max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw] lg:max-w-5xl"
            >
                <EmuConfigPanel className="min-h-0 flex-1" />
            </DialogContent>
        </Dialog>
    );
}
