import { join, tempDir } from "@tauri-apps/api/path";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { download } from "@tauri-apps/plugin-upload";
import { toast } from "sonner";
import { extractZip, makeItExecutable } from "@/lib/native/common";
import { stringifyError } from "@/lib/utils/error";
import { defaultStore } from "@/store";
import { atomDownloadingOverlay } from "@/store/common";
import {
    atomInstalledVersions,
    type EmulatorVersion,
    type RemoteEmulatorVersion,
} from "@/store/version-manager";

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

        const path = await join(installPath, executable.name);
        await makeItExecutable(path);

        const data: EmulatorVersion = {
            name: version.name,
            version: version.version,
            date: version.date,
            repo: version.repo,
            prerelease: version.prerelease,
            path,
        };

        const prev = defaultStore.get(atomInstalledVersions);
        defaultStore.set(atomInstalledVersions, [...prev, data]);
        defaultStore.set(atomDownloadingOverlay, null);

        toast.success("Installed");
    } catch (e: unknown) {
        toast.error(stringifyError(e));
        console.error(e);
    } finally {
        defaultStore.set(atomDownloadingOverlay, null);
    }
}
