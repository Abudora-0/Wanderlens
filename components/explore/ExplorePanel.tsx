"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { PlaceLink, PlaceNode } from "@/lib/types";
import { destinationHref } from "@/lib/destination-link";
import { continents } from "@/lib/continents";

interface Crumb {
  label: string;
  href: string;
}

interface ExplorePanelProps {
  crumbs: Crumb[];
  loading: boolean;
  error: string | null;
  /** null = show the continent picker */
  node: PlaceNode | null;
  showContinentPicker: boolean;
  countryList: string[];
  countryHref: (name: string) => string;
  regionHref: (article: string) => string;
  currentCountry: string | null;
}

export function ExplorePanel({
  crumbs,
  loading,
  error,
  node,
  showContinentPicker,
  countryList,
  countryHref,
  regionHref,
  currentCountry,
}: ExplorePanelProps) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-wrap items-center gap-1 pb-4 text-xs text-[var(--color-ink-mute)]">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-[var(--color-ink)]">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="focus-ring rounded transition-colors hover:text-[var(--color-ink)]"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {showContinentPicker && (
          <Section title="Choose a continent">
            <div className="grid gap-3 sm:grid-cols-2">
              {continents.map((continent) => (
                <Link
                  key={continent.id}
                  href={`/explore?continent=${continent.id}`}
                  className="focus-ring group rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-teal)]"
                >
                  <span className="font-display text-base text-[var(--color-ink)]">
                    {continent.name}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {continent.blurb}
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {loading && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="rounded-2xl border border-dashed border-[var(--color-hairline)] p-6 text-sm text-[var(--color-ink-mute)]">
            {error}
          </p>
        )}

        {!loading && !error && node && (
          <div className="space-y-8">
            {node.summary && (
              <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {node.summary}
              </p>
            )}

            {countryList.length > 0 && (
              <Section title={`Countries (${countryList.length})`}>
                <div className="flex flex-wrap gap-2">
                  {countryList.map((name) => (
                    <Link
                      key={name}
                      href={countryHref(name)}
                      className="focus-ring rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {node.regions.length > 0 && (
              <Section title="Regions">
                <div className="grid gap-3">
                  {node.regions.map((region) => (
                    <Link
                      key={region.article}
                      href={regionHref(region.article)}
                      className="focus-ring group rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-teal)]"
                    >
                      <span className="flex items-center gap-2">
                        {region.accent && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: region.accent }}
                          />
                        )}
                        <span className="font-display text-base text-[var(--color-ink)]">
                          {region.name}
                        </span>
                      </span>
                      {region.blurb && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                          {region.blurb}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {node.cities.length > 0 && (
              <Section title="Cities">
                <DestinationList links={node.cities} country={currentCountry} />
              </Section>
            )}

            {node.otherDestinations.length > 0 && (
              <Section title="Other destinations">
                <DestinationList
                  links={node.otherDestinations}
                  country={currentCountry}
                />
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function DestinationList({
  links,
  country,
}: {
  links: PlaceLink[];
  country: string | null;
}) {
  return (
    <div className="grid gap-3">
      {links.map((link) => (
        <Link
          key={link.name}
          href={destinationHref({
            name: link.name,
            country,
            latitude: link.latitude,
            longitude: link.longitude,
            kind: "city",
          })}
          className="focus-ring group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-gold)]"
        >
          <span className="min-w-0">
            <span className="block font-display text-base text-[var(--color-ink)]">
              {link.name}
            </span>
            {link.blurb && (
              <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-soft)]">
                {link.blurb}
              </span>
            )}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden
            className="shrink-0 text-[var(--color-ink-mute)] transition-colors group-hover:text-[var(--color-gold)]"
          >
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}
