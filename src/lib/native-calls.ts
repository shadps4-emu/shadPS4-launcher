import { invoke } from "@tauri-apps/api/core";

export interface SystemTime {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

export interface PSFEntry {
  Integer?: number;
  Text?: string;
  Binary?: Uint8Array;
}

export interface PSF {
  last_write: SystemTime;
  entries: Record<string, PSFEntry>;
}

export async function readPsf(path: string): Promise<PSF> {
  return await invoke("read_psf", {
    path,
  });
}

export async function extractZip(zipPath: string, extractPath: string) {
  return await invoke("extract_zip", {
    zipPath,
    extractPath,
  });
}
