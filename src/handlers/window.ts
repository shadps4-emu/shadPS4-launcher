import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openEmuConfigWindow() {
    const wvw = new WebviewWindow("emu_config");
    if (await wvw.isVisible()) {
        return;
    }
    wvw.emit("reload-user-config");
    await wvw.show();
}
