import { Store } from "@tauri-apps/plugin-store";
import fastDeepEqual from "fast-deep-equal";
import { atom, type WritableAtom } from "jotai";
import type { Callback } from "../types";

type TauriStoreAtom<T> = WritableAtom<
    Readonly<T>,
    [T | Callback<[T], T>],
    void
> & {
    get: () => T;
    // Return Unsub callback
    listen(c: Callback<[T]>): Callback;
    refresh(): Promise<void>;
    isLoading(): boolean;
    loading(): Promise<T>;
};

const __store = new Map<string, Promise<Store>>();
// biome-ignore lint/suspicious/noExplicitAny: Generic atom
const atomCache = new Map<string, TauriStoreAtom<any>>();

function getStore(path: string): Promise<Store> {
    let s = __store.get(path);
    if (s) {
        return s;
    }
    s = Store.load(path, { autoSave: true });
    __store.set(path, s);
    return s;
}

export function atomWithTauriStore<T>(
    path: string,
    key: string,
    props: {
        initialValue: T;
        queryInitialValue?: () => Promise<T> | T;
    },
): TauriStoreAtom<T> {
    const cacheKey = path + key;
    if (atomCache.has(cacheKey)) {
        return atomCache.get(cacheKey) as TauriStoreAtom<T>;
    }

    let value = props.initialValue;

    let isLoading = false;
    let loadingResolve: Callback<[T]>;
    let loadingProm = new Promise<T>((resolve) => {
        loadingResolve = resolve;
    });

    const listening: Callback<[T]>[] = [];
    const deferSet: Callback<[number]>[] = [];

    let isBroadcasting = false;
    const broadcastValue = () => {
        if (isBroadcasting) {
            return;
        }
        isBroadcasting = true;
        for (const c of listening) {
            c(value);
        }
        const n = (Math.random() * Number.MAX_SAFE_INTEGER) | 0;
        for (const c of deferSet) {
            c(n);
        }
        isBroadcasting = false;
    };

    void getStore(path)
        .then((store) => store.get<T>(key))
        .then((e) => {
            if (e !== undefined) {
                value = e;
                isLoading = false;
                loadingResolve(value);
                broadcastValue();
            } else if (
                "queryInitialValue" in props &&
                props.queryInitialValue
            ) {
                void Promise.resolve(props.queryInitialValue()).then((e) => {
                    value = e;
                    isLoading = false;
                    loadingResolve(value);
                    broadcastValue();
                });
            } else {
                if (!("initialValue" in props)) {
                    throw new Error(
                        "Unexpected state. Prop don't have initial neither query function",
                    );
                }
                isLoading = false;
                loadingResolve(value);
                broadcastValue();
            }
        });

    const listen = (c: Callback<[T]>): Callback => {
        listening.push(c);
        if (!isLoading) {
            c(value);
        }
        return () => {
            const idx = listening.indexOf(c);
            if (idx >= 0) {
                listening.splice(idx, 1);
            }
        };
    };

    const refresh = async () => {
        isLoading = true;
        loadingProm = new Promise<T>((resolve) => {
            loadingResolve = resolve;
        });
        const store = await getStore(path);
        const persistedValue = await store.get<T>(key);
        if (persistedValue !== undefined) {
            const isEqual = fastDeepEqual(value, persistedValue);
            if (!isEqual) {
                value = persistedValue;
                broadcastValue();
            }
        }
        loadingResolve(value);
    };

    const c = atom(0);

    c.onMount = (setAtom: (s: Readonly<number>) => void): Callback => {
        deferSet.push(setAtom);
        return () => {
            const idx = deferSet.indexOf(setAtom);
            if (idx >= 0) {
                deferSet.splice(idx, 1);
            }
        };
    };

    const atomValue: TauriStoreAtom<T> = {
        ...atom<Readonly<T>, [T | Callback<[T], T>], void>(
            (get) => {
                get(c);
                return value;
            },
            (_get, _set, update) => {
                if (isBroadcasting) {
                    return;
                }
                const newValue =
                    typeof update === "function"
                        ? (update as Callback<[T], T>)(value)
                        : update;

                if (newValue === undefined || fastDeepEqual(newValue, value)) {
                    return;
                }

                void getStore(path).then(
                    (store) => void store.set(key, newValue),
                );
                value = newValue;
                broadcastValue();
            },
        ),
        get: () => value,
        listen,
        refresh,
        isLoading: () => isLoading,
        loading: () => loadingProm,
    };

    atomCache.set(cacheKey, atomValue);
    return atomValue;
}
