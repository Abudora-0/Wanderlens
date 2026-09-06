"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import type { Attraction } from "@/lib/types";
import { formatDistance } from "@/lib/format";

const CATEGORY_LABEL: Record<string, string> = {
  landmark: "Landmark",
  museum: "Museum",
  nature: "Nature",
  religious: "Sacred",
  history: "History",
  art: "Art",
  neighborhood: "Quarter",
  viewpoint: "Viewpoint",
  water: "Waterside",
  other: "Notable",
};

export function AttractionCard({
  attraction,
  index,
}: {
  attraction: Attraction;
  index: number;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = attraction.image && !broken;

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] transition-colors duration-300 hover:border-[var(--color-iris)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-abyss)]">
        {showImage ? (
          <Image
            src={attraction.image as string}
            alt={attraction.title}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 30vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setBroken(true)}
          />
        ) : (
          <PatternFallback seed={attraction.id} />
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
          {CATEGORY_LABEL[attraction.category] ?? attraction.category}
        </span>
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/45 text-xs font-semibold text-[var(--color-gold)]">
          {index + 1}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg leading-tight text-[var(--color-ink)]">
          {attraction.title}
        </h3>
        {attraction.distanceKm !== null && (
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--color-teal)]">
            {formatDistance(attraction.distanceKm)}
          </p>
        )}
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--color-ink-soft)]">
          {attraction.blurb}
        </p>
        {attraction.url && (
          <a
            href={attraction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
          >
            Read more
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path
                d="M3 9L9 3M9 3H4M9 3v5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>
    </motion.article>
  );
}

function PatternFallback({ seed }: { seed: string }) {
  // Keep the placeholder wash inside the Earth palette: teal (170) to ocean (215).
  const hue =
    160 + ([...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 60);
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 30% 30%, hsl(${hue} 55% 26%), var(--color-abyss) 70%)`,
      }}
    >
      <svg className="h-full w-full opacity-30" aria-hidden>
        <defs>
          <pattern
            id={`grid-${seed}`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0H0V24"
              fill="none"
              stroke="var(--color-ink-soft)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${seed})`} />
      </svg>
    </div>
  );
}
