type Success<T> = {
    data: T;
    error: null;
};

type Failure<E> = {
    data: null;
    error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
    call: Promise<T> | (() => Promise<T> | T),
): Promise<Result<T, E>> {
    try {
        const data = await (typeof call === "function" ? call() : call);
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as E };
    }
}

export function timeout<T, E = Error>(
    call: Promise<T> | (() => Promise<T> | T),
    ms: number,
    timeoutError: E,
): Promise<T> {
    const promise = typeof call === "function" ? call() : call;
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => reject(timeoutError), ms);
        }),
    ]);
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
