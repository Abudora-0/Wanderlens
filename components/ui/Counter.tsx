"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface CounterProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function Counter({
  value,
  duration = 1.6,
  format = (n) => new Intl.NumberFormat("en-US").format(Math.round(n)),
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reducedMotion = usePrefersReducedMotion();

  // Always render the real value first, so the number is correct even when the
  // animation frame loop never runs (background tab, blocked rAF).
  const [display, setDisplay] = useState(() => format(value));
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    setDisplay(format(value));
  }

  useEffect(() => {
    if (!inView || reducedMotion) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
      onComplete: () => setDisplay(format(value)),
    });
    return () => controls.stop();
  }, [inView, value, duration, format, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
