import { ResultAsync } from "neverthrow";

export class TimeoutError extends Error {
    constructor(timeout: number) {
        super(`Operation timed out after ${timeout}ms`);
        this.name = "TimeoutError";
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}

/**
 * Races `ra` against a timeout of `ms` milliseconds.
 * - If `ra` yields `Ok`, you get that value.
 * - If `ra` yields `Err`, you get its error.
 * - If the timer fires first, you get `Err(TimeoutError)`.
 */
export function withTimeout<T, E extends Error>(
    ra: ResultAsync<T, E>,
    ms: number,
): ResultAsync<T, E | TimeoutError> {
    const originalPromise: PromiseLike<T> = ra.then((result) => {
        if (result.isOk()) {
            return result.value;
        }
        throw result.error;
    });
    // A promise that rejects with TimeoutError after `ms`
    const timeoutPromise = new Promise<T>((_, rej) =>
        setTimeout(() => rej(new TimeoutError(ms)), ms),
    );

    const raced = Promise.race([originalPromise, timeoutPromise]);
    // Wrap back into a ResultAsync, unioning the error types
    return ResultAsync.fromPromise<T, E | TimeoutError>(
        raced,
        (err: unknown) =>
            err instanceof Error
                ? (err as E | TimeoutError)
                : new TimeoutError(ms),
    );
}
