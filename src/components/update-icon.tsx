import { useAtomValue } from "jotai";
import { DownloadIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { installUpdate } from "@/handlers/auto-update";
import { atomUpdateAvailable as atomAvailableUpdate } from "@/store/common";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function UpdateIcon() {
    const availableUpdate = useAtomValue(atomAvailableUpdate);

    if (!availableUpdate) {
        return null;
    }

    return createPortal(
        <div className="absolute right-0 bottom-0 z-30 p-8">
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div
                        className="animate-bounce cursor-pointer rounded-full bg-green-100 p-4"
                        onClick={installUpdate}
                        role="button"
                        tabIndex={0}
                    >
                        <DownloadIcon className="h-5 w-5 text-green-700" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Update available</p>
                </TooltipContent>
            </Tooltip>
        </div>,
        document.body,
    );
}
