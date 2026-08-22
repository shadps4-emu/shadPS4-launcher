import { ResultAsync } from "neverthrow";
import type { infer as Infer, ZodError, ZodType } from "zod";

export class FetchError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
    ) {
        super(message);
        this.name = "FetchError";
        Object.setPrototypeOf(this, FetchError.prototype);
    }
}

function formatValidationError(error: ZodError): string {
    return error.issues
        .map((issue) => {
            const path =
                issue.path.length > 0
                    ? issue.path.map(String).join(".")
                    : "(root)";
            return `${path}: ${issue.message}`;
        })
        .join("; ");
}

export function fetchSafe(
    input: RequestInfo | URL,
    init?: RequestInit,
): ResultAsync<Response, FetchError> {
    return ResultAsync.fromPromise(
        fetch(input, init).then((res) => {
            if (!res.ok) {
                throw new FetchError(
                    `HTTP ${res.status} ${res.statusText}`,
                    res.status,
                );
            }
            return res;
        }),
        (err) =>
            err instanceof FetchError
                ? err
                : new FetchError(
                      err instanceof Error ? err.message : String(err),
                  ),
    );
}

export function fetchJsonSafe<S extends ZodType>(
    input: RequestInfo | URL,
    schema: S,
    init?: RequestInit,
): ResultAsync<Infer<S>, FetchError> {
    return fetchSafe(input, init).andThen((res) =>
        ResultAsync.fromPromise(
            res.json().then((data: unknown) => {
                const parsed = schema.safeParse(data);
                if (!parsed.success) {
                    throw new FetchError(
                        `Invalid JSON response: ${formatValidationError(parsed.error)}`,
                    );
                }
                return parsed.data;
            }),
            (err) =>
                err instanceof FetchError
                    ? err
                    : new FetchError(
                          err instanceof Error ? err.message : String(err),
                      ),
        ),
    );
}
