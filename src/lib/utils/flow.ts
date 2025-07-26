import { ResultAsync } from "neverthrow";

export function withTimeout<T, E>(
    action: ResultAsync<T, E>,
    ms: number,
    timeoutError: E,
): ResultAsync<T, E> {
    const timedPromise = new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(timeoutError), ms);

        action.then((r) => {
            clearTimeout(timer);
            if (r.isOk()) {
                resolve(r.value);
            } else {
                reject(r.error);
            }
        });
    });

    return ResultAsync.fromPromise(timedPromise, (err) => err as E);
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
