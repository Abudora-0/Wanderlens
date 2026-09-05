"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExperience } from "@/components/experience/store";
import { AttractionCard } from "@/components/destination/AttractionCard";
import { WeatherPanel } from "@/components/destination/WeatherPanel";
import { CountryFacts } from "@/components/destination/CountryFacts";
import { Select, type SelectOption } from "@/components/ui/Select";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { GlobeSpinner } from "@/components/ui/GlobeSpinner";
import { staggerParent } from "@/lib/motion";
import type { AttractionCategory } from "@/lib/types";

type SortKey = "curated" | "nearest" | "az";

const SORT_OPTIONS: SelectOption<SortKey>[] = [
  { value: "curated", label: "Curated order", hint: "Our blend of both archives" },
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

export function DestinationPanel() {
  const { selected, dossier, status, error, clear, select } = useExperience();
  const [sort, setSort] = useState<SortKey>("curated");
  const [category, setCategory] = useState<AttractionCategory | "all">("all");
  const [radius, setRadius] = useState(25);

  const categoryOptions = useMemo<SelectOption<AttractionCategory | "all">[]>(() => {
    const present = new Set(
      (dossier?.attractions ?? []).map((item) => item.category),
    );
    const options: SelectOption<AttractionCategory | "all">[] = [
      { value: "all", label: "Every kind" },
    ];
    (Object.keys(CATEGORY_LABEL) as AttractionCategory[])
      .filter((key) => present.has(key))
      .forEach((key) => options.push({ value: key, label: CATEGORY_LABEL[key] }));
    return options;
  }, [dossier]);

  const visible = useMemo(() => {
    if (!dossier) return [];
    let list = [...dossier.attractions];
    if (category !== "all") {
      list = list.filter((item) => item.category === category);
    }
    list = list.filter(
      (item) => item.distanceKm === null || item.distanceKm <= radius,
    );
    if (sort === "nearest") {
      list.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    } else if (sort === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => b.score - a.score);
    }
    return list;
  }, [dossier, category, radius, sort]);

  if (!selected) return null;

  return (
    <section
      id="dossier"
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-28 pt-10"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-hairline)] pb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
                {selected.kind}
              </p>
              <h2 className="mt-2 font-display text-4xl text-[var(--color-ink)] sm:text-5xl">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-mute)]">
                {selected.displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={clear}
              className="focus-ring rounded-full border border-[var(--color-hairline)] px-4 py-2 text-xs uppercase tracking-[0.16em] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-ink)]"
            >
              Back to the globe
            </button>
          </header>

          {status === "loading" && (
            <div className="grid gap-6 py-16 lg:grid-cols-[320px_1fr]">
              <div className="skeleton h-64 rounded-3xl" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="skeleton h-72 rounded-3xl" />
                ))}
              </div>
              <div className="col-span-full flex justify-center pt-4">
                <GlobeSpinner label="Reading the archives" />
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-20 text-center">
              <p className="text-[var(--color-rose)]">{error}</p>
              <button
                type="button"
                onClick={() => select(selected)}
                className="focus-ring mt-4 rounded-full border border-[var(--color-hairline)] px-4 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
              >
                Try again
              </button>
            </div>
          )}

          {status === "ready" && dossier && (
            <div className="grid gap-10 pt-8 lg:grid-cols-[340px_1fr]">
              <motion.aside
                variants={staggerParent}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start"
              >
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
              </motion.aside>

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
                    Nothing matches that filter yet. Widen the radius or switch
                    the category.
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
                    Some sources were slow to answer, so this list may be lighter
                    than usual. Try again shortly for the full picture.
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
