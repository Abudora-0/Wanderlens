import type { NodeKind, PlaceLink, PlaceNode } from "@/lib/types";
import {
  extractMarkers,
  fetchWikivoyageSummary,
  fetchWikivoyageWikitext,
  firstLinkTarget,
  parseTemplateAt,
  splitSections,
  stripWikiMarkup,
  toFields,
} from "@/lib/sources/wikitext";
import { coordsForWikidata } from "@/lib/sources/wikidata";

function commonsImage(fileName: string, width = 1600): string {
  const clean = fileName.replace(/^(file|image):/i, "").trim();
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=${width}`;
}

function parseBanner(intro: string): string | null {
  const idx = intro.toLowerCase().indexOf("{{pagebanner");
  if (idx === -1) return null;
  const parsed = parseTemplateAt(intro, idx);
  if (!parsed) return null;
  const first = parsed.fields[1]?.trim();
  if (!first || first.includes("=")) return null;
  return commonsImage(first);
}

function parseRegionlist(section: string): PlaceLink[] {
  const idx = section.toLowerCase().indexOf("{{regionlist");
  if (idx === -1) return [];
  const parsed = parseTemplateAt(section, idx);
  if (!parsed) return [];
  const fields = toFields(parsed.fields);
  const out: PlaceLink[] = [];
  for (let i = 1; i <= 20; i += 1) {
    const rawName = fields[`region${i}name`];
    if (!rawName) continue;
    const article = firstLinkTarget(rawName);
    if (!article) continue;
    const blurb = stripWikiMarkup(fields[`region${i}description`] ?? "");
    out.push({
      name: stripWikiMarkup(rawName),
      article,
      blurb: blurb.length > 180 ? `${blurb.slice(0, 177).trimEnd()}...` : blurb,
      latitude: null,
      longitude: null,
      accent: (fields[`region${i}color`] ?? "").trim() || undefined,
    });
  }
  return out;
}

function parseBulletLinks(section: string): PlaceLink[] {
  const out: PlaceLink[] = [];
  const seen = new Set<string>();
  for (const line of section.split("\n")) {
    const m = line.match(/^\*+\s*(?:''')?\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/);
    if (!m) continue;
    const article = m[1].trim();
    if (seen.has(article) || /^(list of|category:|image:|file:)/i.test(article)) {
      continue;
    }
    seen.add(article);
    const after = line.replace(/^\*+\s*(?:''')?\[\[[^\]]+\]\]/, "");
    out.push({
      name: (m[2] ?? m[1]).trim(),
      article,
      blurb: stripWikiMarkup(after.replace(/^\s*[-:–—]\s*/, "")),
      latitude: null,
      longitude: null,
    });
  }
  return out;
}

function markersToLinks(section: string): PlaceLink[] {
  return extractMarkers(section, ["{{marker", "{{city"]).map((m) => ({
    name: m.name,
    article: m.target ?? m.name,
    blurb: m.blurb,
    latitude: m.latitude,
    longitude: m.longitude,
    accent: m.wikidata ?? undefined,
  }));
}

async function backfillCoords(links: PlaceLink[]): Promise<PlaceLink[]> {
  const needing = links.filter(
    (l) => l.latitude === null && l.accent?.startsWith("Q"),
  );
  await Promise.all(
    needing.slice(0, 8).map(async (link) => {
      const coords = await coordsForWikidata(link.accent as string);
      if (coords) {
        link.latitude = coords.latitude;
        link.longitude = coords.longitude;
      }
    }),
  );
  return links.map((l) => ({
    ...l,
    accent: l.accent?.startsWith("Q") ? undefined : l.accent,
  }));
}

export async function getPlaceNode(
  title: string,
  kindHint?: NodeKind,
): Promise<PlaceNode | null> {
  const [article, summary] = await Promise.all([
    fetchWikivoyageWikitext(title),
    fetchWikivoyageSummary(title),
  ]);
  if (!article) return null;

  const { intro, sections } = splitSections(article.wikitext);
  const regionsSection =
    sections["regions"] ?? sections["countries"] ?? sections["territories"];
  const citiesSection = sections["cities"] ?? "";
  const otherSection = sections["other destinations"] ?? "";

  let regions: PlaceLink[] = [];
  if (regionsSection) {
    regions = parseRegionlist(regionsSection);
    if (regions.length === 0) regions = parseBulletLinks(regionsSection);
  }

  const [cities, other] = await Promise.all([
    backfillCoords(markersToLinks(citiesSection)),
    backfillCoords(markersToLinks(otherSection)),
  ]);

  const kind: NodeKind =
    kindHint ??
    (regions.length > 3 ? "country" : cities.length > 0 ? "region" : "city");

  return {
    title: article.title,
    kind,
    summary,
    banner: parseBanner(intro),
    regions: regions.slice(0, 14),
    cities: cities.slice(0, 12),
    otherDestinations: other.slice(0, 12),
  };
}
