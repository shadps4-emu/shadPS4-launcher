import { invoke } from "@tauri-apps/api/core";

export async function extractZip(zipPath: string, extractPath: string) {
    return await invoke("extract_zip", {
        zipPath,
        extractPath,
    });
}

export async function makeItExecutable(path: string) {
    return await invoke("make_it_executable", {
        path,
    });
}

export async function openPath(path: string) {
    return await invoke("open_path", {
        path,
    });
}
