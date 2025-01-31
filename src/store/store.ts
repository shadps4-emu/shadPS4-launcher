import { Store } from "@tauri-apps/plugin-store";
import { atom, createStore, type SetStateAction } from "jotai";

export const defaultStore = createStore();

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
  initialValue: T | (() => Promise<T> | T),
) {
  const getInitialValue = async () => {
    const initial: T = await Promise.resolve(
      typeof initialValue === "function"
        ? (initialValue as () => Promise<T> | T)()
        : initialValue,
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

  const baseAtom = atom<T>({} as T);
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
