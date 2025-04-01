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
