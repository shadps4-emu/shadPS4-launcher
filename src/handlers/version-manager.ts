import { extractZip } from "@/lib/native-calls";
import { defaultStore } from "@/store";
import { atomDownloadingOverlay } from "@/store/common";
import {
  refreshInstalledVersion,
  type EmulatorVersion,
  type RemoteEmulatorVersion,
} from "@/store/version-manager";
import { stringifyError } from "@/utils/error";
import { join, tempDir } from "@tauri-apps/api/path";
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { download } from "@tauri-apps/plugin-upload";
import { toast } from "sonner";
import * as superjson from "superjson";

export async function writeConfig({ path, ...config }: EmulatorVersion) {
  const data = superjson.stringify(config);
  const metaPath = await join(path, "meta.json");
  await writeTextFile(metaPath, data);
}

export async function readConfig(
  path: string,
): Promise<EmulatorVersion | null> {
  const metaPath = await join(path, "meta.json");
  if (!(await exists(metaPath))) {
    return null;
  }
  const data = await readTextFile(metaPath);
  return superjson.parse<EmulatorVersion>(data);
}

export async function installNewVersion(
  version: RemoteEmulatorVersion,
  rootInstallPath: string,
) {
  try {
    defaultStore.set(atomDownloadingOverlay, {
      message: "Downloading",
      progress: "infinity",
    });
    const folderName = `${version.repo}-${version.version}`.replaceAll(
      /[^\w.]/g,
      "-",
    );
    let installPath;
    let i = 1;
    do {
      const name = i <= 1 ? folderName : `${folderName}-${i}`;
      i++;
      installPath = await join(rootInstallPath, name);
    } while (await exists(installPath));

    const tmpPath = await join(await tempDir(), "shardps4-artifact.zip");

    await download(version.url, tmpPath, ({ progressTotal, total }) => {
      defaultStore.set(
        atomDownloadingOverlay,
        total > 0
          ? {
              message: "Downloading",
              progress: progressTotal,
              total,
            }
          : { message: "Downloading", progress: "infinity" },
      );
    });

    defaultStore.set(atomDownloadingOverlay, {
      message: "Extracting",
      progress: "infinity",
    });
    await extractZip(tmpPath, installPath);
    await writeConfig({ ...version, path: installPath });

    defaultStore.set(atomDownloadingOverlay, null);

    refreshInstalledVersion(defaultStore);
    toast.success("Installed");
  } catch (e: unknown) {
    toast.error(stringifyError(e));
    console.error(e);
    debugger;
  } finally {
    defaultStore.set(atomDownloadingOverlay, null);
  }
}
