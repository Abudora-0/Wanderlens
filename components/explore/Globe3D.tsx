"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { continents, type Continent } from "@/lib/continents";
import type { PlaceLink } from "@/lib/types";
import { GlobeSpinner } from "@/components/ui/GlobeSpinner";
import { usePrefersReducedMotion } from "@/lib/hooks";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const RENDERER_CONFIG = {
  antialias: false,
  powerPreference: "high-performance" as const,
};

/**
 * Keeps the react-globe.gl load contained. `next/dynamic({ ssr: false })`
 * suspends until the chunk arrives; the local Suspense below catches that so the
 * surrounding ExploreView tree is not discarded and remounted (which used to
 * tear down a half-initialised globe and throw on load). GlobeBoundary is the
 * render-error fallback for anything the globe throws while mounted; the
 * teardown throw on unmount is handled higher up (app/global-error + the
 * layout guard) since it escapes as an uncaught error.
 */
class GlobeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("globe boundary caught", error);
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

interface CountryFeature {
  properties: Record<string, unknown>;
  geometry: unknown;
}

interface GlobeInstance {
  pointOfView: (
    v: { lat?: number; lng?: number; altitude?: number },
    ms?: number,
  ) => void;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number };
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  renderer: () => { setPixelRatio: (n: number) => void };
}

export interface GlobeMarker extends PlaceLink {
  tone: "city" | "other";
}

interface Globe3DProps {
  continent: Continent | null;
  activeCountry: string | null;
  markers: GlobeMarker[];
  onSelectContinent: (id: string) => void;
  onSelectCountry: (name: string) => void;
  onSelectMarker: (marker: GlobeMarker) => void;
}

export function Globe3D(props: Globe3DProps) {
  return (
    <GlobeBoundary
      fallback={
        <div className="grid h-full place-items-center px-6 text-center text-xs uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
          The globe stepped out. Use the list to keep exploring.
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="grid h-full place-items-center">
            <GlobeSpinner label="Loading the globe" />
          </div>
        }
      >
        <GlobeCanvas {...props} />
      </Suspense>
    </GlobeBoundary>
  );
}

function GlobeCanvas({
  continent,
  activeCountry,
  markers,
  onSelectContinent,
  onSelectCountry,
  onSelectMarker,
}: Globe3DProps) {
  const reducedMotion = usePrefersReducedMotion();
  const globeRef = useRef<GlobeInstance | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [features, setFeatures] = useState<CountryFeature[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/countries-110m.geojson")
      .then((r) => r.json())
      .then((data: { features: CountryFeature[] }) => {
        if (!cancelled) setFeatures(data.features);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((cur) =>
        Math.abs(cur.width - r.width) < 1 && Math.abs(cur.height - r.height) < 1
          ? cur
          : { width: r.width, height: r.height },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleFeatures = useMemo(() => {
    if (!continent) return features;
    const set = new Set(continent.neValues);
    return features.filter((f) => set.has(f.properties.CONTINENT as string));
  }, [features, continent]);

  const onReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    try {
      g.renderer().setPixelRatio(1);
    } catch {
      // renderer not ready
    }
    const c = g.controls();
    c.autoRotate = !reducedMotion && !continent;
    c.autoRotateSpeed = 0.28;
    g.resumeAnimation();
    const view = continent?.view ?? { lat: 15, lng: 10, altitude: 2.6 };
    g.pointOfView(view, 0);
  }, [reducedMotion, continent]);

  // Fly camera on level change.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = !reducedMotion && !continent;
    if (activeCountry) {
      const hit = features.find(
        (f) =>
          (f.properties.ADMIN as string) === activeCountry ||
          (f.properties.NAME as string) === activeCountry,
      );
      const lat = Number(hit?.properties.LABEL_Y);
      const lng = Number(hit?.properties.LABEL_X);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        g.pointOfView({ lat, lng, altitude: 1.1 }, 900);
        return;
      }
    }
    if (continent) g.pointOfView(continent.view, 900);
  }, [activeCountry, continent, features, reducedMotion]);

  // Pause the render loop off-screen / when hidden.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let seen = false;
    const io = new IntersectionObserver(([entry]) => {
      const g = globeRef.current;
      if (!g) return;
      if (entry.isIntersecting) {
        seen = true;
        g.resumeAnimation();
      } else if (seen) {
        g.pauseAnimation();
      }
    });
    io.observe(el);
    const onVis = () => {
      const g = globeRef.current;
      if (!g || !seen) return;
      if (document.hidden) g.pauseAnimation();
      else g.resumeAnimation();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const capColor = useCallback(
    (f: object) =>
      (f as CountryFeature).properties.ADMIN === activeCountry
        ? "rgba(52,221,187,0.7)"
        : "rgba(47,127,245,0.16)",
    [activeCountry],
  );
  const sideColor = useCallback(() => "rgba(47,127,245,0.1)", []);
  const strokeColor = useCallback(() => "rgba(180,200,235,0.4)", []);

  const onPolygonClick = useCallback(
    (f: object) => {
      const props = (f as CountryFeature).properties;
      const name = (props.ADMIN as string) || (props.NAME as string) || "";
      if (!name) return;
      if (!continent) {
        const cont = continents.find((c) =>
          c.neValues.includes(props.CONTINENT as string),
        );
        if (cont) onSelectContinent(cont.id);
        return;
      }
      onSelectCountry(name);
    },
    [continent, onSelectContinent, onSelectCountry],
  );

  const pointsData = useMemo(
    () =>
      markers.filter(
        (m) => typeof m.latitude === "number" && typeof m.longitude === "number",
      ),
    [markers],
  );

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {size.width === 0 && (
        <div className="grid h-full place-items-center">
          <GlobeSpinner label="Loading the globe" />
        </div>
      )}
      {size.width > 0 && (
        <Globe
          ref={globeRef as never}
          width={size.width}
          height={size.height}
          onGlobeReady={onReady}
          backgroundColor="rgba(0,0,0,0)"
          rendererConfig={RENDERER_CONFIG}
          showAtmosphere
          atmosphereColor="#34ddbb"
          atmosphereAltitude={0.16}
          globeMaterial={
            {
              color: "#0c1a3a",
              emissive: "#0a1836",
              emissiveIntensity: 0.5,
            } as never
          }
          polygonsData={visibleFeatures as object[]}
          polygonCapColor={capColor}
          polygonSideColor={sideColor}
          polygonStrokeColor={strokeColor}
          polygonAltitude={0.01}
          polygonsTransitionDuration={0}
          onPolygonClick={onPolygonClick}
          pointsData={pointsData as object[]}
          pointLat={(d: object) => (d as GlobeMarker).latitude as number}
          pointLng={(d: object) => (d as GlobeMarker).longitude as number}
          pointColor={(d: object) =>
            (d as GlobeMarker).tone === "city" ? "#f5c451" : "#34ddbb"
          }
          pointAltitude={0.02}
          pointRadius={0.42}
          pointLabel={(d: object) => (d as GlobeMarker).name}
          onPointClick={(d: object) => onSelectMarker(d as GlobeMarker)}
        />
      )}
    </div>
  );
}
