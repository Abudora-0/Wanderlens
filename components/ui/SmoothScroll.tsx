"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "@/lib/hooks";

let instance: Lenis | null = null;

/** Scroll to an element (or the top) through Lenis so it does not fight the
 * smooth-scroll loop. Falls back to native when Lenis is off. */
export function scrollToTarget(target: string | number, offset = 0) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1 });
    return;
  }
  if (typeof window === "undefined") return;
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  document
    .querySelector(target)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      anchors: true,
    });
    instance = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      instance = null;
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
