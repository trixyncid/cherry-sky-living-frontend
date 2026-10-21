"use client";

import { useSyncExternalStore } from "react";

/**
 * Live `matchMedia` result. Server render (and first paint) assume false,
 * so only use this for things that appear after interaction (menus, pickers).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones (below Tailwind's `sm`). */
export function useIsPhone(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
