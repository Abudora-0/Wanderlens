"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { usePointerFine, usePrefersReducedMotion } from "@/lib/hooks";

export function Cursor() {
  const pointerFine = usePointerFine();
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (!pointerFine || reducedMotion) return;

    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setHidden(false);
      const target = event.target as HTMLElement;
      setActive(
        Boolean(
          target.closest(
            'a, button, [role="button"], input, select, [data-cursor="grab"]',
          ),
        ),
      );
    };
    const leave = () => setHidden(true);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, [pointerFine, reducedMotion, x, y]);

  if (!pointerFine || reducedMotion) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[80] hidden h-2 w-2 rounded-full bg-[var(--color-teal)] mix-blend-screen md:block"
        style={{ x, y, translateX: "-50%", translateY: "-50%", opacity: hidden ? 0 : 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[80] hidden rounded-full border mix-blend-screen md:block"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: active ? 56 : 34,
          height: active ? 56 : 34,
          borderColor: active ? "var(--color-rose)" : "var(--color-iris)",
          opacity: hidden ? 0 : 0.9,
        }}
      />
    </>
  );
}
