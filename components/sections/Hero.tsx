"use client";

import { motion } from "motion/react";
import { AuroraField } from "@/components/sections/AuroraField";
import { GlobePicker } from "@/components/globe/GlobePicker";
import { SearchField } from "@/components/experience/SearchField";
import { useExperience } from "@/components/experience/store";
import { staggerParent, wordReveal, fadeUp } from "@/lib/motion";

const HEADLINE = ["Focus", "the", "globe.", "Find", "where", "to", "go."];
const QUICK = ["Kyoto", "Patagonia", "Kerala", "Faroe Islands", "Oaxaca"];

export function Hero() {
  const { select, selected } = useExperience();

  const quickPick = async (term: string) => {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.candidates?.[0]) select(data.candidates[0]);
    } catch {
      // ignore, the search field still works
    }
  };

  return (
    <section className="relative isolate overflow-hidden">
      <AuroraField />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-void)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="max-w-xl"
        >
          <motion.p
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)]/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-teal)]" />
            Open travel data, one lens
          </motion.p>

          <h1
            className="font-display text-4xl leading-[1.05] text-[var(--color-ink)] sm:text-6xl"
            style={{ perspective: 800 }}
          >
            {HEADLINE.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                variants={wordReveal}
                className="mr-[0.28em] inline-block"
              >
                {word === "globe." ? (
                  <span className="text-aurora">{word}</span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg leading-relaxed text-[var(--color-ink-soft)]"
          >
            Name a country, a city, a coastline or a national park. Wanderlens
            pulls the places locals and guidebooks agree are worth the trip, then
            layers on live weather and country context.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8">
            <SearchField />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-mute)]"
          >
            <span className="uppercase tracking-[0.16em]">Try</span>
            {QUICK.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => quickPick(term)}
                className="focus-ring rounded-full border border-[var(--color-hairline)] px-3 py-1 transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
              >
                {term}
              </button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative flex items-center justify-center py-6"
        >
          <GlobePicker />
        </motion.div>
      </div>

      {!selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="relative mx-auto flex w-full max-w-6xl justify-center pb-10"
        >
          <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--color-ink-mute)]">
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              scroll
            </motion.span>
            to explore collections
          </span>
        </motion.div>
      )}
    </section>
  );
}
