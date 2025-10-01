import type React from "react";
import {
    createContext,
    type PropsWithChildren,
    type ReactNode,
    useReducer,
} from "react";

export type NavigatorState = {
    openModals: ReactNode[];
};

export type NavigatorContext = NavigatorState & {
    dispatch: React.Dispatch<Operation>;
};

type Operation =
    | {
          op: "push_modal";
          el: ReactNode;
      }
    | {
          op: "pop_modal";
      }
    | {
          op: "replace_modal";
          el: ReactNode;
      };

const context = createContext<NavigatorContext | null>(null);

export function NavigatorProvider({ children }: PropsWithChildren) {
    const [state, dispatch] = useReducer<NavigatorState, [Operation]>(
        (state, arg) => {
            const op = arg.op;
            switch (op) {
                case "push_modal": {
                    return {
                        ...state,
                        openModals: [...state.openModals, arg.el],
                    };
                }
                case "pop_modal": {
                    return {
                        ...state,
                        openModals:
                            state.openModals.length === 0
                                ? []
                                : state.openModals.slice(0, -1),
                    };
                }
                case "replace_modal": {
                    return {
                        ...state,
                        openModals:
                            state.openModals.length === 0
                                ? [arg.el]
                                : [state.openModals.slice(0, -1), arg.el],
                    };
                }
                default: {
                    const r: never = op;
                    return r;
                }
            }
        },
        {
            openModals: [],
        },
    );

    return (
        <context.Provider
            value={{
                ...state,
                dispatch,
            }}
        >
            {children}
        </context.Provider>
    );
}

NavigatorProvider.Context = context;
