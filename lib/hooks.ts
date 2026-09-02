"use client";

import { useCallback, useSyncExternalStore } from "react";

function useMatchMedia(queryString: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => undefined;
      const query = window.matchMedia(queryString);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    [queryString],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(queryString).matches;
  }, [queryString]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function usePrefersReducedMotion(): boolean {
  return useMatchMedia("(prefers-reduced-motion: reduce)");
}

export function usePointerFine(): boolean {
  return useMatchMedia("(pointer: fine)");
}

export function useMediaQuery(queryString: string): boolean {
  return useMatchMedia(queryString);
}
