import { platform } from "@tauri-apps/plugin-os";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { ResultAsync } from "neverthrow";
import { Octokit } from "octokit";
import { stringifyError } from "@/lib/utils/error";
import { withTimeout } from "@/lib/utils/flow";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import { oficialRepo } from "./common";

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

export interface EmulatorVersion {
    path: string; // Executable dir
    repo?: string; // repo source
    date?: number; // release date
    version?: string; // release version
    name: string; // release name
    prerelease?: boolean;
}

export type RemoteEmulatorVersion = Omit<EmulatorVersion, "path"> & {
    url: string; // download url
    notSupported?: boolean; // no available for the current platform
};

const octokit = new Octokit();

export const atomModalVersionManagerIsOpen = atom<boolean>(false);

export const atomRemoteList = atomWithTauriStore<string[]>(
    "versions.json",
    "remote_list",
    {
        initialValue: [oficialRepo],
    },
);

export const atomInstalledVersions = atomWithTauriStore<EmulatorVersion[]>(
    "versions.json",
    "installed",
    {
        initialValue: [],
    },
);

const atomSelectedVersionRaw = atomWithTauriStore("versions.json", "selected", {
    initialValue: "",
});

export const atomSelectedVersion = atom<
    EmulatorVersion | null,
    [EmulatorVersion | string],
    void
>(
    (get) => {
        const raw = get(atomSelectedVersionRaw);
        const installedVersion = get(unwrap(atomInstalledVersions));
        if (!raw || !installedVersion) {
            return null;
        }

        return installedVersion.find((e) => e.path === raw) ?? null;
    },
    (_get, set, value: EmulatorVersion | string) => {
        set(
            atomSelectedVersionRaw,
            typeof value === "string" ? value : value.path,
        );
    },
);

export const atomAvailableVersions = atomWithQuery((get) => ({
    queryKey: ["github", "available", get(atomRemoteList)] as [
        string,
        string,
        string[],
    ],
    retry: false,
    queryFn: async ({
        queryKey: [, , list],
    }: {
        queryKey: [string, string, string[]];
    }): Promise<RemoteEmulatorVersion[]> => {
        return (
            await Promise.all(
                list.map(async (repoSource) => {
                    const [owner, repo] = repoSource.split("/");
                    if (!owner || !repo) {
                        return [];
                    }
                    const result = await withTimeout(
                        ResultAsync.fromPromise(
                            octokit.rest.repos.listReleases({
                                owner,
                                repo,
                            }),
                            (err) =>
                                new Error(
                                    "GitHub API Error: " + stringifyError(err),
                                ),
                        ),
                        10000,
                        new Error("GitHub Timeout"),
                    );
                    if (result.isErr() || result.value.status !== 200) {
                        throw new Error(
                            `Failed to fetch releases from the following repo: '${repoSource}'. ` +
                                (result.isErr()
                                    ? stringifyError(result.error)
                                    : `HTTP Status: ${result.value.status}`),
                        );
                    }
                    const releaseList = result.value;
                    return releaseList.data
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
                                    release.tag_name.split("-").pop() ||
                                    "Unknown";
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
    },
}));
