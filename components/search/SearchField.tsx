"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { GeoCandidate } from "@/lib/types";
import { destinationHref } from "@/lib/destination-link";

const KIND_LABEL: Record<string, string> = {
  country: "Country",
  region: "Region",
  city: "City",
  area: "Area",
  landmark: "Landmark",
};

export function SearchField({
  size = "lg",
  autoFocus = false,
  placeholder = "Search a city, country or region...",
}: {
  size?: "lg" | "sm";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<GeoCandidate[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const runSearch = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    controllerRef.current?.abort();

    if (trimmed.length < 2) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      controllerRef.current = controller;
      fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { candidates: GeoCandidate[] }) => {
          setCandidates(data.candidates ?? []);
          setActiveIndex(0);
          setOpen(true);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setQuery(next);
    runSearch(next);
  };

  const choose = (candidate: GeoCandidate | undefined) => {
    if (!candidate) return;
    setOpen(false);
    setQuery(candidate.displayName);
    router.push(
      destinationHref({
        name: candidate.name,
        country: candidate.country || undefined,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        countryCode: candidate.countryCode,
        kind: candidate.kind === "landmark" ? "area" : candidate.kind,
      }),
    );
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, candidates.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(candidates[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const big = size === "lg";

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`group flex items-center gap-3 rounded-2xl border border-[var(--color-hairline)] bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)] transition-colors focus-within:border-[var(--color-ocean)] ${
          big ? "px-4 py-3.5 sm:px-5 sm:py-4" : "px-4 py-2.5"
        }`}
      >
        <SearchGlyph spinning={loading} big={big} />
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={handleChange}
          onFocus={() => candidates.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          className={`w-full bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] focus:outline-none ${
            big ? "text-base sm:text-lg" : "text-sm"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCandidates([]);
            }}
            aria-label="Clear search"
            className="focus-ring rounded-md p-1 text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && candidates.length > 0 && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-40 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface-raised)] p-1.5 shadow-[var(--shadow-lift)]"
          >
            {candidates.map((candidate, index) => (
              <li
                key={candidate.id}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(candidate)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    index === activeIndex
                      ? "bg-[color-mix(in_oklab,var(--color-ocean)_20%,transparent)]"
                      : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[var(--color-ink)]">
                      {candidate.name}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-ink-mute)]">
                      {candidate.displayName}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
                    {KIND_LABEL[candidate.kind] ?? candidate.kind}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchGlyph({ spinning, big }: { spinning: boolean; big: boolean }) {
  const dimension = big ? 22 : 18;
  return (
    <motion.svg
      width={dimension}
      height={dimension}
      viewBox="0 0 22 22"
      className="shrink-0 text-[var(--color-teal)]"
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={
        spinning
          ? { duration: 1.1, ease: "linear", repeat: Infinity }
          : { duration: 0.3 }
      }
      aria-hidden
    >
      <circle
        cx="9.5"
        cy="9.5"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 14.5L19 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="9.5" r="2" fill="var(--color-ocean)" />
    </motion.svg>
  );
}
