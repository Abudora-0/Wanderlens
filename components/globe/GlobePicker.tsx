"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import type { GeoCandidate } from "@/lib/types";
import { useExperience } from "@/components/experience/store";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useIsNarrowViewport } from "@/components/globe/useIsNarrowViewport";
import { GlobeFallback } from "@/components/globe/GlobeFallback";
import { GlobeSpinner } from "@/components/ui/GlobeSpinner";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <GlobeSpinner label="Spinning up" />
    </div>
  ),
});

const RENDERER_CONFIG = {
  antialias: true,
  powerPreference: "high-performance" as const,
};

interface CountryFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: unknown;
}

interface GlobeInstance {
  pointOfView: (
    view: { lat?: number; lng?: number; altitude?: number },
    ms?: number,
  ) => void;
  controls: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableZoom: boolean;
  };
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  renderer: () => { setPixelRatio: (ratio: number) => void };
}

export function GlobePicker() {
  const reducedMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrowViewport();
  const { selected, select, status } = useExperience();

  const globeRef = useRef<GlobeInstance | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [webglOk] = useState(() => {
    if (typeof document === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(
        canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"),
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (reducedMotion || isNarrow || !webglOk) return;
    let cancelled = false;
    fetch("/countries-110m.geojson")
      .then((res) => res.json())
      .then((data: { features: CountryFeature[] }) => {
        if (!cancelled) {
          setFeatures(
            data.features.filter(
              (feature) => feature.properties.ISO_A2 !== "AQ",
            ),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reducedMotion, isNarrow, webglOk]);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setDimensions((current) => {
        if (
          Math.abs(current.width - rect.width) < 1 &&
          Math.abs(current.height - rect.height) < 1
        ) {
          return current;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const onGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.32;
    controls.enableZoom = true;
    try {
      const ratio = window.devicePixelRatio || 1;
      globe.renderer().setPixelRatio(Math.max(1, Math.min(ratio, 1.5)));
    } catch {
      // renderer not exposed on some builds, safe to skip
    }
    globe.resumeAnimation();
    globe.pointOfView({ lat: 22, lng: 12, altitude: 2.2 }, 0);
  }, [reducedMotion]);

  // Pause the render loop only once the globe is confirmed off-screen; always
  // resume when it comes back. Never pauses before the globe has rendered.
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    let seenVisible = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const globe = globeRef.current;
        if (!globe) return;
        if (entry.isIntersecting) {
          seenVisible = true;
          globe.resumeAnimation();
        } else if (seenVisible) {
          globe.pauseAnimation();
        }
      },
      { threshold: 0 },
    );
    observer.observe(element);

    const onVisibility = () => {
      const globe = globeRef.current;
      if (!globe || !seenVisible) return;
      if (document.hidden) globe.pauseAnimation();
      else globe.resumeAnimation();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selected) return;
    globe.pointOfView(
      { lat: selected.latitude, lng: selected.longitude, altitude: 1.7 },
      1400,
    );
    const controls = globe.controls();
    controls.autoRotate = false;
  }, [selected]);

  const ringsData = useMemo(() => {
    if (!selected) return [];
    return [{ lat: selected.latitude, lng: selected.longitude }];
  }, [selected]);

  const pointsData = useMemo(() => {
    if (!selected) return [];
    return [{ lat: selected.latitude, lng: selected.longitude }];
  }, [selected]);

  const handlePolygonClick = useCallback(
    (feature: object) => {
      const properties = (feature as CountryFeature).properties;
      const name =
        (properties.ADMIN as string) ||
        (properties.NAME as string) ||
        (properties.SOVEREIGNT as string);
      if (!name) return;
      const lat = Number(properties.LABEL_Y);
      const lng = Number(properties.LABEL_X);
      const candidate: GeoCandidate = {
        id: `poly-${name}`,
        name,
        displayName: name,
        country: name,
        countryCode:
          typeof properties.ISO_A2 === "string" && properties.ISO_A2 !== "-99"
            ? (properties.ISO_A2 as string)
            : null,
        admin1: null,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
        population:
          typeof properties.POP_EST === "number"
            ? (properties.POP_EST as number)
            : null,
        kind: "country",
        timezone: null,
      };
      select(candidate);
    },
    [select],
  );

  const polygonCapColor = useCallback(
    (feature: object) =>
      feature === hovered
        ? "rgba(56,225,196,0.6)"
        : "rgba(124,108,245,0.22)",
    [hovered],
  );
  const polygonAltitude = useCallback(
    (feature: object) => (feature === hovered ? 0.06 : 0.01),
    [hovered],
  );
  const polygonSideColor = useCallback(() => "rgba(124,108,245,0.12)", []);
  const polygonStrokeColor = useCallback(() => "rgba(190,198,225,0.45)", []);
  const pointColor = useCallback(() => "#f5c451", []);
  const ringColor = useCallback(
    () => (t: number) => `rgba(242,102,139,${1 - t})`,
    [],
  );
  const handlePolygonHover = useCallback(
    (feature: object | null) => setHovered(feature as CountryFeature | null),
    [],
  );

  if (reducedMotion || isNarrow || !webglOk) {
    return <GlobeFallback />;
  }

  return (
    <div
      ref={wrapRef}
      data-cursor="grab"
      className="relative flex h-[min(78vh,720px)] w-full items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <Globe
        ref={globeRef as never}
        width={dimensions.width || 520}
        height={dimensions.height || 560}
        onGlobeReady={onGlobeReady}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={RENDERER_CONFIG}
        showAtmosphere
        atmosphereColor="#7c6cf5"
        atmosphereAltitude={0.22}
        globeMaterial={
          {
            color: "#141b3d",
            emissive: "#1a2350",
            emissiveIntensity: 0.55,
            shininess: 0.7,
          } as never
        }
        polygonsData={features as object[]}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={polygonAltitude}
        onPolygonHover={handlePolygonHover}
        onPolygonClick={handlePolygonClick}
        polygonsTransitionDuration={200}
        pointsData={pointsData}
        pointColor={pointColor}
        pointAltitude={0.03}
        pointRadius={0.5}
        ringsData={ringsData}
        ringColor={ringColor}
        ringMaxRadius={5}
        ringPropagationSpeed={2.4}
        ringRepeatPeriod={900}
      />

      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-raised)]/90 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-soft)] backdrop-blur"
        >
          {String(hovered.properties.ADMIN ?? hovered.properties.NAME ?? "")}
        </motion.div>
      )}

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-raised)]/90 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-teal)] backdrop-blur">
            Reading the archives
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
        Drag to spin, scroll to zoom, click a country
      </div>
    </div>
  );
}
