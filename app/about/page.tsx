import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Wanderlens turns open travel guides into a globe you can drill down, and the data behind it.",
};

const SOURCES = [
  {
    label: "Wikivoyage",
    role: "The hierarchy and the picks",
    detail:
      "Every continent, country and region article names the cities and destinations its editors consider worth the trip. That editorial shortlist is what you drill through.",
    license: "CC BY-SA 4.0",
  },
  {
    label: "Wikipedia",
    role: "Sights and photos",
    detail:
      "Geo-tagged articles around a city fill in individual sights, each with a short extract and a photo.",
    license: "CC BY-SA 4.0",
  },
  {
    label: "Wikidata",
    role: "Coordinates",
    detail: "Resolves the exact location of a place when its guide entry omits one.",
    license: "CC0",
  },
  {
    label: "Open-Meteo",
    role: "Geocoding and weather",
    detail: "Turns a search term into a point, and gives current conditions plus a seven-day outlook.",
    license: "CC BY 4.0",
  },
  {
    label: "Natural Earth",
    role: "Country borders",
    detail: "Public-domain country outlines drawn on the globe.",
    license: "Public domain",
  },
  {
    label: "mledoze/countries + World Bank",
    role: "Country facts",
    detail: "Capital, languages, currencies and dialling code, plus the latest population figure.",
    license: "ODbL 1.0 / CC BY 4.0",
  },
];

const STACK = [
  ["Framework", "Next.js App Router, React, TypeScript"],
  ["Styling", "Tailwind CSS v4 with a hand-built token layer"],
  ["Globe", "react-globe.gl on three.js, loaded only on the Explore page"],
  ["Animation", "Motion (Framer Motion)"],
  ["Hosting", "Vercel, no database, no environment variables"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-28">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-teal)]">
        About
      </p>
      <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] text-[var(--color-ink)]">
        A guidebook index, rendered on a globe
      </h1>
      <p className="mt-6 text-base leading-relaxed text-[var(--color-ink-soft)]">
        Most travel sites bury the good places under ads, rankings and
        affiliate links. Wanderlens does one thing: it takes the shortlists that
        volunteer editors have already written for every country and region on
        Earth, and lets you spin through them. Continent, country, region, city.
        Land on a city and you get its sights, its weather and a few facts about
        the country you just entered.
      </p>

      <h2 className="mt-14 font-display text-2xl text-[var(--color-ink)]">
        Where the recommendations come from
      </h2>
      <div className="mt-6 space-y-4">
        {SOURCES.map((source) => (
          <div
            key={source.label}
            className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-base text-[var(--color-ink)]">
                {source.label}
              </h3>
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                {source.role} &middot; {source.license}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {source.detail}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl text-[var(--color-ink)]">
        Built with
      </h2>
      <dl className="mt-6 divide-y divide-[var(--color-hairline)] rounded-2xl border border-[var(--color-hairline)]">
        {STACK.map(([term, value]) => (
          <div
            key={term}
            className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between"
          >
            <dt className="text-sm text-[var(--color-ink-mute)]">{term}</dt>
            <dd className="text-sm text-[var(--color-ink)] sm:text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-12 text-sm text-[var(--color-ink-soft)]">
        Wanderlens is open source under the MIT license. Read the code, file an
        issue or fork it on{" "}
        <a
          href="https://github.com/Abudora-0/Wanderlens"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-teal)] underline"
        >
          GitHub
        </a>
        , or{" "}
        <Link href="/explore" className="text-[var(--color-teal)] underline">
          open the globe
        </Link>
        .
      </p>
    </div>
  );
}
