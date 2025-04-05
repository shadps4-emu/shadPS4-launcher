import { join, tempDir } from "@tauri-apps/api/path";
import {
    exists,
    readDir,
    readTextFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { download } from "@tauri-apps/plugin-upload";
import { toast } from "sonner";
import * as superjson from "superjson";
import { extractZip } from "@/lib/native/common";
import { defaultStore } from "@/store";
import { atomDownloadingOverlay } from "@/store/common";
import {
    type EmulatorVersion,
    type RemoteEmulatorVersion,
    refreshInstalledVersion,
} from "@/store/version-manager";
import { stringifyError } from "@/utils/error";

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
    const rawData = await readTextFile(metaPath);
    const data = superjson.parse<EmulatorVersion>(rawData);
    if (!("binaryName" in data)) {
        // FIXME Remove in the future. Backwards compatibility
        return null;
    }
    return {
        ...data,
        path,
    };
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
        let installPath: string;
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
                          format: "data",
                      }
                    : { message: "Downloading", progress: "infinity" },
            );
        });

        defaultStore.set(atomDownloadingOverlay, {
            message: "Extracting",
            progress: "infinity",
        });
        await extractZip(tmpPath, installPath);

        const files = await readDir(installPath);
        const executable = files.find(
            (e) => e.isFile && /shadps4/i.test(e.name),
        );

        if (!executable) {
            toast.error(
                `Zip downloaded at ${installPath}, but couldn't find the binary inside`,
            );
            return;
        }

        await writeConfig({
            ...version,
            path: installPath,
            binaryName: executable.name,
        });

        defaultStore.set(atomDownloadingOverlay, null);

        refreshInstalledVersion(defaultStore);
        toast.success("Installed");
    } catch (e: unknown) {
        toast.error(stringifyError(e));
        console.error(e);
    } finally {
        defaultStore.set(atomDownloadingOverlay, null);
    }
}
