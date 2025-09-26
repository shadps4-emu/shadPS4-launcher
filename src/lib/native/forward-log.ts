import {
    attachLogger,
    debug,
    error,
    info,
    type LogOptions,
    trace,
    warn,
} from "@tauri-apps/plugin-log";
import { format } from "date-fns";
import ErrorStackParser from "error-stack-parser";

function forwardConsole(
    fnName: "log" | "trace" | "debug" | "info" | "warn" | "error",
    logger: (message: string, options?: LogOptions) => Promise<void>,
    level: string,
) {
    const original = console[fnName];
    // biome-ignore lint/suspicious/noExplicitAny: This is the original signature
    console[fnName] = function (...data: any[]) {
        let callFrame: ErrorStackParser.StackFrame | undefined = undefined;
        try {
            callFrame = ErrorStackParser.parse(new Error())?.[1];
        } catch (_e) {
            void 0;
        }
        const now = new Date();
        let prefix = "";
        prefix += `${format(now, "[y-MM-dd][HH:mm:ss]")}`;
        prefix += `[${level}]`;
        prefix += callFrame?.fileName
            ? `[webview ${callFrame.fileName}:${callFrame.lineNumber}:${callFrame.columnNumber}]`
            : "[webview]";
        prefix += "\n";

        if (typeof data?.[0] === "string") {
            original(prefix + data[0], ...data.slice(1));
        } else {
            original(prefix, ...data);
        }

        let opts: LogOptions | undefined;
        if (callFrame) {
            opts = {
                file: callFrame.fileName?.replace(
                    /^(http|tauri):\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?/,
                    "",
                ),
                line: callFrame.lineNumber,
                keyValues: {
                    column: callFrame.columnNumber?.toString(),
                },
            };
        }

        logger(
            data
                .map((e, i) => {
                    if (e instanceof Error) {
                        return (
                            (i > 0 ? "\n" : "") +
                            (e.stack || `${e.name}: ${e.message}`)
                        );
                    }
                    switch (typeof e) {
                        case "string":
                        case "number":
                        case "bigint":
                        case "boolean":
                        case "function":
                        case "symbol":
                            return String(e);
                        case "object":
                            try {
                                return JSON.stringify(e);
                            } catch (_e) {
                                return "[object Object]";
                            }
                        case "undefined":
                            return "undefined";
                    }
                })
                .join(" "),
            opts,
        );
    };

    return original;
}

export async function setupForwardingConsole() {
    const c = {
        log: forwardConsole("log", info, "INFO"),
        trace: forwardConsole("trace", trace, "TRACE"),
        debug: forwardConsole("debug", debug, "DEBUG"),
        info: forwardConsole("info", info, "INFO"),
        warn: forwardConsole("warn", warn, "WARN"),
        error: forwardConsole("error", error, "ERROR"),
    } as const;

    window.addEventListener("error", (event) => {
        const message =
            event.error instanceof Error
                ? event.error.stack || event.error
                : event.error || event.message;

        error(message);
        c.error(event.error);
    });

    window.addEventListener("unhandledrejection", (event) => {
        const message =
            event.reason instanceof Error
                ? `Uncaught (in promise) ${event.reason.stack || event.reason}`
                : `Uncaught (in promise) ${event.reason}`;

        error(message);
        c.error(event.reason);
    });

    await attachLogger(({ level, message }) => {
        if (message.includes("][webview")) {
            return;
        }
        switch (level) {
            case 1: // LogLevel.Trace
                c.log(message);
                break;
            case 2: // LogLevel.Debug
                c.debug(message);
                break;
            case 3: // LogLevel.Info:
                c.info(message);
                break;
            case 4: // LogLevel.Warn
                c.warn(message);
                break;
            case 5: // LogLevel.Error
                c.error(message);
                break;
            default:
                throw new Error(`unknown log level ${level}`);
        }
    });
}
