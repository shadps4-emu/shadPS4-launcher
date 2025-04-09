import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
import { defaultStore } from "@/store";
import { atomDownloadingOverlay, atomUpdateAvailable } from "@/store/common";
import { stringifyError } from "@/utils/error";

declare global {
    interface Window {
        UPDATE_CHECKER_LOOP: ReturnType<typeof setInterval>;
    }
}

async function doCheck() {
    const update = await check();
    if (update) {
        defaultStore.set(atomUpdateAvailable, update);
    }
}

export function startUpdateChecker() {
    if (window.UPDATE_CHECKER_LOOP) {
        clearInterval(window.UPDATE_CHECKER_LOOP);
    }
    window.UPDATE_CHECKER_LOOP = setInterval(doCheck, 30 * 60 * 1000); // 30 min interval
    doCheck();
}

export async function installUpdate() {
    try {
        const update = defaultStore.get(atomUpdateAvailable);
        if (!update) {
            console.warn("Trying to install update but it's not available");
            return;
        }
        defaultStore.set(atomDownloadingOverlay, {
            message: "Starting update",
            progress: "infinity",
        });

        let progress = 0;
        let totalSize: number | undefined = undefined;
        await update.downloadAndInstall((ev) => {
            switch (ev.event) {
                case "Started":
                    totalSize = ev.data.contentLength;
                    console.log(
                        `started downloading ${ev.data.contentLength} bytes`,
                    );
                    defaultStore.set(atomDownloadingOverlay, {
                        message: "Downloading update",
                        progress: 0,
                        total: totalSize,
                        format: "data",
                    });
                    break;
                case "Progress":
                    progress += ev.data.chunkLength;
                    console.trace(`Downloaded ${progress}/${totalSize}`);
                    defaultStore.set(atomDownloadingOverlay, {
                        message: "Downloading update",
                        progress: progress,
                        total: totalSize,
                        format: "data",
                    });
                    break;
                case "Finished":
                    console.log("download finished");
                    defaultStore.set(atomDownloadingOverlay, {
                        message: "Installing update",
                        progress: "infinity",
                    });
                    break;
            }
        });
        console.info("Update Installed. Restarting app");
        await relaunch();
    } catch (e: unknown) {
        console.error("download update error", e);
        toast.error("Error downloading update: " + stringifyError(e));
    }
}
