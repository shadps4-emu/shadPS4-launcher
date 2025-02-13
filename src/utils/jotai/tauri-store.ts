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
  initialValue: T,
  onMount: T | (() => Promise<T> | T) = initialValue,
) {
  const getInitialValue = async () => {
    const initial: T = await Promise.resolve(
      typeof onMount === "function"
        ? (onMount as () => Promise<T> | T)()
        : onMount,
    );
    try {
      const store = await getStore(path);
      const value = await store.get<T>(key);
      if (typeof initial === "object") {
        return {
          ...initial,
          ...(value || {}),
        };
      }
      return value || initial;
    } catch {
      return initial;
    }
  };

  const baseAtom = atom<T>(initialValue);
  baseAtom.onMount = (setAtom) => {
    void Promise.resolve(getInitialValue()).then(setAtom);
  };

  return atom<T, T[], void>(
    (get) => get(baseAtom),
    (get, set, update: SetStateAction<T>) => {
      const newValue =
        typeof update === "function"
          ? (update as (prev: T) => T)(get(baseAtom))
          : update;

      set(baseAtom, newValue);
      void getStore(path).then((store) => void store.set(key, newValue));
    },
  );
}
