import { ResultAsync } from "neverthrow";

export const createAbort = () => {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        abort: () => controller.abort(),
    };
};

export function makeDeferred<
    T = void,
    E = never,
    CB = E extends never ? never : (reason: E) => void,
>(): {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: CB;
    result: ResultAsync<T, E>;
} {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: CB;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej as CB;
    });
    const result = ResultAsync.fromPromise(promise, (err) => err as E);

    return { resolve, reject, result };
}
