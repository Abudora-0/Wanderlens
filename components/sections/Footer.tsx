"use client";

import { motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";

const SOURCES = [
  { label: "Open-Meteo", url: "https://open-meteo.com" },
  { label: "Wikivoyage", url: "https://en.wikivoyage.org" },
  { label: "Wikipedia", url: "https://en.wikipedia.org" },
  { label: "REST Countries", url: "https://restcountries.com" },
  { label: "Natural Earth", url: "https://www.naturalearthdata.com" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-hairline)] bg-[var(--color-abyss)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <Logo size={36} />
            <span className="font-display text-lg text-[var(--color-ink)]">
              Wanderlens
            </span>
          </motion.div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            A travel discovery lens built on open data. No trackers, no login,
            no affiliate links. Point it anywhere.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
              Built with
            </p>
            <ul className="space-y-2 text-[var(--color-ink-soft)]">
              <li>Next.js</li>
              <li>three.js globe</li>
              <li>Motion</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
              Data
            </p>
            <ul className="space-y-2">
              {SOURCES.map((source) => (
                <li key={source.label}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring rounded text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-teal)]"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[var(--color-ink-mute)] sm:flex-row">
          <p>MIT licensed. Map and text data under their own open licenses.</p>
          <a
            href="https://github.com/Abudora-0/wanderlens"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded transition-colors hover:text-[var(--color-ink-soft)]"
          >
            github.com/Abudora-0/wanderlens
          </a>
        </div>
      </div>
    </footer>
  );
}
