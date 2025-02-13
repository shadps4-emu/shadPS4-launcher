import { atomWithReducer } from "jotai/utils";
import { dequal } from "dequal";

export function atomDeepEqual<Value>(initialValue: Value) {
  return atomWithReducer(initialValue, (prev: Value, next: Value) => {
    if (dequal(prev, next)) {
      return prev;
    }

    return next;
  });
}
