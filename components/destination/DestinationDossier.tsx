"use client";

import { useMemo, useState } from "react";
import { AttractionCard } from "@/components/destination/AttractionCard";
import { WeatherPanel } from "@/components/destination/WeatherPanel";
import { CountryFacts } from "@/components/destination/CountryFacts";
import { Select, type SelectOption } from "@/components/ui/Select";
import { RangeSlider } from "@/components/ui/RangeSlider";
import type { AttractionCategory, DestinationDossier } from "@/lib/types";

type SortKey = "curated" | "nearest" | "az";

const SORT_OPTIONS: SelectOption<SortKey>[] = [
  { value: "curated", label: "Curated order", hint: "Guide picks first" },
  { value: "nearest", label: "Nearest first", hint: "By distance from the centre" },
  { value: "az", label: "Alphabetical", hint: "A to Z" },
];

const CATEGORY_LABEL: Record<AttractionCategory, string> = {
  landmark: "Landmarks",
  museum: "Museums",
  nature: "Nature",
  religious: "Sacred sites",
  history: "History",
  art: "Art",
  neighborhood: "Quarters",
  viewpoint: "Viewpoints",
  water: "Waterside",
  other: "Other",
};

export function DestinationDossier({ dossier }: { dossier: DestinationDossier }) {
  const [sort, setSort] = useState<SortKey>("curated");
  const [category, setCategory] = useState<AttractionCategory | "all">("all");
  const [radius, setRadius] = useState(30);

  const categoryOptions = useMemo<SelectOption<AttractionCategory | "all">[]>(() => {
    const present = new Set(dossier.attractions.map((item) => item.category));
    const options: SelectOption<AttractionCategory | "all">[] = [
      { value: "all", label: "Every kind" },
    ];
    (Object.keys(CATEGORY_LABEL) as AttractionCategory[])
      .filter((key) => present.has(key))
      .forEach((key) => options.push({ value: key, label: CATEGORY_LABEL[key] }));
    return options;
  }, [dossier.attractions]);

  const visible = useMemo(() => {
    let list = dossier.attractions.filter(
      (item) => item.distanceKm === null || item.distanceKm <= radius,
    );
    if (category !== "all") {
      list = list.filter((item) => item.category === category);
    }
    if (sort === "nearest") {
      list = [...list].sort(
        (a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9),
      );
    } else if (sort === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list = [...list].sort((a, b) => b.score - a.score);
    }
    return list;
  }, [dossier.attractions, category, radius, sort]);

  return (
    <div className="grid gap-8 pt-8 lg:grid-cols-[340px_1fr] lg:gap-10">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        {dossier.summary && (
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {dossier.summary}
          </p>
        )}
        {dossier.weather && <WeatherPanel weather={dossier.weather} />}
        {dossier.country && <CountryFacts country={dossier.country} />}
        {dossier.attributions.length > 0 && (
          <p className="text-[11px] leading-relaxed text-[var(--color-ink-mute)]">
            Sources:{" "}
            {dossier.attributions.map((item, index) => (
              <span key={item.label}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--color-ink-soft)]"
                >
                  {item.label}
                </a>
                {` (${item.license})`}
                {index < dossier.attributions.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </aside>

      <div>
        <div className="mb-6 grid gap-4 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)]/60 p-5 sm:grid-cols-3">
          <Select
            label="Show"
            value={category}
            options={categoryOptions}
            onChange={setCategory}
          />
          <Select
            label="Order"
            value={sort}
            options={SORT_OPTIONS}
            onChange={setSort}
          />
          <RangeSlider
            label="Search radius"
            min={2}
            max={40}
            step={1}
            value={radius}
            onChange={setRadius}
            format={(value) => `${value} km`}
          />
        </div>

        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
          {visible.length} place{visible.length === 1 ? "" : "s"} worth your time
        </p>

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--color-hairline)] p-12 text-center text-sm text-[var(--color-ink-mute)]">
            Nothing matches that filter. Widen the radius or switch the category.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((attraction, index) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                index={index}
              />
            ))}
          </div>
        )}

        {dossier.partial.length > 0 && (
          <p className="mt-8 text-[11px] text-[var(--color-ink-mute)]">
            Some guides were slow to answer, so this list may be lighter than
            usual. Reload in a moment for the full picture.
          </p>
        )}
      </div>
    </div>
  );
}
