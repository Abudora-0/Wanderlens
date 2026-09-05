"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { collections } from "@/lib/collections";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { scrollToTarget } from "@/lib/scroll";
import { useExperience } from "@/components/experience/store";

const CURATED = collections.flatMap((collection) => collection.places);

const DEG = Math.PI / 180;

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

export function GlobePicker() {
  const reducedMotion = usePrefersReducedMotion();
  const { selected } = useExperience();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [webglOk] = useState(hasWebGL);

  // Live values the render loop reads without re-subscribing.
  const stateRef = useRef({
    phi: 0.6,
    theta: 0.2,
    targetPhi: 0.6,
    targetTheta: 0.2,
    autoRotate: !reducedMotion,
    onScreen: true,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragBasePhi: 0.6,
    dragBaseTheta: 0.2,
    moved: 0,
  });

  useEffect(() => {
    stateRef.current.autoRotate = !reducedMotion && !selected;
  }, [reducedMotion, selected]);

  // Point the globe roughly at the selected place.
  useEffect(() => {
    if (!selected) return;
    const s = stateRef.current;
    s.targetPhi = -selected.longitude * DEG - Math.PI / 2;
    s.targetTheta = Math.max(-0.55, Math.min(0.55, selected.latitude * DEG));
    s.autoRotate = false;
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !webglOk) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let size = wrap.clientWidth;
    const s = stateRef.current;

    const markers = [
      ...CURATED.map((place) => ({
        location: [place.latitude, place.longitude] as [number, number],
        size: 0.045,
      })),
    ];

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: s.phi,
      theta: s.theta,
      dark: 1,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 6.2,
      baseColor: [0.2, 0.24, 0.42],
      markerColor: [0.22, 0.88, 0.77],
      glowColor: [0.45, 0.4, 0.9],
      markers,
    });

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!s.onScreen) return;

      if (s.autoRotate && !s.dragging) {
        s.phi += 0.0028;
        s.targetPhi = s.phi;
        s.targetTheta = s.theta;
      } else if (!s.dragging) {
        s.phi += (s.targetPhi - s.phi) * 0.06;
        s.theta += (s.targetTheta - s.theta) * 0.06;
      }
      globe.update({ phi: s.phi, theta: s.theta });
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
        s.onScreen = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 },
    );
    io.observe(wrap);
    const onVisibility = () => {
      s.onScreen = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onDown = (event: PointerEvent) => {
      s.dragging = true;
      s.dragStartX = event.clientX;
      s.dragStartY = event.clientY;
      s.dragBasePhi = s.phi;
      s.dragBaseTheta = s.theta;
      s.moved = 0;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!s.dragging) return;
      const dx = event.clientX - s.dragStartX;
      const dy = event.clientY - s.dragStartY;
      s.moved = Math.max(s.moved, Math.abs(dx) + Math.abs(dy));
      s.phi = s.dragBasePhi - dx * 0.005;
      s.theta = Math.max(
        -0.9,
        Math.min(0.9, s.dragBaseTheta + dy * 0.005),
      );
    };
    const onUp = (event: PointerEvent) => {
      if (s.dragging && s.moved < 6) {
        scrollToTarget("#explore");
      } else if (s.dragging) {
        s.targetPhi = s.phi;
        s.targetTheta = s.theta;
      }
      s.dragging = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // pointer already released
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
  }, [webglOk]);

  return (
    <div
      ref={wrapRef}
      data-cursor="grab"
      className="relative mx-auto aspect-square w-full max-w-[520px] cursor-grab touch-none select-none active:cursor-grabbing"
    >
      {webglOk ? (
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ contain: "layout paint size" }}
        />
      ) : (
        <div className="grid h-full place-items-center rounded-full border border-[var(--color-hairline)] bg-[radial-gradient(circle_at_35%_30%,rgba(124,108,245,0.35),var(--color-abyss)_70%)]" />
      )}
      <p className="pointer-events-none absolute inset-x-0 -bottom-2 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
        Drag to spin, or search a place above
      </p>
    </div>
  );
}
