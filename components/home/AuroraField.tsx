"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * The hero backdrop. Colour wash is pure CSS (GPU-composited blurred blobs on
 * slow keyframe drift). Stars are painted once to a canvas, never on a loop.
 */
export function AuroraField() {
  const starRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const paint = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const count = Math.round((width * height) / 14000);
      for (let i = 0; i < count; i += 1) {
        const size = Math.random() * 1.3 + 0.3;
        context.fillStyle = `rgba(231, 234, 242, ${Math.random() * 0.5 + 0.15})`;
        context.beginPath();
        context.arc(
          Math.random() * width,
          Math.random() * height,
          size,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    };

    paint();
    let timer: number;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[var(--color-void)]"
      data-reduced={reducedMotion ? "true" : undefined}
    >
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
      <canvas ref={starRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
