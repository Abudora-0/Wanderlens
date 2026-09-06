"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Decorative home-hero globe. A stylised spinning Earth built from an
 * equirectangular land map plus sphere shading. No WebGL, no dot texture.
 * Drags to spin, taps through to /explore.
 */
export function MiniGlobe() {
  const reducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const s = useRef({
    x: 0,
    onScreen: true,
    dragging: false,
    startX: 0,
    baseX: 0,
    moved: 0,
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const strip = stripRef.current;
    if (!wrap || !strip) return;
    const state = s.current;

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!state.onScreen) return;
      if (!state.dragging && !reducedMotion) state.x -= 0.02;
      if (state.x <= -50) state.x += 50;
      if (state.x > 0) state.x -= 50;
      strip.style.transform = `translate3d(${state.x}%,0,0)`;
    };
    frame = requestAnimationFrame(tick);

    const io = new IntersectionObserver(
      ([entry]) => {
        state.onScreen = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 },
    );
    io.observe(wrap);
    const onVis = () => {
      state.onScreen = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const onDown = (event: PointerEvent) => {
      state.dragging = true;
      state.startX = event.clientX;
      state.baseX = state.x;
      state.moved = 0;
      wrap.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!state.dragging) return;
      const dx = event.clientX - state.startX;
      state.moved = Math.max(state.moved, Math.abs(dx));
      state.x = state.baseX + (dx / wrap.clientWidth) * 60;
    };
    const onUp = (event: PointerEvent) => {
      if (state.dragging && state.moved < 6) router.push("/explore");
      state.dragging = false;
      try {
        wrap.releasePointerCapture(event.pointerId);
      } catch {
        // already released
      }
    };
    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
    };
  }, [router, reducedMotion]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      <div
        ref={wrapRef}
        aria-label="Open the interactive globe"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") router.push("/explore");
        }}
        className="focus-ring group relative h-full w-full cursor-grab touch-none select-none overflow-hidden rounded-full active:cursor-grabbing"
        style={{
          background:
            "radial-gradient(circle at 34% 30%, #2f7fd8 0%, #1c5bb0 45%, #0c2f66 100%)",
          boxShadow:
            "0 0 60px -6px rgba(52,221,187,0.35), inset 0 0 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* scrolling land strip: two copies of the world map side by side */}
        <div
          ref={stripRef}
          className="absolute inset-y-0 left-0 flex h-full w-[200%] opacity-90 will-change-transform"
        >
          <div
            className="h-full w-1/2 bg-[length:100%_100%] bg-no-repeat"
            style={{ backgroundImage: "url(/earth-map.svg)" }}
          />
          <div
            className="h-full w-1/2 bg-[length:100%_100%] bg-no-repeat"
            style={{ backgroundImage: "url(/earth-map.svg)" }}
          />
        </div>

        {/* sphere curvature + terminator shading */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 33% 28%, rgba(255,255,255,0.18) 0%, transparent 26%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(3,7,20,0.35) 72%, rgba(3,7,20,0.8) 100%)",
          }}
        />
        {/* thin atmosphere rim */}
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-teal)_45%,transparent)]" />
      </div>

      <p className="pointer-events-none absolute inset-x-0 -bottom-1 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
        Drag to spin, tap to open the map
      </p>
    </div>
  );
}
