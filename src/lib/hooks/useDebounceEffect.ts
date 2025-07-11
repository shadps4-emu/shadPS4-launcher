import { useEffect } from "react";

export function useDebounceEffect<T extends unknown | unknown[]>(
    value: T,
    delay: number,
    callback: (debouncedValue: T) => void,
) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: Linter false positive
    useEffect(() => {
        const handler = setTimeout(() => {
            callback(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [delay, callback, ...(Array.isArray(value) ? value : [value])]);
}
