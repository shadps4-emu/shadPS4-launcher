import { join } from "@tauri-apps/api/path";
import {
    exists,
    mkdir,
    readTextFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import {
    DEFAULT_GLOBAL_INI,
    DEFAULT_INPUT_INI,
    mergeDefaultHotkeys,
    type ParsedInputIni,
    parseInputIni,
    serializeInputIni,
} from "@/lib/input-config";
import { atomEmuUserDir } from "./config";

export type InputConfigFiles = {
    defaultIni: ParsedInputIni;
    globalIni: ParsedInputIni;
};

const atomInputConfigDir = atom(async (get) =>
    join(await get(atomEmuUserDir), "input_config"),
);

const atomDefaultIniPath = atom(async (get) =>
    join(await get(atomInputConfigDir), "default.ini"),
);

const atomGlobalIniPath = atom(async (get) =>
    join(await get(atomInputConfigDir), "global.ini"),
);

const atomInputConfigReload = atom(0);

async function ensureInputConfigDir(dir: string) {
    if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
    }
}

async function readIniFile(path: string, fallback: string): Promise<string> {
    if (!(await exists(path))) {
        return fallback;
    }
    return readTextFile(path);
}

export const atomInputConfigFiles = atom(
    async (get): Promise<InputConfigFiles> => {
        get(atomInputConfigReload);
        const dir = await get(atomInputConfigDir);
        await ensureInputConfigDir(dir);

        const defaultText = await readIniFile(
            await get(atomDefaultIniPath),
            DEFAULT_INPUT_INI,
        );
        const globalText = await readIniFile(
            await get(atomGlobalIniPath),
            DEFAULT_GLOBAL_INI,
        );

        return {
            defaultIni: parseInputIni(defaultText),
            globalIni: mergeDefaultHotkeys(parseInputIni(globalText)),
        };
    },
    async (get, _set, value: InputConfigFiles) => {
        const dir = await get(atomInputConfigDir);
        await ensureInputConfigDir(dir);

        await writeTextFile(
            await get(atomDefaultIniPath),
            serializeInputIni(value.defaultIni),
        );
        await writeTextFile(
            await get(atomGlobalIniPath),
            serializeInputIni(value.globalIni),
        );
    },
);

export function refreshInputConfig(store: {
    set: (
        atom: typeof atomInputConfigReload,
        value: number | ((n: number) => number),
    ) => void;
}) {
    store.set(atomInputConfigReload, (prev) => prev + 1);
}
