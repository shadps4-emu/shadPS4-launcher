import { useEffect } from "react";

export function useDebounceEffect<T>(
    value: T,
    delay: number,
    callback: (debouncedValue: T) => void,
) {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay, callback]);
}
