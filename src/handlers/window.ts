import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

/**
 * Opens the emulator config window
 *
 * // TODO Remove this
 *
 * @deprecated
 */
export async function openEmuConfigWindow() {
    const wvw = new WebviewWindow("emu_config");
    if (await wvw.isVisible()) {
        return;
    }
    wvw.emit("reload-user-config");
    await wvw.show();
}
