import { listen } from "@tauri-apps/api/event";
import { appDataDir, dirname, join } from "@tauri-apps/api/path";
import {
    exists,
    mkdir,
    readTextFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import toml from "smol-toml";
import { defaultStore, type JotaiStore } from ".";

const atomUserConfigLocation = atom(async () => {
    return await join(await appDataDir(), "emu_data", "user", "config.toml");
});

const atomUserConfigReload = atom(0);
export const atomUserConfig = atom(
    async (get) => {
        get(atomUserConfigReload);

        const f = await get(atomUserConfigLocation);
        if (!(await exists(f))) {
            return null;
        }
        const data = await readTextFile(f);
        return toml.parse(data);
    },
    async (get, _set, value: ReturnType<typeof toml.parse>) => {
        const f = await get(atomUserConfigLocation);
        const data = toml.stringify(value);
        const base = await dirname(f);
        if (!(await exists(base))) {
            await mkdir(base, { recursive: true });
        }
        await writeTextFile(f, data);
    },
);

export function refreshUserConfig(s: JotaiStore) {
    s.set(atomUserConfigReload, (prev) => prev + 1);
}

listen("reload-user-config", () => {
    refreshUserConfig(defaultStore);
});
