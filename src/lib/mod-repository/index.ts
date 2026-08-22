import { join } from "@tauri-apps/api/path";
import { exists, mkdir, readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { errAsync, ok, ResultAsync, safeTry } from "neverthrow";
import { toast } from "sonner";
import { fetchJsonSafe, fetchSafe } from "@/lib/nt/fetch";
import { stringifyError } from "@/lib/utils/error";
import type { JotaiStore } from "@/store";
import {
    atomAvailablePatches,
    atomCheatsEnabled,
    type CheatFileFormat,
    type CheatFileMod,
    type CheatRepository,
    type PatchList,
    type PatchRepository,
} from "@/store/cheats-and-patches";
import type { CUSA, CUSAVersion } from "@/store/common";
import { atomDownloadingOverlay } from "@/store/common";
import { atomCheatPath, atomPatchPath } from "@/store/paths";
import { githubContentListSchema } from "./schemas";

const patchRepoUrls: Record<PatchRepository, string> = {
    GoldHEN:
        "https://api.github.com/repos/illusion0001/PS4-PS5-Game-Patch/contents/patches/xml",
    shadPS4:
        "https://api.github.com/repos/shadps4-emu/ps4_cheats/contents/PATCHES",
};

const cheatRepoConfig: Record<
    CheatRepository,
    { indexUrl: string; fileUrl: (name: string) => string }
> = {
    GoldHEN: {
        indexUrl:
            "https://raw.githubusercontent.com/GoldHEN/GoldHEN_Cheat_Repository/main/json.txt",
        fileUrl: (name) =>
            `https://raw.githubusercontent.com/GoldHEN/GoldHEN_Cheat_Repository/main/json/${name}`,
    },
    shadPS4: {
        indexUrl:
            "https://raw.githubusercontent.com/shadps4-emu/ps4_cheats/main/CHEATS_JSON.txt",
        fileUrl: (name) =>
            `https://raw.githubusercontent.com/shadps4-emu/ps4_cheats/main/CHEATS/${name}`,
    },
};

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

export async function syncPatches(
    repo: PatchRepository,
    store: JotaiStore,
): Promise<void> {
    try {
        const patchPath = await join(await store.get(atomPatchPath), repo);
        await mkdir(patchPath, { recursive: true });

        store.set(atomDownloadingOverlay, {
            message: "Downloading patches",
            progress: "infinity",
        });

        const data = (
            await fetchJsonSafe(patchRepoUrls[repo], githubContentListSchema)
        ).match(
            (entries) => entries,
            (err) => {
                throw err;
            },
        );

        const downloadResults = data.map((entry) =>
            ResultAsync.fromPromise(
                (async () => {
                    const r = await fetchSafe(entry.download_url);
                    const text = await r.match(
                        (res) => res.text(),
                        (err) => {
                            throw err;
                        },
                    );
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, "text/xml");
                    const titleList = xmlDoc.querySelector("TitleID");
                    if (!titleList) {
                        throw new Error("invalid patch file");
                    }
                    const cusaList: string[] = [];
                    for (const el of titleList.children) {
                        if (el.innerHTML) {
                            cusaList.push(el.innerHTML);
                        }
                    }
                    return { ...entry, value: text, cusaList };
                })(),
                (error) => error,
            ).orElse((error) => ok({ ...entry, error })),
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
            await writeFile(savePath, new TextEncoder().encode(entry.value), {
                create: true,
            });
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

export function syncCheats(repo: CheatRepository, store: JotaiStore) {
    const config = cheatRepoConfig[repo];
    return safeTry(async function* () {
        const cheatPath = yield* await ResultAsync.fromSafePromise(
            store.get(atomCheatPath),
        ).map((e) => join(e, repo));
        await mkdir(cheatPath, { recursive: true });

        store.set(atomDownloadingOverlay, {
            message: "Downloading cheats",
            progress: "infinity",
        });

        const data = yield* await fetchSafe(config.indexUrl).map((e) =>
            e.text(),
        );
        const lineList = data.split("\n");

        yield* await ResultAsync.combine(
            lineList
                .filter((e) => Boolean(e))
                .map((line) => {
                    const [key] = line.trim().split("=", 1);
                    if (!key) {
                        return errAsync(`invalid key line: ${line}`);
                    }
                    return fetchSafe(config.fileUrl(key))
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

export async function resolveMods(
    gameKey: CUSAVersion,
    store: JotaiStore,
): Promise<CheatFileMod[]> {
    const cheatFolderPath = await store.get(atomCheatPath);
    const enabledCheats = store.get(atomCheatsEnabled)[gameKey];
    if (!enabledCheats) {
        return [];
    }

    const mods: CheatFileMod[] = [];
    for (const [repo, enabledMods] of Object.entries(enabledCheats)) {
        const cheatFilePath = await join(
            cheatFolderPath,
            repo,
            `${gameKey}.json`,
        );
        if (!(await exists(cheatFilePath))) {
            continue;
        }
        const cheatFile = JSON.parse(
            await readTextFile(cheatFilePath),
        ) as CheatFileFormat;
        for (const mod of cheatFile.mods) {
            if (enabledMods.includes(mod.name)) {
                mods.push(mod);
            }
        }
    }
    return mods;
}
