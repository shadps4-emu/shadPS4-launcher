export type Tuple<
    T,
    N extends number,
    R extends T[] = [],
> = N extends R["length"] ? R : Tuple<T, N, [T, ...R]>;

export type Callback<P> = (p0: P) => void;
