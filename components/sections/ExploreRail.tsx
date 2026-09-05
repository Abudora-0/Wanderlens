"use client";

import { motion } from "motion/react";
import { collections } from "@/lib/collections";
import { useExperience } from "@/components/experience/store";
import { scrollToTarget } from "@/lib/scroll";
import type { GeoCandidate } from "@/lib/types";
import { fadeUp } from "@/lib/motion";

export function ExploreRail() {
  const { select } = useExperience();

  const pick = (
    place: { name: string; country: string; latitude: number; longitude: number },
  ) => {
    const candidate: GeoCandidate = {
      id: `collection-${place.name}`,
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
    scrollToTarget("#dossier");
  };

  return (
    <section
      id="explore"
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-24"
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mb-12 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
            Curated starts
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-ink)] sm:text-4xl">
            Not sure where to point the lens
          </h2>
        </div>
        <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">
          Four moods, sixteen jumping-off points. Pick one and Wanderlens builds
          the full picture around it.
        </p>
      </motion.div>

      <div className="space-y-16">
        {collections.map((collection) => (
          <Row key={collection.id} collection={collection} onPick={pick} />
        ))}
      </div>
    </section>
  );
}

function Row({
  collection,
  onPick,
}: {
  collection: (typeof collections)[number];
  onPick: (place: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: collection.accent }}
        />
        <h3 className="font-display text-xl text-[var(--color-ink)]">
          {collection.title}
        </h3>
        <span className="text-sm text-[var(--color-ink-mute)]">
          {collection.tagline}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {collection.places.map((place) => (
          <button
            key={place.name}
            type="button"
            onClick={() => onPick(place)}
            className="group relative flex min-w-[240px] flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 text-left transition-colors hover:border-[color:var(--accent)]"
            style={
              { "--accent": collection.accent } as React.CSSProperties
            }
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(400px circle at 20% 0%, ${collection.accent}22, transparent 70%)`,
              }}
            />
            <div className="relative">
              <p className="font-display text-lg text-[var(--color-ink)]">
                {place.name}
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
                {place.country}
              </p>
            </div>
            <p className="relative mt-6 text-sm text-[var(--color-ink-soft)]">
              {place.blurb}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
