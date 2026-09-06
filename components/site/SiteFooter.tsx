import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { continents } from "@/lib/continents";

const DATA = [
  { label: "Wikivoyage", url: "https://en.wikivoyage.org" },
  { label: "Wikipedia", url: "https://en.wikipedia.org" },
  { label: "Wikidata", url: "https://www.wikidata.org" },
  { label: "Open-Meteo", url: "https://open-meteo.com" },
  { label: "Natural Earth", url: "https://www.naturalearthdata.com" },
  { label: "World Bank", url: "https://data.worldbank.org" },
];

const PROJECT = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Source on GitHub", href: "https://github.com/Abudora-0/Wanderlens", external: true },
  { label: "MIT license", href: "https://github.com/Abudora-0/Wanderlens/blob/main/LICENSE", external: true },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--color-hairline)] bg-[var(--color-abyss)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <Logo size={34} animated={false} />
            <span className="font-display text-lg text-[var(--color-ink)]">
              Wanderlens
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            A travel discovery lens built on open data. Spin the globe, drill down
            a continent, and find the places worth the trip.
          </p>
        </div>

        <FooterCol title="Explore">
          {continents.map((continent) => (
            <li key={continent.id}>
              <Link
                href={`/explore?continent=${continent.id}`}
                className="footer-link"
              >
                {continent.name}
              </Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Project">
          {PROJECT.map((item) => (
            <li key={item.label}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className="footer-link">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Data sources">
          {DATA.map((item) => (
            <li key={item.label}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {item.label}
              </a>
            </li>
          ))}
        </FooterCol>
      </div>

      <div className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[var(--color-ink-mute)] sm:flex-row">
          <p>
            MIT licensed. Guide text and map data keep their own open licenses.
          </p>
          <p>Not affiliated with any tourism board.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-mute)]">
        {title}
      </p>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}
