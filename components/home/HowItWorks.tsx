"use client";

import { motion } from "motion/react";
import { staggerParent, fadeUp } from "@/lib/motion";

const STEPS = [
  {
    n: "01",
    title: "Pick a continent",
    body: "Start on the globe. Spin it, choose one of the six inhabited continents, and the map zooms in.",
  },
  {
    n: "02",
    title: "Drill down",
    body: "Continent to country to region to city. Each level lists the places travel guides agree are worth a stop.",
  },
  {
    n: "03",
    title: "Read the dossier",
    body: "Land on a city and get its best sights, live weather, a seven-day outlook and country facts on one page.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-[var(--color-hairline)] bg-[var(--color-abyss)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="font-display text-[clamp(1.7rem,4vw,2.4rem)] text-[var(--color-ink)]"
        >
          A guidebook index you can spin
        </motion.h2>
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              className="rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6"
            >
              <span className="font-display text-sm text-[var(--color-teal)]">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-lg text-[var(--color-ink)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {step.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
