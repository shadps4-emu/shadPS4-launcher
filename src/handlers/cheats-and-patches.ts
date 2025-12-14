import { join } from "@tauri-apps/api/path";
import { mkdir, readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { errAsync, ok, ResultAsync, safeTry } from "neverthrow";
import { toast } from "sonner";
import { fetchSafe } from "@/lib/nt/fetch";
import { stringifyError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import {
    atomAvailablePatches,
    type CheatRepository,
    type PatchList,
    type PatchRepository,
} from "@/store/cheats-and-patches";
import { atomDownloadingOverlay, type CUSA } from "@/store/common";
import { atomCheatPath, atomPatchPath } from "@/store/paths";

export async function downloadPatches(
    repo: PatchRepository,
    store: JotaiStore,
): Promise<void> {
    try {
        const patchPath = await join(await store.get(atomPatchPath), repo);
        await mkdir(patchPath, { recursive: true });

        let url: string;
        if (repo === "GoldHEN") {
            url =
                "https://api.github.com/repos/illusion0001/PS4-PS5-Game-Patch/contents/patches/xml";
        } else if (repo === "shadPS4") {
            url =
                "https://api.github.com/repos/shadps4-emu/ps4_cheats/contents/PATCHES";
        } else {
            const r: never = repo;
            return r;
        }
        const response = await fetch(url);
        const data: {
            name: string;
            download_url: string;
        }[] = await response.json();

        store.set(atomDownloadingOverlay, {
            message: "Downloading patches",
            progress: "infinity",
        });

        const downloadResults = data.map((entry) =>
            ResultAsync.fromPromise(
                (async () => {
                    const r = await fetch(entry.download_url);
                    const data = await r.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data, "text/xml");
                    const titleList = xmlDoc.querySelector("TitleID");
                    if (!titleList) {
                        throw new Error("invalid patch file");
                    }
                    const cusaList = [];
                    for (const el of titleList.children) {
                        if (el.innerHTML) {
                            cusaList.push(el.innerHTML);
                        }
                    }

                    return {
                        ...entry,
                        value: data,
                        cusaList,
                    };
                })(),
                (error) => error,
            ).orElse((error) =>
                ok({
                    ...entry,
                    error,
                }),
            ),
        );

        const patchList = await ResultAsync.combine(downloadResults);

        if (patchList.isErr()) {
            return;
        }
        const patchMapping: PatchList = {};
        for (const entry of patchList.value) {
            if ("error" in entry) {
                const msg = `Could not download the patch ${entry.name}`;
                console.error(msg, entry.error);
                toast.error(`${msg}. ${stringifyError(entry.error)}`);
                continue;
            }

            const savePath = await join(patchPath, entry.name);
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(entry.value);
            await writeFile(savePath, encodedData, { create: true });
            for (const cusa of entry.cusaList) {
                patchMapping[cusa as CUSA] = entry.name;
            }
        }
        store.set(atomAvailablePatches, (prev) => ({
            ...prev,
            [repo]: patchMapping,
        }));
    } catch (e) {
        const msg = `Error downloading Patches from ${repo}`;
        console.error(msg, e);
        toast.error(`${msg}. ${stringifyError(e)}`);
    } finally {
        store.set(atomDownloadingOverlay, null);
    }
}

export type PatchLine = {
    idx: number;
    el: Element;
    name: string;
    author: string;
    version: string;
    gameVersion: string;
    isEnabled: boolean;
};

export class PatchFile {
    private path: string;
    private root: Document;
    private modified = false;

    private constructor(path: string, root: Document) {
        this.path = path;
        this.root = root;
    }

    static async parsePatchFile(path: string): Promise<PatchFile> {
        const parser = new DOMParser();
        const root = parser.parseFromString(
            await readTextFile(path),
            "text/xml",
        );
        return new PatchFile(path, root);
    }

    getPatchLines(): PatchLine[] {
        const metadataList = this.root.querySelectorAll("Metadata");
        return Array.from(metadataList).map((e, idx) => ({
            idx,
            el: e,
            name: e.getAttribute("Name") ?? "UNK",
            author: e.getAttribute("Author") ?? "UNK",
            version: e.getAttribute("PatchVer") ?? "UNK",
            gameVersion: e.getAttribute("AppVer") ?? "UNK",
            isEnabled: e.getAttribute("isEnabled") === "true",
        }));
    }

    setPatchLineEnabled(
        patchLine: PatchLine,
        enabled: boolean,
    ): PatchLine | null {
        const el = patchLine.el;
        if (el.getAttribute("isEnabled") === String(enabled)) {
            return null;
        }
        el.setAttribute("isEnabled", String(enabled));
        this.modified = true;
        return {
            ...patchLine,
            isEnabled: enabled,
        };
    }

    async save(): Promise<boolean> {
        if (!this.modified) {
            return false;
        }
        this.modified = false;
        const encoder = new TextEncoder();
        const xmlString = new XMLSerializer().serializeToString(this.root);
        const encodedData = encoder.encode(xmlString);
        await writeFile(this.path, encodedData, { create: true });
        return true;
    }
}

export function downloadCheats(repo: CheatRepository, store: JotaiStore) {
    return safeTry(async function* () {
        const cheatPath = yield* await ResultAsync.fromSafePromise(
            store.get(atomCheatPath),
        ).map((e) => join(e, repo));
        await mkdir(cheatPath, { recursive: true });

        store.set(atomDownloadingOverlay, {
            message: "Downloading cheats",
            progress: "infinity",
        });

        let url: string;
        let createUrl: (name: string) => string;
        if (repo === "GoldHEN") {
            url =
                "https://raw.githubusercontent.com/GoldHEN/GoldHEN_Cheat_Repository/main/json.txt";
            createUrl = (name) =>
                `https://raw.githubusercontent.com/GoldHEN/GoldHEN_Cheat_Repository/main/json/${name}`;
        } else if (repo === "shadPS4") {
            url =
                "https://raw.githubusercontent.com/shadps4-emu/ps4_cheats/main/CHEATS_JSON.txt";
            createUrl = (name) =>
                `https://raw.githubusercontent.com/shadps4-emu/ps4_cheats/main/CHEATS/${name}`;
        } else {
            const r: never = repo;
            return r;
        }

        const data = yield* await fetchSafe(url).map((e) => e.text());
        const lineList = data.split("\n");

        await ResultAsync.combine(
            lineList
                .filter((e) => Boolean(e))
                .map((line) => {
                    const [key] = line.trim().split("=", 1);
                    if (!key) {
                        return errAsync(`invalid key line: ${line}`);
                    }
                    return fetchSafe(createUrl(key))
                        .map((e) => e.arrayBuffer())
                        .map(async (modData) => {
                            const path = await join(cheatPath, key);
                            await writeFile(path, new Uint8Array(modData), {
                                create: true,
                            });
                        });
                }),
        );

        store.set(atomDownloadingOverlay, null);
        return ok();
    })
        .andTee(() => {
            store.set(atomDownloadingOverlay, null);
        })
        .orTee((err) => {
            store.set(atomDownloadingOverlay, null);
            const msg = `Error downloading Cheats from ${repo}`;
            console.error(msg, err);
            toast.error(`${msg}. ${stringifyError(err)}`);
        });
}
