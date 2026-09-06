import type { Attraction, AttractionCategory } from "@/lib/types";
import { haversineKm } from "@/lib/format";
import { timedFetch } from "@/lib/sources/http";
import {
  parseTemplateAt,
  stripWikiMarkup,
  toFields,
  splitSections,
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

function categorize(
  name: string,
  content: string,
  type: string,
): AttractionCategory {
  const haystack = `${name} ${content} ${type}`.toLowerCase();
  if (/museum|gallery|exhibit/.test(haystack)) return "museum";
  if (
    /temple|church|cathedral|mosque|shrine|monaster|basilica|synagogue/.test(
      haystack,
    )
  ) {
    return "religious";
  }
  if (
    /park|garden|forest|mountain|lake|falls|nature|reserve|valley|volcano|glacier|cave/.test(
      haystack,
    )
  ) {
    return "nature";
  }
  if (
    /beach|harbour|harbor|bay|river|canal|lagoon|coast|waterfront/.test(
      haystack,
    )
  ) {
    return "water";
  }
  if (
    /castle|palace|fort|ruin|ancient|monument|historic|heritage|archaeolog/.test(
      haystack,
    )
  ) {
    return "history";
  }
  if (/viewpoint|lookout|observation|panorama|skyline|tower/.test(haystack)) {
    return "viewpoint";
  }
  if (/theatre|theater|opera|street art|mural|sculpture/.test(haystack))
    return "art";
  if (
    /quarter|district|neighbourhood|neighborhood|old town|market/.test(haystack)
  ) {
    return "neighborhood";
  }
  return "landmark";
}

export async function getWikivoyageAttractions(
  title: string,
  origin: { latitude: number; longitude: number },
): Promise<{
  attractions: Attraction[];
  summary: string | null;
  url: string | null;
}> {
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
      : (data.parse?.wikitext?.["*"] ?? "");
  if (!wikitext) {
    return { attractions: [], summary: null, url: null };
  }

  const pageTitle = data.parse?.title ?? title;
  const pageUrl = `https://en.wikivoyage.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;

  // Only the See section holds sights. A {{listing}} / {{marker}} anywhere else
  // is a restaurant, hotel, shop, transit stop, university or tour company, and
  // the Do section in particular is full of activity operators - so scan just
  // See, plus the inherently-sight {{see}} template wherever it appears.
  const { sections } = splitSections(wikitext);
  const sightSectionText = [
    sections["see"],
    sections["see and do"],
    sections["sights"],
    sections["landmarks"],
  ]
    .filter(Boolean)
    .join("\n\n");
  const seeOnly = extractListings(wikitext).filter((l) => l.kind === "see");
  const listings = [...extractListings(sightSectionText), ...seeOnly];

  const seen = new Set<string>();
  const attractions: Attraction[] = [];

  listings.forEach((listing) => {
    const name = stripWikiMarkup(listing.fields.name ?? "").replace(
      /[,\s]+$/,
      "",
    );
    if (!name || name.length < 2) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;

    const type = (listing.fields.type ?? "").toLowerCase();
    if (
      (listing.kind === "listing" || listing.kind === "marker") &&
      type &&
      ![
        "see",
        "view",
        "landmark",
        "monument",
        "museum",
        "park",
        "gallery",
      ].includes(type)
    ) {
      return;
    }
    if (listing.kind === "marker" && !listing.fields.name) return;

    // Universities, tour operators, embassies and clubs slip into See on some
    // articles - keep them out.
    if (
      /\buniversit(y|ies)\b|\bcollege\b|\bschool of\b|\binstitute of\b|\bembassy\b|\bconsulate\b|\btours?\b.{0,30}\b(operator|company|agency|group)\b|\b(bicycle|cycling|walking|day|boat|food|street food|bike|hop-?on) tours?\b|\bcooking class\b|\blanguage school\b|\boperated by\b|\bsightseeing bus\b|\bbus tur[íi]stic\b|\bcity tour\b/i.test(
        `${name} ${listing.fields.content ?? ""}`,
      )
    ) {
      return;
    }

    const content = stripWikiMarkup(listing.fields.content ?? "");

    // Drop recurring events (festivals, seasons, night markets that only run a
    // few days) - they are activities, not places a visitor can just go to.
    const eventText = `${name} ${content.slice(0, 140)}`.toLowerCase();
    if (
      !/\b(museum|palace|temple|church|park|garden|gallery|tower|castle)\b/.test(
        name.toLowerCase(),
      ) &&
      /\b(festival|carnival|\bfair\b|celebrated|held (each|every|annually)|takes place (each|every|in (january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|autumn|winter))|annual (event|celebration|festival)|from (late |early |mid[- ])?(january|february|march|april|may|june|july|august|september|october|november|december))/.test(
        eventText,
      )
    ) {
      return;
    }
    const lat = Number.parseFloat(listing.fields.lat ?? "");
    const lon = Number.parseFloat(
      listing.fields.long ?? listing.fields.lon ?? "",
    );
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
      // Wikivoyage See listings are hand-picked by travel editors, so they
      // start well above anything geosearch can surface on its own.
      score:
        8 +
        (content.length > 120 ? 1.5 : 0) +
        (content.length > 40 ? 0.75 : 0) +
        (hasCoords ? 1 : 0),
      source: "wikivoyage",
      url: listing.fields.url ? listing.fields.url.split(" ")[0] : pageUrl,
    });
  });

  const summary = await fetchWikivoyageSummary(pageTitle);

  return { attractions, summary, url: pageUrl };
}
