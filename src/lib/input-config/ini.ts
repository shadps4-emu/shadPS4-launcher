import { DEFAULT_HOTKEYS } from "./defaults";
import {
    type BindingInputs,
    type InputBindingEntry,
    type ParsedInputIni,
    SPECIAL_CONFIG_KEYS,
} from "./schema";

function stripInlineWhitespace(line: string): string {
    return line.replace(/\s/g, "");
}

function parseBindingValue(raw: string): BindingInputs {
    const parts = raw.split(",").filter(Boolean);
    return [parts[0] ?? "", parts[1], parts[2]];
}

export function emptyParsedInputIni(): ParsedInputIni {
    return {
        preamble: [],
        bindings: {},
        specials: {},
        extras: [],
    };
}

export function parseInputIni(text: string): ParsedInputIni {
    const result = emptyParsedInputIni();
    let sawBinding = false;

    for (const rawLine of text.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            if (!sawBinding) {
                result.preamble.push(rawLine);
            } else {
                result.extras.push(rawLine);
            }
            continue;
        }

        const compact = stripInlineWhitespace(rawLine);
        const eq = compact.indexOf("=");
        if (eq === -1) {
            result.extras.push(rawLine);
            continue;
        }

        const output = compact.slice(0, eq);
        const value = compact.slice(eq + 1);
        sawBinding = true;

        if (SPECIAL_CONFIG_KEYS.has(output)) {
            result.specials[output] = value;
            continue;
        }

        const entry: InputBindingEntry = { inputs: parseBindingValue(value) };
        result.bindings[output] ??= [];
        result.bindings[output].push(entry);
    }

    return result;
}

export function mergeDefaultHotkeys(parsed: ParsedInputIni): ParsedInputIni {
    const next = structuredClone(parsed);
    for (const [key, value] of Object.entries(DEFAULT_HOTKEYS)) {
        if (!(key in next.specials)) {
            next.specials[key] = value;
        }
    }
    return next;
}

function serializeBindingLine(output: string, inputs: BindingInputs): string {
    const parts = inputs.filter(Boolean);
    return `${output} = ${parts.join(", ")}`;
}

export function serializeInputIni(parsed: ParsedInputIni): string {
    const lines: string[] = [...parsed.preamble];

    const outputs = Object.keys(parsed.bindings).sort();
    for (const output of outputs) {
        for (const entry of parsed.bindings[output] ?? []) {
            if (entry.inputs.some(Boolean)) {
                lines.push(serializeBindingLine(output, entry.inputs));
            }
        }
    }

    const specialKeys = Object.keys(parsed.specials).sort();
    for (const key of specialKeys) {
        lines.push(`${key} = ${parsed.specials[key]}`);
    }

    if (parsed.extras.length > 0) {
        if (lines.length > 0) {
            lines.push("");
        }
        lines.push(...parsed.extras);
    }

    return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export function bindingKey(output: string, index: number): string {
    return `${output}#${index}`;
}
