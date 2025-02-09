import { type PSF, readPsf } from "@/lib/native-calls";
import {
  BaseDirectory,
  basename,
  join,
  resourceDir,
} from "@tauri-apps/api/path";
import { exists, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import { pathPreferences } from "./paths";
import { convertFileSrc } from "@tauri-apps/api/core";

export interface GameEntry {
  path: string;
  id: string;
  title: string;
  cover: string | null;
  version: string;
  fw_version: string;
  sfo?: PSF;
}

export const gameLibrary = atom(async (get) => {
  if (import.meta.env.VITE_USE_MOCK) {
    await new Promise((resolve) => {
      // simulate some loading
      setTimeout(resolve, 1000);
    });
    const data = await readTextFile("mock/games.json", {
      baseDir: BaseDirectory.Resource,
    });

    return JSON.parse(data) as GameEntry[];
  }

  const knownPaths: string[] = [];

  async function isGame(path: string) {
    const paramSfoPath = await join(path, "sce_sys", "param.sfo");
    if (await exists(paramSfoPath)) {
      return true;
    }
    const eBootPath = await join(path, "eboot.bin");
    if (await exists(eBootPath)) {
      return true;
    }
    return false;
  }

  async function discoverGame(path: string) {
    try {
      if (await isGame(path)) {
        knownPaths.push(path);
        return;
      }
      void (await Promise.all(
        (await readDir(path)).map(async (child) => {
          if (child.isDirectory) {
            await discoverGame(await join(path, child.name));
          }
        }),
      ));
    } catch (error) {
      console.error(`Error discovering game: ${path}. ${error}`);
    }
  }

  const v = get(pathPreferences.gamesPath);
  if (!v || !(await exists(v))) {
    return [];
  }
  void (await discoverGame(v));

  return await Promise.all(
    knownPaths.map(async (path): Promise<GameEntry> => {
      const b = await basename(path);

      const paramSfo = await join(path, "sce_sys", "param.sfo");
      const sfo = await readPsf(paramSfo);
      const e = sfo.entries;

      let cover: string | null = await join(path, "sce_sys", "icon0.png");
      if (!(await exists(cover))) {
        cover = null;
      } else {
        cover = convertFileSrc(cover);
      }

      let fw_version = e.SYSTEM_VER?.Integer?.toString(16)
        .padStart(8, "0")
        .slice(0, 4);
      if (fw_version) {
        fw_version =
          fw_version.slice(0, 2).trimStart() + "." + fw_version.slice(2);
        if (fw_version.startsWith("0")) {
          fw_version = fw_version.slice(1);
        }
      }

      return {
        path,
        id: e.TITLE_ID?.Text || b,
        title: e.TITLE?.Text || "Unknown",
        cover,
        version: e.APP_VER?.Text || "UNK",
        fw_version: fw_version || "UNK",
        sfo,
      };
    }),
  );
});
