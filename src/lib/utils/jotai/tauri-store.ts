import { Store } from "@tauri-apps/plugin-store";
import { atom, type SetStateAction } from "jotai";

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
export function atomWithTauriStore<T, Nullable extends boolean = true>(
    path: string,
    key: string,
    {
        initialValue,
        onMount = initialValue,
        mergeInitial = true,
    }: Nullable extends false
        ? {
              initialValue: T;
              onMount?: T | (() => Promise<T> | T);
              mergeInitial?: boolean;
          }
        : {
              initialValue?: T | undefined;
              onMount: T | (() => Promise<T> | T);
              mergeInitial?: boolean;
          },
) {
    const getInitialValue = async () => {
        const initialProm =
            typeof onMount === "function"
                ? (onMount as () => Promise<T> | T)()
                : onMount;
        if (initialProm == null) {
            throw new Error("Initial value or onMount must be defined");
        }
        const initial: T = await Promise.resolve(initialProm);
        try {
            const store = await getStore(path);
            const value = (await store.get<T>(key)) ?? null;
            if (mergeInitial) {
                if (Array.isArray(initial)) {
                    return [...initial, ...((value as T[]) || [])] as T;
                }
                if (typeof initial === "object") {
                    return {
                        ...initial,
                        ...(value || {}),
                    };
                }
            }
            return value || initial;
        } catch {
            return initial;
        }
    };

    const baseAtom = atom(
        (initialValue ?? null) as Nullable extends true ? T | null : T,
    );
    baseAtom.onMount = (setAtom) => {
        void Promise.resolve(getInitialValue()).then((e) =>
            setAtom(e as Nullable extends true ? T | null : T),
        );
    };

    return atom<Nullable extends true ? T | null : T, [T], void>(
        (get) => get(baseAtom),
        (get, set, update: SetStateAction<T | null>) => {
            const newValue =
                typeof update === "function"
                    ? (update as (prev: T | null) => T)(get(baseAtom) ?? null)
                    : update;

            set(baseAtom, newValue as Nullable extends true ? T | null : T);
            void getStore(path).then((store) => void store.set(key, newValue));
        },
    );
}
