import { invoke } from "@tauri-apps/api/core";

export async function extractZip(zipPath: string, extractPath: string) {
    return await invoke("extract_zip", {
        zipPath,
        extractPath,
    });
}

export async function openPath(path: string) {
    return await invoke("open_path", {
        path,
    });
}
