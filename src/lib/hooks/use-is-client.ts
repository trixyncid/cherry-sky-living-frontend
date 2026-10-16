"use client";

import { useSyncExternalStore } from "react";

/** True only after hydration — safe for entrance motion and time-based UI. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
