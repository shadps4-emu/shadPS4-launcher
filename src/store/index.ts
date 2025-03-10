import { createStore } from "jotai";

export type JotaiStore = ReturnType<typeof createStore>;

export const defaultStore = createStore();
