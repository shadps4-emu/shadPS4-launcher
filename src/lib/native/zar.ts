import { invoke } from "@tauri-apps/api/core";
import type { PSF } from "./psf";

export async function inspectZarGame(path: string): Promise<PSF | null> {
    return await invoke("inspect_zar_game", { path });
}

export async function readZarIcon(path: string): Promise<Uint8Array | null> {
    const data = await invoke<number[] | null>("read_zar_icon", { path });
    return data === null ? null : Uint8Array.from(data);
}
