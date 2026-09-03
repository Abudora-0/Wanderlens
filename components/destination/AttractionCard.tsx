"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { Attraction } from "@/lib/types";
import { formatDistance } from "@/lib/format";
import { usePointerFine } from "@/lib/hooks";

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
  const pointerFine = usePointerFine();
  const cardRef = useRef<HTMLElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [broken, setBroken] = useState(false);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(240px circle at ${x}% ${y}%, rgba(124,108,245,0.22), transparent 70%)`,
  );

  const onEnter = () => {
    if (!pointerFine || !cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
  };

  const onMove = (event: React.MouseEvent) => {
    const rect = rectRef.current;
    if (!pointerFine || !rect) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 10);
    rotateX.set((0.5 - py) * 10);
    glowX.set(px * 100);
    glowY.set(py * 100);
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const showImage = attraction.image && !broken;

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4) }}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow }}
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-abyss)]">
        {showImage ? (
          <Image
            src={attraction.image as string}
            alt={attraction.title}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setBroken(true)}
          />
        ) : (
          <PatternFallback seed={attraction.id} />
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur">
          {CATEGORY_LABEL[attraction.category] ?? attraction.category}
        </span>
        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/40 text-xs font-semibold text-[var(--color-gold)] backdrop-blur">
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
  const hue = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 30% 30%, hsl(${hue} 60% 30%), var(--color-abyss) 70%)`,
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
