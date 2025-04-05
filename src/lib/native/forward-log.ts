import {
    attachLogger,
    debug,
    error,
    info,
    trace,
    warn,
} from "@tauri-apps/plugin-log";

function forwardConsole(
    fnName: "log" | "trace" | "debug" | "info" | "warn" | "error",
    logger: (message: string) => Promise<void>,
) {
    const original = console[fnName];
    // biome-ignore lint/suspicious/noExplicitAny: This is the original signature
    console[fnName] = (...data: any[]) => {
        original(...data);
        logger(
            data
                .map((e) => {
                    switch (typeof e) {
                        case "string":
                        case "number":
                        case "bigint":
                        case "boolean":
                        case "function":
                        case "symbol":
                            return String(e);
                        case "object":
                            return JSON.stringify(e);
                        case "undefined":
                            return "undefined";
                    }
                })
                .join(" "),
        );
    };

    return original;
}

export async function setupForwardingConsole() {
    const c = {
        log: forwardConsole("log", info),
        trace: forwardConsole("trace", trace),
        debug: forwardConsole("debug", debug),
        info: forwardConsole("info", info),
        warn: forwardConsole("warn", warn),
        error: forwardConsole("error", error),
    } as const;

    window.addEventListener("error", (event) => {
        const message =
            event.error instanceof Error
                ? event.error.stack || event.error
                : event.error;

        error(message);
    });

    window.addEventListener("unhandledrejection", (event) => {
        const message =
            event.reason instanceof Error
                ? `Uncaught (in promise) ${event.reason.stack || event.reason}`
                : `Uncaught (in promise) ${event.reason}`;

        error(message);
    });

    await attachLogger(({ level, message }) => {
        if (message.includes("[webview:console.<computed>")) {
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
