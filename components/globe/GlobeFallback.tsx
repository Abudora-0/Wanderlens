"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { collections } from "@/lib/collections";
import { useExperience } from "@/components/experience/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import type { GeoCandidate } from "@/lib/types";

export function GlobeFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { select } = useExperience();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let frame = 0;
    let width = canvas.offsetWidth;

    const onResize = () => {
      width = canvas.offsetWidth;
      globe.update({ width: width * 2, height: width * 2 });
    };

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.28,
      dark: 1,
      diffuse: 1.1,
      mapSamples: 15000,
      mapBrightness: 5.4,
      baseColor: [0.16, 0.2, 0.38],
      markerColor: [0.96, 0.77, 0.32],
      glowColor: [0.49, 0.42, 0.96],
      markers: collections
        .flatMap((collection) => collection.places)
        .map((place) => ({
          location: [place.latitude, place.longitude] as [number, number],
          size: 0.05,
        })),
    });

    const tick = () => {
      if (!reducedMotion) phi += 0.003;
      globe.update({ phi });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [reducedMotion]);

  const pick = (place: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    const candidate: GeoCandidate = {
      id: `fallback-${place.name}`,
      name: place.name,
      displayName: `${place.name}, ${place.country}`,
      country: place.country,
      countryCode: null,
      admin1: null,
      latitude: place.latitude,
      longitude: place.longitude,
      population: null,
      kind: "city",
      timezone: null,
    };
    select(candidate);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative aspect-square w-full max-w-[340px]">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ contain: "layout paint size" }}
        />
      </div>
      <div className="w-full">
        <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
          Jump to a starting point
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {collections
            .flatMap((collection) => collection.places)
            .slice(0, 12)
            .map((place) => (
              <button
                key={place.name}
                type="button"
                onClick={() => pick(place)}
                className="focus-ring rounded-xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
              >
                {place.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
