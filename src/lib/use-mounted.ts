"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True dopo il mount (idratazione). useSyncExternalStore evita il setState
 * in useEffect (react-hooks/set-state-in-effect) e il rischio di cascading render.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}