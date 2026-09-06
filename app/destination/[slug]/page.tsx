import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { geocode } from "@/lib/sources/geocode";
import { buildDossier } from "@/lib/destination";
import { DestinationDossier } from "@/components/destination/DestinationDossier";
import { DestinationRetry } from "@/components/destination/DestinationRetry";
import type { PlaceKind } from "@/lib/types";

export const revalidate = 3600;
export const maxDuration = 30;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KINDS: PlaceKind[] = ["country", "region", "city", "area", "landmark"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

type Resolved =
  | { ok: true; name: string; lat: number; lon: number; country: string | null; cc: string | null; kind: PlaceKind }
  | { ok: false; reason: "missing" | "transient"; name: string };

async function resolvePlace(
  slug: string,
  sp: Record<string, string | string[] | undefined>,
): Promise<Resolved> {
  const nameParam = first(sp.name);
  let name = (nameParam ?? slug.replace(/-/g, " ")).trim();
  let country = first(sp.country) ?? null;
  let cc = first(sp.cc) ?? null;
  const kindParam = first(sp.kind) as PlaceKind | undefined;
  const kind: PlaceKind =
    kindParam && KINDS.includes(kindParam) ? kindParam : "city";

  const lat = Number.parseFloat(first(sp.lat) ?? "");
  const lon = Number.parseFloat(first(sp.lon) ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { ok: true, name, lat, lon, country, cc, kind };
  }

  const words = (nameParam ?? slug.replace(/-/g, " ")).trim().split(/\s+/);
  const queries = new Set<string>();
  if (country) queries.add(`${name} ${country}`);
  for (let take = Math.min(words.length, 4); take >= 1; take -= 1) {
    queries.add(words.slice(0, take).join(" "));
  }

  let threw = false;
  for (const query of queries) {
    try {
      const hits = await geocode(query);
      if (hits[0]) {
        const hit = hits[0];
        cc = cc ?? hit.countryCode;
        country = country ?? hit.country ?? null;
        if (!nameParam) name = hit.name;
        return {
          ok: true,
          name,
          lat: hit.latitude,
          lon: hit.longitude,
          country,
          cc,
          kind,
        };
      }
    } catch {
      threw = true;
    }
  }

  return { ok: false, reason: threw ? "transient" : "missing", name: titleCase(name) };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const name = titleCase(first(sp.name) ?? slug.replace(/-/g, " "));
  return {
    title: `${name} - places to visit`,
    description: `The best places to visit in ${name}, with live weather and country context. Curated from open travel guides.`,
  };
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const resolved = await resolvePlace(slug, sp);

  if (!resolved.ok) {
    if (resolved.reason === "missing") notFound();
    return <DestinationRetry name={resolved.name} />;
  }

  let dossier;
  try {
    dossier = await buildDossier({
      name: resolved.name,
      displayName: resolved.country
        ? `${resolved.name}, ${resolved.country}`
        : resolved.name,
      latitude: resolved.lat,
      longitude: resolved.lon,
      kind: resolved.kind,
      countryCode: resolved.cc,
      country: resolved.country,
    });
  } catch {
    return <DestinationRetry name={titleCase(resolved.name)} />;
  }

  if (dossier.attractions.length === 0) {
    return <DestinationRetry name={titleCase(resolved.name)} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-28">
      <Link
        href="/explore"
        className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-teal)] hover:text-[var(--color-ink)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M9 6H3M6 3 3 6l3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to explore
      </Link>

      <header className="mt-6 border-b border-[var(--color-hairline)] pb-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
          {dossier.place.kind}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3.2rem)] text-[var(--color-ink)]">
          {dossier.place.name}
        </h1>
        {dossier.place.displayName !== dossier.place.name && (
          <p className="mt-1 text-sm text-[var(--color-ink-mute)]">
            {dossier.place.displayName}
          </p>
        )}
      </header>

      <DestinationDossier dossier={dossier} />
    </div>
  );
}
