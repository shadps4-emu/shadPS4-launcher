import { useCallback } from "react";

export function useFocus(globalFilter?: (element: HTMLElement) => boolean) {
    const getElements = useCallback(
        (
            filter:
                | ((element: HTMLElement) => boolean)
                | undefined = globalFilter,
        ) => {
            const elements = Array.from<HTMLElement>(
                document.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                ),
            );

            if (filter) {
                return elements.filter(filter);
            }

            return elements;
        },
        [globalFilter],
    );

    const focusNext = useCallback(() => {
        const elements = getElements();
        if (!document.activeElement) {
            elements[0]?.focus();
            return;
        }

        const currentIndex = elements.indexOf(
            document.activeElement as HTMLElement,
        );
        if (currentIndex !== -1 && currentIndex < elements.length - 1) {
            elements[currentIndex + 1]?.focus();
        }
    }, [getElements]);

    const focusPrevious = useCallback(() => {
        const elements = getElements();
        if (!document.activeElement) {
            elements[elements.length - 1]?.focus();
            return;
        }

        const currentIndex = elements.indexOf(
            document.activeElement as HTMLElement,
        );
        if (currentIndex !== -1 && currentIndex > 0) {
            elements[currentIndex - 1]?.focus();
        }
    }, [getElements]);

    return { getElements, next: focusNext, previous: focusPrevious };
}
