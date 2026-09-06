import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { geocode } from "@/lib/sources/geocode";
import { buildDossier } from "@/lib/destination";
import { DestinationDossier } from "@/components/destination/DestinationDossier";
import type { PlaceKind } from "@/lib/types";

export const revalidate = 3600;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KINDS: PlaceKind[] = ["country", "region", "city", "area", "landmark"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function resolvePlace(
  slug: string,
  sp: Record<string, string | string[] | undefined>,
) {
  const nameParam = first(sp.name);
  let name = (nameParam ?? slug.replace(/-/g, " ")).trim();
  let country = first(sp.country) ?? null;
  let cc = first(sp.cc) ?? null;
  const kindParam = first(sp.kind) as PlaceKind | undefined;
  const kind: PlaceKind =
    kindParam && KINDS.includes(kindParam) ? kindParam : "city";

  let lat = Number.parseFloat(first(sp.lat) ?? "");
  let lon = Number.parseFloat(first(sp.lon) ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    // Build progressively shorter queries from the slug: the trailing words are
    // usually the country, so "delhi india" -> ["delhi india", "delhi"].
    const words = (nameParam ?? slug.replace(/-/g, " ")).trim().split(/\s+/);
    const queries: string[] = [];
    if (country) queries.push(`${name} ${country}`);
    for (let take = words.length; take >= 1; take -= 1) {
      queries.push(words.slice(0, take).join(" "));
    }

    let hit = null;
    for (const query of [...new Set(queries)]) {
      const hits = await geocode(query);
      if (hits[0]) {
        hit = hits[0];
        break;
      }
    }
    if (!hit) return null;

    lat = hit.latitude;
    lon = hit.longitude;
    cc = cc ?? hit.countryCode;
    country = country ?? hit.country ?? null;
    if (!nameParam) name = hit.name;
  }

  return { name, lat, lon, country, cc, kind };
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
  const name = (first(sp.name) ?? slug.replace(/-/g, " ")).replace(
    /\b\w/g,
    (c) => c.toUpperCase(),
  );
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
  if (!resolved) notFound();

  const dossier = await buildDossier({
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
