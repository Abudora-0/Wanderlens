"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { collections } from "@/lib/collections";
import { destinationHref } from "@/lib/destination-link";
import { fadeUp } from "@/lib/motion";

export function FeaturedStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mb-10 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
            Curated starts
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.7rem,4vw,2.4rem)] text-[var(--color-ink)]">
            Four moods, sixteen jumping-off points
          </h2>
        </div>
        <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">
          Tap any card for its full dossier, or open the globe and drill down a
          continent yourself.
        </p>
      </motion.div>

      <div className="space-y-12">
        {collections.map((collection) => (
          <div key={collection.id}>
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: collection.accent }}
              />
              <h3 className="font-display text-lg text-[var(--color-ink)]">
                {collection.title}
              </h3>
              <span className="text-sm text-[var(--color-ink-mute)]">
                {collection.tagline}
              </span>
            </div>

            <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:thin]">
              {collection.places.map((place) => (
                <Link
                  key={place.name}
                  href={destinationHref({
                    name: place.name,
                    country: place.country,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    kind: "city",
                  })}
                  style={{ "--accent": collection.accent } as React.CSSProperties}
                  className="group relative flex min-w-[220px] max-w-[220px] snap-start flex-col justify-between overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[color:var(--accent)] sm:min-w-[240px] sm:max-w-[240px]"
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
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
