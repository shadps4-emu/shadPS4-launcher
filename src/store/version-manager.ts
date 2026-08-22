import { atom } from "jotai";
import { unwrap } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithTauriStore } from "@/lib/utils/jotai/tauri-store";
import { listRemote } from "@/lib/version-catalog";
import { oficialRepo } from "./common";

export interface EmulatorVersion {
    path: string;
    repo?: string;
    date?: number;
    version?: string;
    name: string;
    prerelease?: boolean;
}

export type RemoteEmulatorVersion = Omit<EmulatorVersion, "path"> & {
    url: string;
    notSupported?: boolean;
};

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
    }): Promise<RemoteEmulatorVersion[]> => listRemote(list),
}));
