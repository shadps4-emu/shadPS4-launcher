import { Store } from "@tauri-apps/plugin-store";
import cloneDeep from "clone-deep";
import { atom } from "jotai";
import type { Callback } from "../types";

const __store = new Map<string, Promise<Store>>();

function getStore(path: string): Promise<Store> {
    let s = __store.get(path);
    if (s) {
        return s;
    }
    s = Store.load(path, { autoSave: true });
    __store.set(path, s);
    return s;
}

/**
 * This uses config store underlying. This is not safe to read directly from store,
 * as the value prob will not be available in the first read
 */
export function atomWithTauriStore<T>(
    path: string,
    key: string,
    props: {
        initialValue: T;
        queryInitialValue?: () => Promise<T> | T;
        doNotCopy?: boolean;
    },
) {
    let initialValue = props.initialValue;

    let deferSet: Callback<[T]>[] | null = [];
    let onInitCallback: Callback[] | null = [];

    void getStore(path)
        .then((store) => store.get<T>(key))
        .then((e) => {
            if (e) {
                initialValue = e;
                deferSet?.forEach((c) => c(props.doNotCopy ? e : cloneDeep(e)));
                deferSet = null;
                onInitCallback?.forEach((c) => c());
                onInitCallback = null;
            } else if (
                "queryInitialValue" in props &&
                props.queryInitialValue
            ) {
                void Promise.resolve(props.queryInitialValue()).then((e) => {
                    initialValue = e;
                    onInitCallback?.forEach((c) => c());
                    onInitCallback = null;
                });
            } else {
                if (!("initialValue" in props)) {
                    throw new Error(
                        "Unexpected state. Prop don't have initial neither query function",
                    );
                }
                onInitCallback?.forEach((c) => c());
                onInitCallback = null;
            }
        });

    const getInitialValue = () => {
        if (initialValue === null) {
            throw new Error("initial value did not initialize");
        }
        return <T>(props.doNotCopy ? initialValue : cloneDeep(initialValue));
    };

    const baseAtom = atom(initialValue);
    baseAtom.onMount = (setAtom) => {
        setAtom(getInitialValue());
        if (deferSet) {
            deferSet.push(setAtom);
        }
    };

    const atomValue = atom<T, [T | Callback<[T], T>], void>(
        (get) => get(baseAtom) ?? getInitialValue(),
        (get, set, update) => {
            const newValue =
                typeof update === "function"
                    ? (update as Callback<[T], T>)(get(baseAtom))
                    : update;

            initialValue = newValue;
            set(baseAtom, newValue);
            void getStore(path).then((store) => void store.set(key, newValue));
        },
    );
    return {
        ...atomValue,
        addOnInit: (c: Callback) => {
            if (onInitCallback) {
                onInitCallback.push(c);
            } else {
                c();
            }
        },
    };
}
