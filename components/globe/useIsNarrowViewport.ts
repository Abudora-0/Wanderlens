"use client";

import { useCallback, useSyncExternalStore } from "react";

const BREAKPOINT = 820;

/**
 * True only when the viewport is confidently narrow. Some embedded browser
 * contexts briefly report a width of 0, which must not be treated as mobile.
 */
export function useIsNarrowViewport(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener("resize", onChange);
    const query = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    query.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("resize", onChange);
      query.removeEventListener("change", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    const width = window.innerWidth;
    if (!width) return false;
    return width <= BREAKPOINT;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
