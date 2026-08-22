import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "sonner";
import { stringifyError } from "@/lib/utils/error";
import { modalRegistry } from "./registry";
import { encodeModalWindowUrl } from "./route";
import type { ModalParamsById, WindowableModalId } from "./types";

function modalWindowLabel(id: WindowableModalId): string {
    // Tauri labels: alphanumeric + `-` `/` `:` `_`
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    return `modal-${id}-${suffix}`;
}

/** Open a registered modal in a new Tauri webview window. */
export async function openModalWindow<I extends WindowableModalId>(
    id: I,
    params: ModalParamsById[I],
): Promise<void> {
    const entry = modalRegistry[id];
    const label = modalWindowLabel(id);
    const url = encodeModalWindowUrl(id, params);

    try {
        const webview = new WebviewWindow(label, {
            url,
            title: entry.title,
            width: entry.width,
            height: entry.height,
            center: true,
            focus: true,
            resizable: true,
        });

        await new Promise<void>((resolve, reject) => {
            webview.once("tauri://created", () => resolve());
            webview.once("tauri://error", (event) => {
                reject(
                    new Error(
                        typeof event.payload === "string"
                            ? event.payload
                            : "Failed to create modal window",
                    ),
                );
            });
        });
    } catch (e: unknown) {
        toast.error(`Could not open window: ${stringifyError(e)}`);
        console.error(e);
    }
}
