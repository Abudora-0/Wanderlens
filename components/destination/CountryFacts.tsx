"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { CountryFacts as CountryFactsType } from "@/lib/types";
import { Counter } from "@/components/ui/Counter";
import { formatCompact } from "@/lib/format";
import { fadeUp, staggerParent } from "@/lib/motion";

export function CountryFacts({ country }: { country: CountryFactsType }) {
  const stats: { label: string; value: number; format: (n: number) => string }[] =
    [];

  if (country.population !== null) {
    stats.push({
      label: "People",
      value: country.population,
      format: (n) => formatCompact(n),
    });
  }
  if (country.area !== null) {
    stats.push({
      label: "Square km",
      value: country.area,
      format: (n) => formatCompact(n),
    });
  }
  stats.push({
    label: "Languages",
    value: country.languages.length,
    format: (n) => String(Math.round(n)),
  });
  stats.push({
    label: "Currencies",
    value: country.currencies.length,
    format: (n) => String(Math.round(n)),
  });

  return (
    <motion.section
      variants={fadeUp}
      className="surface-card rounded-3xl p-6"
      aria-label={`About ${country.name}`}
    >
      <div className="flex items-center gap-3">
        {country.flagSvg && (
          <Image
            src={country.flagSvg}
            alt=""
            aria-hidden
            width={36}
            height={24}
            unoptimized
            className="h-6 w-9 rounded-sm border border-[var(--color-hairline)] object-cover"
          />
        )}
        <div>
          <h3 className="font-display text-lg text-[var(--color-ink)]">
            {country.name}
          </h3>
          <p className="text-xs text-[var(--color-ink-mute)]">
            {[country.subregion, country.region].filter(Boolean).join(" , ")}
          </p>
        </div>
      </div>

      <motion.dl
        variants={staggerParent}
        className="mt-5 grid grid-cols-2 gap-3"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-3"
          >
            <dd className="font-display text-2xl text-[var(--color-teal)]">
              <Counter value={stat.value} format={stat.format} />
            </dd>
            <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
              {stat.label}
            </dt>
          </motion.div>
        ))}
      </motion.dl>

      <ul className="mt-5 space-y-2 text-sm text-[var(--color-ink-soft)]">
        {country.capital && (
          <FactRow label="Capital" value={country.capital} />
        )}
        {country.currencies.length > 0 && (
          <FactRow label="Currency" value={country.currencies.join(", ")} />
        )}
        {country.languages.length > 0 && (
          <FactRow
            label="Spoken"
            value={country.languages.slice(0, 4).join(", ")}
          />
        )}
        {country.callingCode && (
          <FactRow label="Dial code" value={country.callingCode} />
        )}
        {country.mapUrl && (
          <li className="flex justify-between gap-4 pt-1">
            <span className="text-[var(--color-ink-mute)]">Map</span>
            <a
              href={country.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-[var(--color-teal)] underline"
            >
              Open in OpenStreetMap
            </a>
          </li>
        )}
      </ul>
    </motion.section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-4 border-b border-[var(--color-hairline)] pb-2 last:border-0">
      <span className="text-[var(--color-ink-mute)]">{label}</span>
      <span className="text-right text-[var(--color-ink)]">{value}</span>
    </li>
  );
}
