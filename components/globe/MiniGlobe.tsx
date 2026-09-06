"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import createGlobe from "cobe";
import { collections } from "@/lib/collections";
import { usePrefersReducedMotion } from "@/lib/hooks";

const MARKERS = collections
  .flatMap((collection) => collection.places)
  .map((place) => ({
    location: [place.latitude, place.longitude] as [number, number],
    size: 0.045,
  }));

function hasWebGL() {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * Decorative home-hero globe. Lightweight (cobe), drags to spin, and taps
 * through to the real picker at /explore.
 */
export function MiniGlobe() {
  const reducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [webglOk] = useState(hasWebGL);

  const s = useRef({
    phi: 0.9,
    theta: 0.2,
    onScreen: true,
    dragging: false,
    startX: 0,
    basePhi: 0.9,
    moved: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !webglOk) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let size = wrap.clientWidth;
    const state = s.current;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: state.phi,
      theta: state.theta,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.19, 0.36, 0.6],
      markerColor: [0.32, 0.86, 0.5],
      glowColor: [0.2, 0.55, 0.75],
      markers: MARKERS,
    });

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!state.onScreen) return;
      if (!state.dragging && !reducedMotion) state.phi += 0.0026;
      globe.update({ phi: state.phi, theta: state.theta });
    };
    frame = requestAnimationFrame(tick);

    const resize = () => {
      size = wrap.clientWidth;
      globe.update({ width: size * dpr, height: size * dpr });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        state.onScreen = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 },
    );
    io.observe(wrap);
    const onVisibility = () => {
      state.onScreen = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onDown = (event: PointerEvent) => {
      state.dragging = true;
      state.startX = event.clientX;
      state.basePhi = state.phi;
      state.moved = 0;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      const dx = event.clientX - state.startX;
      state.moved = Math.max(state.moved, Math.abs(dx));
      state.phi = state.basePhi - dx * 0.005;
    };
    const onUp = (event: PointerEvent) => {
      if (state.dragging && state.moved < 6) router.push("/explore");
      state.dragging = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // already released
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      globe.destroy();
    };
  }, [webglOk, reducedMotion, router]);

  return (
    <div
      ref={wrapRef}
      data-cursor="grab"
      className="relative mx-auto aspect-square w-full max-w-[440px] cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {webglOk ? (
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ contain: "layout paint size" }}
        />
      ) : (
        <div className="h-full rounded-full border border-[var(--color-hairline)] bg-[radial-gradient(circle_at_35%_30%,rgba(47,127,245,0.4),var(--color-abyss)_70%)]" />
      )}
      <p className="pointer-events-none absolute inset-x-0 -bottom-1 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
        Drag to spin, tap to open the map
      </p>
    </div>
  );
}
