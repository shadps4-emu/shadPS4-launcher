import { type Err, err } from "neverthrow";

export function stringifyError(e: unknown): string {
    if (typeof e === "string") {
        return e;
    }
    if (e !== null && typeof e === "object" && "message" in e) {
        const msg = e.message;
        if (typeof msg === "string") {
            return msg;
        } else if (typeof msg === "number" || typeof msg === "boolean") {
            return String(msg);
        }
        return JSON.stringify(msg);
    }

    return JSON.stringify(e);
}

// This is for Warning propagation instead of error
export class WarningError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WarningError";
        Object.setPrototypeOf(this, WarningError.prototype);
    }
}

export function errWarning(message: string): Err<never, WarningError> {
    return err(new WarningError(message));
}
