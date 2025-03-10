import { Store } from "@tauri-apps/plugin-store";
import { atom, type SetStateAction } from "jotai";

const __store = new Map<string, Promise<Store>>();

async function getStore(path: string): Promise<Store> {
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
  {
    initialValue,
    onMount = initialValue,
    mergeInitial = true,
  }:
    | {
        initialValue: T;
        onMount?: T | (() => Promise<T> | T);
        mergeInitial?: boolean;
      }
    | {
        initialValue?: T;
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
      const value = await store.get<T>(key);
      if (mergeInitial) {
        if (Array.isArray(initial)) {
          return [...initial, ...((value as T[]) || [])] as T;
        } else if (typeof initial === "object") {
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

  const baseAtom = atom<T | null>(initialValue ?? null);
  baseAtom.onMount = (setAtom) => {
    void Promise.resolve(getInitialValue()).then(setAtom);
  };

  return atom<T | null, [T], void>(
    (get) => get(baseAtom),
    (get, set, update: SetStateAction<T | null>) => {
      const newValue =
        typeof update === "function"
          ? (update as (prev: T | null) => T)(get(baseAtom))
          : update;

      set(baseAtom, newValue);
      void getStore(path).then((store) => void store.set(key, newValue));
    },
  );
}
