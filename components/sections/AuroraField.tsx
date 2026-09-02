"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface Blob {
  x: number;
  y: number;
  radius: number;
  hue: string;
  dx: number;
  dy: number;
}

const HUES = ["56, 225, 196", "124, 108, 245", "242, 102, 139", "245, 196, 81"];

export function AuroraField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const blobs: Blob[] = HUES.map((hue, index) => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.32 + index * 0.05,
      hue,
      dx: (Math.random() - 0.5) * 0.00016,
      dy: (Math.random() - 0.5) * 0.00016,
    }));

    const stars = Array.from({ length: 90 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.4 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#05070f";
      context.fillRect(0, 0, width, height);

      blobs.forEach((blob) => {
        if (!reducedMotion) {
          blob.x += blob.dx;
          blob.y += blob.dy;
          if (blob.x < -0.2 || blob.x > 1.2) blob.dx *= -1;
          if (blob.y < -0.2 || blob.y > 1.2) blob.dy *= -1;
        }
        const cx = blob.x * width;
        const cy = blob.y * height;
        const r = blob.radius * Math.max(width, height);
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, `rgba(${blob.hue}, 0.22)`);
        gradient.addColorStop(1, "rgba(5, 7, 15, 0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      });

      stars.forEach((star) => {
        const alpha = reducedMotion
          ? 0.5
          : 0.35 + Math.sin(time * 0.001 + star.twinkle) * 0.3;
        context.fillStyle = `rgba(231, 234, 242, ${Math.max(0, alpha)})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      });

      if (!reducedMotion) raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    if (reducedMotion) render(0);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
