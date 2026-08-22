import { listen } from "@tauri-apps/api/event";
import { appDataDir, dirname, join } from "@tauri-apps/api/path";
import {
    exists,
    mkdir,
    readTextFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import {
    type EmulatorConfig,
    mergeEmulatorConfigForSave,
    parseEmulatorConfig,
    type ResolvedEmulatorConfig,
    resolveEmulatorConfig,
} from "@/lib/emulator-config";
import { defaultStore, type JotaiStore } from ".";
import { atomEmuUserPath } from "./paths";
import { atomSelectedVersion } from "./version-manager";

/**
 * Resolve `<UserDir>` for emulator settings.
 * Matches launch: workDir/user where workDir is atomEmuUserPath or emu binary dir.
 */
export const atomEmuUserDir = atom(async (get) => {
    const userBase = get(atomEmuUserPath);
    if (userBase === true) {
        const emu = get(atomSelectedVersion)?.path;
        if (!emu) {
            return join(await appDataDir(), "emu_data", "user");
        }
        return join(await dirname(emu), "user");
    }
    if (typeof userBase === "string" && userBase.length > 0) {
        return join(userBase, "user");
    }
    return join(await appDataDir(), "emu_data", "user");
});

const atomUserConfigLocation = atom(async (get) => {
    return join(await get(atomEmuUserDir), "config.json");
});

const atomUserConfigReload = atom(0);

/** Raw document from disk (null if missing). Unknown keys preserved. */
export const atomUserConfigRaw = atom(async (get) => {
    get(atomUserConfigReload);
    const f = await get(atomUserConfigLocation);
    if (!(await exists(f))) {
        return null;
    }
    const text = await readTextFile(f);
    let json: unknown;
    try {
        json = JSON.parse(text);
    } catch {
        console.error("Failed to parse emulator config.json", f);
        return null;
    }
    try {
        return parseEmulatorConfig(json);
    } catch (e) {
        console.error("Invalid emulator config.json shape", e);
        return null;
    }
});

/** Resolved settings with factory defaults filled in for the UI. */
export const atomUserConfig = atom(
    async (get): Promise<ResolvedEmulatorConfig> => {
        return resolveEmulatorConfig(await get(atomUserConfigRaw));
    },
    async (get, _set, value: ResolvedEmulatorConfig) => {
        const f = await get(atomUserConfigLocation);
        const previous = await get(atomUserConfigRaw);
        const merged = mergeEmulatorConfigForSave(previous, value);
        const base = await dirname(f);
        if (!(await exists(base))) {
            await mkdir(base, { recursive: true });
        }
        await writeTextFile(f, `${JSON.stringify(merged, null, 2)}\n`);
    },
);

export type { EmulatorConfig, ResolvedEmulatorConfig };

export function refreshUserConfig(s: JotaiStore) {
    s.set(atomUserConfigReload, (prev) => prev + 1);
}

listen("reload-user-config", () => {
    refreshUserConfig(defaultStore);
});
