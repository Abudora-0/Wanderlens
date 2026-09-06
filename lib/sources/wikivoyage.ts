import type { Attraction, AttractionCategory } from "@/lib/types";
import { haversineKm } from "@/lib/format";
import { timedFetch } from "@/lib/sources/http";
import {
  parseTemplateAt,
  stripWikiMarkup,
  toFields,
  fetchWikivoyageSummary,
} from "@/lib/sources/wikitext";

interface ParseResponse {
  parse?: {
    title?: string;
    wikitext?: { "*"?: string };
  };
  error?: unknown;
}

interface RawListing {
  kind: "see" | "do" | "listing" | "marker";
  fields: Record<string, string>;
}

const LISTING_TOKENS = ["{{see", "{{do", "{{listing", "{{marker"];

function extractListings(wikitext: string): RawListing[] {
  const listings: RawListing[] = [];
  const lower = wikitext.toLowerCase();
  let cursor = 0;
  while (cursor < wikitext.length) {
    let nextIndex = -1;
    let matchedToken = "";
    for (const token of LISTING_TOKENS) {
      const found = lower.indexOf(token, cursor);
      if (found !== -1 && (nextIndex === -1 || found < nextIndex)) {
        nextIndex = found;
        matchedToken = token;
      }
    }
    if (nextIndex === -1) break;
    const parsed = parseTemplateAt(wikitext, nextIndex);
    if (!parsed) {
      cursor = nextIndex + 2;
      continue;
    }
    const kind = matchedToken.replace("{{", "") as RawListing["kind"];
    listings.push({ kind, fields: toFields(parsed.fields) });
    cursor = parsed.end;
  }
  return listings;
}

function categorize(name: string, content: string, type: string): AttractionCategory {
  const haystack = `${name} ${content} ${type}`.toLowerCase();
  if (/museum|gallery|exhibit/.test(haystack)) return "museum";
  if (/temple|church|cathedral|mosque|shrine|monaster|basilica|synagogue/.test(haystack)) {
    return "religious";
  }
  if (/park|garden|forest|mountain|lake|falls|nature|reserve|valley|volcano|glacier|cave/.test(haystack)) {
    return "nature";
  }
  if (/beach|harbour|harbor|bay|river|canal|lagoon|coast|waterfront/.test(haystack)) {
    return "water";
  }
  if (/castle|palace|fort|ruin|ancient|monument|historic|heritage|archaeolog/.test(haystack)) {
    return "history";
  }
  if (/viewpoint|lookout|observation|panorama|skyline|tower/.test(haystack)) {
    return "viewpoint";
  }
  if (/theatre|theater|opera|street art|mural|sculpture/.test(haystack)) return "art";
  if (/quarter|district|neighbourhood|neighborhood|old town|market/.test(haystack)) {
    return "neighborhood";
  }
  return "landmark";
}

export async function getWikivoyageAttractions(
  title: string,
  origin: { latitude: number; longitude: number },
): Promise<{ attractions: Attraction[]; summary: string | null; url: string | null }> {
  const url = new URL("https://en.wikivoyage.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await timedFetch(url, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Wanderlens/1.0 (open-source travel discovery)" },
  });
  if (!res.ok) throw new Error(`wikivoyage upstream ${res.status}`);

  const data = (await res.json()) as ParseResponse & {
    parse?: { wikitext?: string };
  };
  const wikitext =
    typeof data.parse?.wikitext === "string"
      ? data.parse.wikitext
      : data.parse?.wikitext?.["*"] ?? "";
  if (!wikitext) {
    return { attractions: [], summary: null, url: null };
  }

  const pageTitle = data.parse?.title ?? title;
  const pageUrl = `https://en.wikivoyage.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;
  const listings = extractListings(wikitext);

  const seen = new Set<string>();
  const attractions: Attraction[] = [];

  listings.forEach((listing) => {
    const name = stripWikiMarkup(listing.fields.name ?? "");
    if (!name || name.length < 2) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;

    const type = (listing.fields.type ?? "").toLowerCase();
    if (listing.kind === "listing" && type && !["see", "do", "view"].includes(type)) {
      return;
    }
    if (listing.kind === "marker" && !listing.fields.name) return;

    const content = stripWikiMarkup(listing.fields.content ?? "");
    const lat = Number.parseFloat(listing.fields.lat ?? "");
    const lon = Number.parseFloat(listing.fields.long ?? listing.fields.lon ?? "");
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
    const distanceKm = hasCoords
      ? haversineKm(origin.latitude, origin.longitude, lat, lon)
      : null;

    seen.add(key);
    attractions.push({
      id: `wv-${key.replace(/[^a-z0-9]+/g, "-")}`,
      title: name,
      blurb: content || "A spot travellers single out in local guides.",
      category: categorize(name, content, type || listing.kind),
      image: null,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lon : null,
      distanceKm,
      score:
        (listing.kind === "see" ? 6 : listing.kind === "do" ? 5 : 4) +
        (content.length > 120 ? 1.5 : 0) +
        (hasCoords ? 1 : 0),
      source: "wikivoyage",
      url: listing.fields.url ? listing.fields.url.split(" ")[0] : pageUrl,
    });
  });

  const summary = await fetchWikivoyageSummary(pageTitle);

  return { attractions, summary, url: pageUrl };
}
