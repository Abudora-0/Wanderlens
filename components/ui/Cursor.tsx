"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { usePointerFine, usePrefersReducedMotion } from "@/lib/hooks";

const INTERACTIVE = 'a, button, [role="button"], input, select, [data-cursor="grab"]';

export function Cursor() {
  const pointerFine = usePointerFine();
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(true);
  const activeRef = useRef(false);
  const hiddenRef = useRef(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.4 });

  useEffect(() => {
    if (!pointerFine || reducedMotion) return;

    // Position only. Motion values do not trigger React renders.
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      if (hiddenRef.current) {
        hiddenRef.current = false;
        setHidden(false);
      }
    };
    // Hover state changes rarely, so drive it off enter/leave, not movement.
    const over = (event: PointerEvent) => {
      const next = Boolean(
        (event.target as HTMLElement | null)?.closest?.(INTERACTIVE),
      );
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    };
    const leaveWindow = () => {
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        setHidden(true);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerout", over, { passive: true });
    window.addEventListener("pointerleave", leaveWindow);
    window.addEventListener("blur", leaveWindow);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", over);
      window.removeEventListener("pointerleave", leaveWindow);
      window.removeEventListener("blur", leaveWindow);
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
