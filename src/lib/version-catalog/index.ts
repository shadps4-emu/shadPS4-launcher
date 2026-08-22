import { join, tempDir } from "@tauri-apps/api/path";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { download } from "@tauri-apps/plugin-upload";
import { ResultAsync } from "neverthrow";
import { Octokit } from "octokit";
import { toast } from "sonner";
import { extractZip, makeItExecutable } from "@/lib/native/common";
import { withTimeout } from "@/lib/nt/timeout";
import { stringifyError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import { atomDownloadingOverlay } from "@/store/common";
import {
    atomInstalledVersions,
    type EmulatorVersion,
    type RemoteEmulatorVersion,
} from "@/store/version-manager";

const currentPlatform = (() => {
    const p = platform();
    if (p === "windows") {
        return "win";
    }
    if (p === "macos") {
        return "macos";
    }
    if (p === "linux") {
        return "linux";
    }
    return p;
})();

const octokit = new Octokit();

export async function listRemote(
    repos: string[],
): Promise<RemoteEmulatorVersion[]> {
    return (
        await Promise.all(
            repos.map(async (repoSource) => {
                const [owner, repo] = repoSource.split("/");
                if (!owner || !repo) {
                    return [];
                }
                const result = await withTimeout(
                    ResultAsync.fromPromise(
                        octokit.rest.repos.listReleases({ owner, repo }),
                        (err) =>
                            new Error(
                                `GitHub API Error: ${stringifyError(err)}`,
                            ),
                    ),
                    10000,
                );
                if (result.isErr() || result.value.status !== 200) {
                    throw new Error(
                        `Failed to fetch releases from the following repo: '${repoSource}'. ` +
                            (result.isErr()
                                ? stringifyError(result.error)
                                : `HTTP Status: ${result.value.status}`),
                    );
                }
                return result.value.data
                    .map((release) => {
                        const asset = release.assets.find(
                            (e) =>
                                e.name.endsWith(".zip") &&
                                (e.name.includes("sdl") ||
                                    !e.name.includes("qt")) &&
                                e.name.includes(currentPlatform),
                        );

                        let name = "";
                        if (release.prerelease) {
                            name = "Pre-release";
                        } else {
                            name = release.name || "Unknown";
                            name = name
                                .replaceAll(
                                    /(codename)|(shadps4)|(v\.?\d+\.\d+\.\d+)/g,
                                    "",
                                )
                                .replaceAll("  ", "")
                                .trim()
                                .replaceAll(/(^-)|(-$)/g, "");
                        }

                        let version = "";
                        if (release.prerelease) {
                            version =
                                release.tag_name.split("-").pop() || "Unknown";
                        } else {
                            version = release.tag_name;
                        }

                        const url = asset?.browser_download_url || "";

                        return {
                            repo: repoSource,
                            date: new Date(
                                asset?.updated_at || release.created_at,
                            ).getTime(),
                            version,
                            name,
                            prerelease: release.prerelease,
                            url,
                            notSupported: asset == null || !url,
                        } satisfies RemoteEmulatorVersion;
                    })
                    .filter((e) => e != null);
            }),
        )
    )
        .flat()
        .toSorted((a, b) => b.date - a.date);
}

export async function installVersion(
    version: RemoteEmulatorVersion,
    rootInstallPath: string,
    store: JotaiStore,
): Promise<void> {
    try {
        store.set(atomDownloadingOverlay, {
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
            store.set(
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

        store.set(atomDownloadingOverlay, {
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

        store.set(atomInstalledVersions, (prev) => [...prev, data]);
        toast.success("Installed");
    } catch (e: unknown) {
        toast.error(stringifyError(e));
        console.error(e);
    } finally {
        store.set(atomDownloadingOverlay, null);
    }
}
