import SuperJSON from "superjson";
import type { ModalId, ModalParamsById, WindowableModalId } from "./types";
import { isWindowableModalId } from "./types";

const MODAL_QUERY = "modal";
const PARAMS_QUERY = "mparams";

export type ModalWindowRoute<I extends WindowableModalId = WindowableModalId> =
    {
        id: I;
        params: ModalParamsById[I];
    };

/** Build the URL path (+ query) for a dedicated modal window. */
export function encodeModalWindowUrl<I extends WindowableModalId>(
    id: I,
    params: ModalParamsById[I],
): string {
    const search = new URLSearchParams();
    search.set(MODAL_QUERY, id);
    if (params !== undefined) {
        search.set(PARAMS_QUERY, SuperJSON.stringify(params));
    }
    return `/?${search.toString()}`;
}

/**
 * Parse modal window route from the current location.
 * Returns null when this webview should show the main app.
 */
export function parseModalWindowRoute(
    search: string = window.location.search,
): ModalWindowRoute | null {
    const params = new URLSearchParams(search);
    const id = params.get(MODAL_QUERY);
    if (!id || !isWindowableModalId(id as ModalId)) {
        return null;
    }

    const raw = params.get(PARAMS_QUERY);
    if (raw == null) {
        return { id, params: undefined } as ModalWindowRoute;
    }

    try {
        const parsed: unknown = SuperJSON.parse(raw);
        return { id, params: parsed } as ModalWindowRoute;
    } catch {
        console.error("Failed to parse modal window params", id);
        return null;
    }
}
