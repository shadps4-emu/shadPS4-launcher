import type React from "react";
import {
    createContext,
    type PropsWithChildren,
    type ReactNode,
    useReducer,
} from "react";

export type NavigatorState = {
    modalStack: ReactNode[];
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
                        modalStack: [...state.modalStack, arg.el],
                    };
                }
                case "pop_modal": {
                    return {
                        ...state,
                        modalStack: state.modalStack.slice(0, -1),
                    };
                }
                case "replace_modal": {
                    return {
                        ...state,
                        modalStack: [...state.modalStack.slice(0, -1), arg.el],
                    };
                }
                default: {
                    const r: never = op;
                    return r;
                }
            }
        },
        {
            modalStack: [],
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
