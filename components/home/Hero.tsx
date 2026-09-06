"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { AuroraField } from "@/components/home/AuroraField";
import { SearchField } from "@/components/search/SearchField";
import { destinationHref } from "@/lib/destination-link";
import { staggerParent, wordReveal, fadeUp } from "@/lib/motion";

const EarthGlobe = dynamic(
  () => import("@/components/globe/EarthGlobe").then((m) => m.EarthGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto aspect-square w-full max-w-[420px] rounded-full bg-[radial-gradient(circle_at_34%_30%,#2f7fd8,#0c2f66_70%)] opacity-60" />
    ),
  },
);

const LINE_ONE = ["Spin", "the", "globe."];
const LINE_TWO = ["Find", "where", "to", "go."];

const QUICK = [
  { name: "Kyoto", country: "Japan", latitude: 35.0116, longitude: 135.7681 },
  { name: "Lisbon", country: "Portugal", latitude: 38.7223, longitude: -9.1393 },
  { name: "Cusco", country: "Peru", latitude: -13.532, longitude: -71.967 },
  { name: "Cape Town", country: "South Africa", latitude: -33.925, longitude: 18.424 },
  { name: "Reykjavik", country: "Iceland", latitude: 64.147, longitude: -21.94 },
];

function Word({ word }: { word: string }) {
  return (
    <motion.span variants={wordReveal} className="mr-[0.24em] inline-block">
      {word === "globe." ? (
        <span className="text-aurora">{word}</span>
      ) : (
        word
      )}
    </motion.span>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <AuroraField />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-void)]" />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-5 pb-16 pt-24 sm:pt-28 lg:min-h-[90vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-center lg:gap-16 lg:pt-24 xl:gap-24">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="min-w-0"
        >
          <motion.p
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)]/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-teal)]" />
            Curated from open travel guides
          </motion.p>

          <h1
            className="font-display text-[clamp(2.3rem,6vw,3.6rem)] leading-[1.05] text-[var(--color-ink)]"
            style={{ perspective: 800 }}
          >
            <span className="block">
              {LINE_ONE.map((w, i) => (
                <Word key={i} word={w} />
              ))}
            </span>
            <span className="block">
              {LINE_TWO.map((w, i) => (
                <Word key={i} word={w} />
              ))}
            </span>
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg"
          >
            Pick a continent, drill into a country, then a region, then a city.
            Every stop is a place travellers and guidebooks actually single out,
            with live weather and country context on arrival.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 max-w-lg">
            <SearchField />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-mute)]"
          >
            <span className="uppercase tracking-[0.16em]">Try</span>
            {QUICK.map((place) => (
              <Link
                key={place.name}
                href={destinationHref({ ...place, kind: "city" })}
                className="focus-ring rounded-full border border-[var(--color-hairline)] px-3 py-1 transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
              >
                {place.name}
              </Link>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8">
            <Link
              href="/explore"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-void)] transition-transform hover:-translate-y-0.5"
            >
              Open the globe
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path
                  d="M3 7h8M7 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mx-auto flex w-[82%] max-w-[340px] items-center justify-center lg:w-full lg:max-w-none"
        >
          <EarthGlobe />
        </motion.div>
      </div>
    </section>
  );
}
