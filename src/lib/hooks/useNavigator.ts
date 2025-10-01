import type React from "react";
import { useCallback, useContext } from "react";
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

    return {
        ...ctx,
        popModal,
        pushModal,
    };
}
