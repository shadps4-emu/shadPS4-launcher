import { useCallback, useEffectEvent, useRef } from "react";

export function useDebounceAction<T extends () => void>(
    delay: number,
    action: T,
) {
    const lastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const actionEvent = useEffectEvent(() => {
        action();
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent is untracked
    return useCallback(() => {
        clearTimeout(lastTimeout.current);
        lastTimeout.current = setTimeout(() => {
            actionEvent();
        }, delay);
    }, [delay]);
}
