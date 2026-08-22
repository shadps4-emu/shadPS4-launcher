import type React from "react";
import { useCallback, useContext } from "react";
import {
    isWindowableModalId,
    type ModalId,
    type ModalParamsById,
    type OpenModalRequest,
    openModalWindow,
    renderModal,
} from "@/lib/modals";
import { NavigatorProvider } from "../context/navigator-provider";

export function useNavigator() {
    const ctx = useContext(NavigatorProvider.Context);
    if (!ctx) {
        throw new Error("Missing Navigator provider");
    }

    const popModal = useCallback(() => {
        ctx.dispatch({
            op: "pop_modal",
        });
    }, [ctx.dispatch]);

    const pushModal = useCallback(
        (el: React.ReactNode) => {
            ctx.dispatch({
                op: "push_modal",
                el,
            });
        },
        [ctx.dispatch],
    );

    const openModal = useCallback(
        <I extends ModalId>(request: OpenModalRequest<I>) => {
            const mode = request.mode ?? "panel";
            const params = (
                "params" in request ? request.params : undefined
            ) as ModalParamsById[I];

            if (mode === "window" && isWindowableModalId(request.id)) {
                void openModalWindow(
                    request.id,
                    params as ModalParamsById[typeof request.id],
                );
                return;
            }

            pushModal(renderModal(request.id, params));
        },
        [pushModal],
    );

    return {
        ...ctx,
        popModal,
        pushModal,
        openModal,
    };
}
