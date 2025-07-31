export type Tuple<
    T,
    N extends number,
    R extends T[] = [],
> = N extends R["length"] ? R : Tuple<T, N, [T, ...R]>;

export type Callback<P extends unknown[] = [], R = void> = (...args: P) => R;

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
