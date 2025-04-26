import { type Atom, atom } from "jotai";
import { loadable } from "jotai/utils";

export function atomKeepLast<T>(src: Atom<T>): Atom<T> {
    let prevData: T | undefined = undefined;
    const srcLoadable = loadable(src);
    return atom((get) => {
        const value = get(srcLoadable);
        if (value.state === "hasData") {
            prevData = value.data;
            return value.data;
        } else if (value.state === "hasError") {
            throw value.error;
        } else if (prevData !== undefined) {
            return prevData;
        } else {
            return get(src);
        }
    });
}
