"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { continentById } from "@/lib/continents";
import { useMediaQuery } from "@/lib/hooks";
import { destinationHref } from "@/lib/destination-link";
import type { NodeKind, PlaceNode } from "@/lib/types";
import { ExplorePanel } from "@/components/explore/ExplorePanel";
import { Globe3D, type GlobeMarker } from "@/components/explore/Globe3D";
import { EarthGlobe } from "@/components/globe/EarthGlobe";

interface CountryFeature {
  properties: {
    ADMIN?: string;
    NAME?: string;
    CONTINENT?: string;
    POP_EST?: number;
  };
}

export function ExploreView() {
  const router = useRouter();
  const params = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const continentId = params.get("continent");
  const country = params.get("country");
  const region = params.get("region");
  const continent = continentById(continentId);

  const [features, setFeatures] = useState<CountryFeature[]>([]);

  useEffect(() => {
    fetch("/countries-110m.geojson")
      .then((r) => r.json())
      .then((d: { features: CountryFeature[] }) => setFeatures(d.features))
      .catch(() => undefined);
  }, []);

  // Which article to fetch for the current level.
  const target = useMemo<{ title: string; kind: NodeKind } | null>(() => {
    if (region) return { title: region, kind: "region" };
    if (country) return { title: country, kind: "country" };
    if (continent) return { title: continent.article, kind: "continent" };
    return null;
  }, [region, country, continent]);
  const targetKey = target ? `${target.kind}:${target.title}` : "";

  const [fetchState, setFetchState] = useState<{
    key: string;
    node: PlaceNode | null;
    loading: boolean;
    error: string | null;
  }>({ key: "", node: null, loading: false, error: null });

  // Reset when the level changes (documented render-phase state adjustment).
  if (fetchState.key !== targetKey) {
    setFetchState({
      key: targetKey,
      node: null,
      loading: Boolean(target),
      error: null,
    });
  }

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    fetch(
      `/api/place?title=${encodeURIComponent(target.title)}&kind=${target.kind}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("no guide");
        return (await res.json()) as PlaceNode;
      })
      .then((data) =>
        setFetchState((s) =>
          s.key === targetKey ? { ...s, node: data, loading: false } : s,
        ),
      )
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setFetchState((s) =>
          s.key === targetKey
            ? {
                ...s,
                node: null,
                loading: false,
                error: `No travel guide found for ${target.title} yet. Try another.`,
              }
            : s,
        );
      });
    return () => controller.abort();
  }, [target, targetKey]);

  const node = fetchState.node;
  const loading = fetchState.loading;
  const error = fetchState.error;

  const countryList = useMemo(() => {
    if (!continent || country) return [];
    const set = new Set(continent.neValues);
    return features
      .filter((f) => set.has(f.properties.CONTINENT ?? ""))
      .map((f) => ({
        name: f.properties.ADMIN ?? f.properties.NAME ?? "",
        pop: f.properties.POP_EST ?? 0,
      }))
      .filter((c) => c.name)
      .sort((a, b) => b.pop - a.pop)
      .map((c) => c.name);
  }, [continent, country, features]);

  const markers = useMemo<GlobeMarker[]>(() => {
    if (!node) return [];
    return [
      ...node.cities.map((l) => ({ ...l, tone: "city" as const })),
      ...node.otherDestinations.map((l) => ({ ...l, tone: "other" as const })),
    ].filter((m) => typeof m.latitude === "number");
  }, [node]);

  const go = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams();
      const merged = {
        continent: continentId,
        country,
        region,
        ...next,
      };
      for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
      router.push(`/explore?${sp.toString()}`);
    },
    [router, continentId, country, region],
  );

  const crumbs = useMemo(() => {
    const list = [{ label: "Explore", href: "/explore" }];
    if (continent) {
      list.push({
        label: continent.name,
        href: `/explore?continent=${continent.id}`,
      });
    }
    if (country && continent) {
      list.push({
        label: country,
        href: `/explore?continent=${continent.id}&country=${encodeURIComponent(country)}`,
      });
    }
    if (region) list.push({ label: region, href: "#" });
    return list;
  }, [continent, country, region]);

  const onSelectMarker = useCallback(
    (marker: GlobeMarker) => {
      router.push(
        destinationHref({
          name: marker.name,
          country,
          latitude: marker.latitude,
          longitude: marker.longitude,
          kind: "city",
        }),
      );
    },
    [router, country],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
        <div className="relative h-[46vh] min-h-[300px] overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-abyss)] lg:h-[74vh]">
          {isDesktop ? (
            <Globe3D
              continent={continent}
              activeCountry={country}
              markers={markers}
              onSelectContinent={(id) =>
                router.push(`/explore?continent=${id}`)
              }
              onSelectCountry={(name) => go({ country: name, region: null })}
              onSelectMarker={onSelectMarker}
            />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EarthGlobe />
            </div>
          )}
          {isDesktop && !continent && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
              Click a continent to begin
            </p>
          )}
        </div>

        <div className="lg:h-[74vh]">
          <ExplorePanel
            crumbs={crumbs}
            loading={loading}
            error={error}
            node={node}
            showContinentPicker={!continent}
            countryList={countryList}
            currentCountry={country}
            countryHref={(name) =>
              `/explore?continent=${continentId}&country=${encodeURIComponent(name)}`
            }
            regionHref={(article) =>
              `/explore?continent=${continentId}&country=${encodeURIComponent(country ?? "")}&region=${encodeURIComponent(article)}`
            }
          />
        </div>
      </div>
    </div>
  );
}
