import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { geocode } from "@/lib/sources/geocode";
import { buildDossier } from "@/lib/destination";
import { DestinationDossier } from "@/components/destination/DestinationDossier";
import { DestinationRetry } from "@/components/destination/DestinationRetry";
import type { PlaceKind } from "@/lib/types";

export const revalidate = 3600;
export const maxDuration = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const KINDS: PlaceKind[] = ["country", "region", "city", "area", "landmark"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Parsed {
  slug: string;
  name: string;
  hasNameParam: boolean;
  lat: number | null;
  lon: number | null;
  country: string | null;
  cc: string | null;
  kind: PlaceKind;
}

function parseParams(
  slug: string,
  sp: Record<string, string | string[] | undefined>,
): Parsed {
  const nameParam = first(sp.name)?.trim();
  const name = (nameParam || slug.replace(/-/g, " ")).trim();
  const country = first(sp.country) ?? null;
  const cc = first(sp.cc) ?? null;
  const kindParam = first(sp.kind) as PlaceKind | undefined;
  const kind: PlaceKind =
    kindParam && KINDS.includes(kindParam) ? kindParam : "city";

  const latRaw = Number.parseFloat(first(sp.lat) ?? "");
  const lonRaw = Number.parseFloat(first(sp.lon) ?? "");
  const hasCoords = Number.isFinite(latRaw) && Number.isFinite(lonRaw);

  return {
    slug,
    name: titleCase(name),
    hasNameParam: Boolean(nameParam),
    lat: hasCoords ? latRaw : null,
    lon: hasCoords ? lonRaw : null,
    country,
    cc,
    kind,
  };
}

type Resolved =
  | {
      ok: true;
      name: string;
      lat: number;
      lon: number;
      country: string | null;
      cc: string | null;
      kind: PlaceKind;
    }
  | { ok: false; reason: "missing" | "transient"; name: string };

async function resolvePlace(parsed: Parsed): Promise<Resolved> {
  if (parsed.lat !== null && parsed.lon !== null) {
    return {
      ok: true,
      name: parsed.name,
      lat: parsed.lat,
      lon: parsed.lon,
      country: parsed.country,
      cc: parsed.cc,
      kind: parsed.kind,
    };
  }

  const words = parsed.name.split(/\s+/);
  const queries = new Set<string>();
  if (parsed.country) queries.add(`${parsed.name} ${parsed.country}`);
  for (let take = Math.min(words.length, 4); take >= 1; take -= 1) {
    queries.add(words.slice(0, take).join(" "));
  }

  let threw = false;
  for (const query of queries) {
    try {
      const hits = await geocode(query);
      const hit = hits[0];
      if (hit) {
        return {
          ok: true,
          name: parsed.hasNameParam ? parsed.name : titleCase(hit.name),
          lat: hit.latitude,
          lon: hit.longitude,
          country: parsed.country ?? hit.country ?? null,
          cc: parsed.cc ?? hit.countryCode,
          kind: parsed.kind,
        };
      }
    } catch {
      threw = true;
    }
  }

  return { ok: false, reason: threw ? "transient" : "missing", name: parsed.name };
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
  const parsed = parseParams(slug, sp);

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

      <Suspense fallback={<DossierSkeleton parsed={parsed} />}>
        <DossierContent parsed={parsed} />
      </Suspense>
    </div>
  );
}

async function DossierContent({ parsed }: { parsed: Parsed }) {
  const resolved = await resolvePlace(parsed);

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
    <>
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
    </>
  );
}

function DossierSkeleton({ parsed }: { parsed: Parsed }) {
  return (
    <div className="animate-pulse">
      <header className="mt-6 border-b border-[var(--color-hairline)] pb-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
          {parsed.kind}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3.2rem)] text-[var(--color-ink)]">
          {parsed.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-ink-mute)]">
          Gathering places worth your time...
        </p>
      </header>

      <div className="grid gap-8 pt-8 lg:grid-cols-[340px_1fr] lg:gap-10">
        <div className="flex flex-col gap-4">
          <div className="h-24 rounded-2xl bg-[var(--color-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--color-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--color-surface)]" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
