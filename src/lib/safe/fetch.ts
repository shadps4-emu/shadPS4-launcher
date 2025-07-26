import { ResultAsync } from "neverthrow";

export class FetchError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
    ) {
        super(message);
        Object.setPrototypeOf(this, FetchError.prototype);
    }
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

export function fetchJsonSafe<T>(
    input: RequestInfo | URL,
    init?: RequestInit,
): ResultAsync<T, FetchError> {
    return fetchSafe(input, init).andThen((res) =>
        ResultAsync.fromPromise(res.json() as Promise<T>, (err) =>
            err instanceof FetchError
                ? err
                : new FetchError(
                      err instanceof Error ? err.message : String(err),
                  ),
        ),
    );
}
