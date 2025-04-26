import { dequal } from "dequal";
import { atomWithReducer } from "jotai/utils";

export function atomDeepEqual<Value>(initialValue: Value) {
    return atomWithReducer(initialValue, (prev: Value, next: Value) => {
        if (dequal(prev, next)) {
            return prev;
        }

        return next;
    });
}
