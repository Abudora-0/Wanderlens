import type { Attraction, AttractionCategory } from "@/lib/types";
import { haversineKm } from "@/lib/format";
import { timedFetch } from "@/lib/sources/http";

interface GeoSearchResponse {
  query?: {
    geosearch?: {
      pageid: number;
      title: string;
      lat: number;
      lon: number;
      dist: number;
    }[];
  };
}

interface WikiPage {
  pageid: number;
  title: string;
  extract?: string;
  thumbnail?: { source?: string };
  coordinates?: { lat: number; lon: number }[];
  pageprops?: Record<string, string>;
  fullurl?: string;
  pageviews?: Record<string, number | null>;
}

interface PageDetailResponse {
  query?: {
    pages?: WikiPage[] | Record<string, WikiPage>;
  };
}

const SKIP_PATTERNS = [
  /\b(railway |metro |underground |subway |tram |train )?station\b/i,
  /\bbus (station|terminal|stop)\b/i,
  /\bairport\b/i,
  /\b(list|census|electoral|constituency|ward)\b/i,
  /\bhospital\b/i,
  /\b(primary |secondary |high )?school\b/i,
  /\buniversity\b/i,
  /\bcollege\b/i,
  /\bstadium\b/i,
  /\barena\b/i,
  /\b(f\.?c\.?|s\.?c\.?|football club|rugby club|cricket club)\b/i,
  /^battle of /i,
  /^siege of /i,
  /^treaty of /i,
  /^bombing of /i,
  /^timeline of /i,
  /^(history|culture|economy|geography|demographics|politics|climate|transport|education|tourism) (of|in) /i,
  /^(list|index|outline) of /i,
  /\b(rebellion|uprising|revolt|mutiny|insurrection|commune)\b/i,
  /\b(massacre|riot|bombing|air raid|incident|affair|attack|shooting)\b/i,
  /\b(campaign|offensive|expedition|conquest)\b/i,
  /\bwar\b/i,
  /\bdynasty\b/i,
  /\b(clan|shogunate)\b/i,
  /\belection\b/i,
  /\b(federation|confederation|institute of technology|chamber of commerce)\b/i,
  /\b(headquarters|embassy|consulate|ministry of|city council|town hall)\b/i,
  /\b(incorporated|corporation|holdings company|gmbh)\b/i,
  /\b(port authority|autonomous port|water board|transit authority)\b/i,
  /\b(newspaper|magazine|broadcasting|television channel|radio station|record label)\b/i,
  /\b(festival|film festival|biennale|awards?)\b/i,
  /\b(summer|winter) olympics\b/i,
  /\bopening ceremony\b/i,
  /\b(diocese|archdiocese|deanery|parish of)\b/i,
];

function categorize(title: string, extract: string): AttractionCategory {
  const haystack = `${title} ${extract}`.toLowerCase();
  const lead = `${title} ${extract.slice(0, 90)}`.toLowerCase();
  if (/museum|gallery|collection of art/.test(lead)) return "museum";
  if (/theatre|theater|opera house|concert hall|playhouse/.test(lead))
    return "art";
  if (
    /temple|church|cathedral|mosque|shrine|monaster|basilica|synagogue|chapel|convent/.test(
      lead,
    )
  ) {
    return "religious";
  }
  if (
    /castle|palace|fort|fortress|ruins|ancient|citadel|archaeological|city walls/.test(
      lead,
    )
  ) {
    return "history";
  }
  if (
    /national park|botanical garden|\bpark\b|\bgarden\b|forest|mountain|lake|waterfall|\bfalls\b|nature reserve|valley|volcano|glacier|\bcave\b|\bbeach\b|\bisland\b/.test(
      haystack,
    )
  ) {
    return "nature";
  }
  if (/tower|observation deck|viewpoint|lookout|belvedere/.test(haystack))
    return "viewpoint";
  if (
    /bridge|\bsquare\b|plaza|\bpraça\b|boulevard|promenade|\bmarket\b|bazaar|quarter|district|neighbou?rhood/.test(
      haystack,
    )
  ) {
    return "neighborhood";
  }
  if (
    /monument|memorial|triumphal arch|statue|fountain|obelisk/.test(haystack)
  ) {
    return "landmark";
  }
  return "landmark";
}

const WP_UA = "Wanderlens/1.0 (open-source travel discovery)";
const WP_API = "https://en.wikipedia.org/w/api.php";

// Titles that read like a named sight - lets us reach past the nearest cluster
// for the famous temple / palace / park that sits a few km out.
const SIGHT_TITLE =
  /-(ji|dō|do|dera|gū|gu|in|taisha|jinja|an)\b|\b(temple|shrine|cathedral|basilica|mosque|church|monastery|abbey|castle|palace|fort|citadel|museum|gallery|memorial|monument|mausoleum|tower|pagoda|gate|bridge|garden|gardens|park|botanical|arboretum|zoo|aquarium|观|寺|神社)\b/i;

/** Nearest Wikipedia articles that carry coordinates. */
async function geoSearchIds(origin: {
  latitude: number;
  longitude: number;
}): Promise<{ pageid: number; title: string; dist: number }[]> {
  const url = new URL(WP_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "geosearch");
  url.searchParams.set("gscoord", `${origin.latitude}|${origin.longitude}`);
  url.searchParams.set("gsradius", "10000");
  url.searchParams.set("gslimit", "300");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const res = await timedFetch(
    url,
    { next: { revalidate: 86400 }, headers: { "User-Agent": WP_UA } },
    5000,
  );
  if (!res.ok) throw new Error(`wikipedia geosearch ${res.status}`);
  const data = (await res.json()) as GeoSearchResponse;
  return data.query?.geosearch ?? [];
}

export async function getWikipediaNearby(origin: {
  latitude: number;
  longitude: number;
}): Promise<Attraction[]> {
  const geoHits = (await geoSearchIds(origin)).filter(
    (h) => !SKIP_PATTERNS.some((p) => p.test(h.title)),
  );
  if (geoHits.length === 0) return [];

  const distanceByPage = new Map(geoHits.map((h) => [h.pageid, h.dist]));

  // Candidate pool: the nearest handful unconditionally, plus anything further
  // out whose title looks like a real landmark (so a 5 km-away temple still
  // gets a chance to prove its popularity in the detail pass).
  const near = geoHits.slice(0, 26).map((h) => h.pageid);
  const farNamed = geoHits
    .slice(26)
    .filter((h) => SIGHT_TITLE.test(h.title))
    .slice(0, 24)
    .map((h) => h.pageid);
  const filteredIds = [...new Set([...near, ...farNamed])].slice(0, 50);
  if (filteredIds.length === 0) return [];

  const detailUrl = new URL(WP_API);
  detailUrl.searchParams.set("action", "query");
  detailUrl.searchParams.set("pageids", filteredIds.join("|"));
  detailUrl.searchParams.set(
    "prop",
    "extracts|pageimages|coordinates|info|pageprops|pageviews",
  );
  detailUrl.searchParams.set("pvipdays", "45");
  detailUrl.searchParams.set("exintro", "1");
  detailUrl.searchParams.set("explaintext", "1");
  detailUrl.searchParams.set("exsentences", "2");
  detailUrl.searchParams.set("piprop", "thumbnail");
  detailUrl.searchParams.set("pithumbsize", "480");
  detailUrl.searchParams.set("inprop", "url");
  detailUrl.searchParams.set("format", "json");
  detailUrl.searchParams.set("formatversion", "2");

  const detailRes = await timedFetch(
    detailUrl,
    { next: { revalidate: 86400 }, headers: { "User-Agent": WP_UA } },
    6000,
  );
  if (!detailRes.ok) throw new Error(`wikipedia detail ${detailRes.status}`);
  const detailData = (await detailRes.json()) as PageDetailResponse;

  const pagesRaw = detailData.query?.pages;
  const pageList = Array.isArray(pagesRaw)
    ? pagesRaw
    : Object.values(pagesRaw ?? {});

  // The article's opening sentence is the strongest signal for "is this a place
  // a visitor goes to" vs "is this an event, an organisation or a person".
  const NON_PLACE_EXTRACT =
    /\bwas (a|an|the|part of|fought|one of|born|founded)\b|\bis (a|an) (revolutionary|political|military|governing|professional|trade|non-profit|nonprofit|charitable|learned|scientific|sporting|sports|football|governmental|administrative|intergovernmental|voluntary)\b|\bis (a|an|the) (organi[sz]ation|association|federation|company|corporation|agency|authority|institution|club|team|party|movement|government|council|committee|union|network|programme|program|initiative|newspaper|magazine|festival|event|competition|tournament|championship|ceremony|treaty|war|battle|siege|uprising|massacre|riot)\b|\btook place\b|\bwas (an?|the) \w+ (that|who|which) (died|ruled|reigned|occurred|happened)/i;
  const PLACE_EXTRACT =
    /\bis (a|an|the)\b.*\b(temple|shrine|mosque|church|cathedral|basilica|chapel|monastery|abbey|synagogue|museum|gallery|memorial museum|park|national park|garden|botanical garden|castle|palace|fort|fortress|citadel|château|chateau|district|quarter|neighbou?rhood|old town|tower|skyscraper|bridge|monument|memorial|mausoleum|tomb|obelisk|arch|square|plaza|market|bazaar|promenade|boulevard|waterfront|mountain|peak|hill|lake|river|waterfall|island|beach|bay|forest|nature reserve|zoo|aquarium|amusement park|theme park|stadium|opera house|concert hall|theatre|theater|library|observatory|lighthouse|palace complex|archaeological site|ruins|historic house|landmark|art gallery|shopping street|pedestrian street|cemetery|catacombs|city walls|gate)\b/i;

  const MIN_DAILY_VIEWS = 35;

  const scored = pageList
    .filter((page) => page.extract && page.extract.length > 40)
    .filter(
      (page) => !page.pageprops || page.pageprops.disambiguation === undefined,
    )
    .map((page) => {
      const extract = page.extract ?? "";
      const views = Object.values(page.pageviews ?? {}).filter(
        (v): v is number => typeof v === "number" && v > 0,
      );
      const avgViews = views.length
        ? views.reduce((a, b) => a + b, 0) / views.length
        : 0;
      const looksLikePlace = PLACE_EXTRACT.test(extract);
      const looksLikeNonPlace =
        NON_PLACE_EXTRACT.test(extract) && !looksLikePlace;

      const coords = page.coordinates?.[0];
      const distMeters = distanceByPage.get(page.pageid) ?? null;
      const distanceKm = coords
        ? haversineKm(origin.latitude, origin.longitude, coords.lat, coords.lon)
        : distMeters !== null
          ? distMeters / 1000
          : null;

      return {
        page,
        extract,
        avgViews,
        looksLikePlace,
        looksLikeNonPlace,
        coords,
        distanceKm,
      };
    })
    .filter((row) => !row.looksLikeNonPlace)
    // Popularity gate: a genuine sight in a visited place clears this easily;
    // civic buildings, minor plaques and stub articles do not. Keep anything
    // that both reads like a place and has a photo even if it is quieter.
    .filter(
      (row) =>
        row.avgViews >= MIN_DAILY_VIEWS ||
        (row.looksLikePlace && row.page.thumbnail?.source),
    );

  return scored.map(
    ({ page, extract, avgViews, looksLikePlace, distanceKm }) => ({
      id: `wp-${page.pageid}`,
      title: page.title,
      blurb: extract,
      category: categorize(page.title, extract),
      image: page.thumbnail?.source ?? null,
      latitude: page.coordinates?.[0]?.lat ?? null,
      longitude: page.coordinates?.[0]?.lon ?? null,
      distanceKm,
      score:
        1 +
        // popularity is the dominant term (log so a 40x range spans ~1.6 points)
        Math.min(Math.log10(Math.max(avgViews, 1)) * 1.8, 6) +
        (page.thumbnail?.source ? 1.5 : 0) +
        (looksLikePlace ? 1 : 0) +
        (distanceKm !== null && distanceKm < 3 ? 0.75 : 0),
      source: "wikipedia" as const,
      url: page.fullurl ?? null,
    }),
  );
}

export interface WikiBlurb {
  extract: string;
  image: string | null;
  url: string | null;
  latitude: number | null;
  longitude: number | null;
}

async function blurbBatch(titles: string[]): Promise<Map<string, WikiBlurb>> {
  const out = new Map<string, WikiBlurb>();
  if (titles.length === 0) return out;
  const url = new URL(WP_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("redirects", "1");
  url.searchParams.set("prop", "extracts|pageimages|coordinates|info");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exsentences", "2");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "640");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await timedFetch(url, {
    next: { revalidate: 604800 },
    headers: { "User-Agent": WP_UA },
  });
  if (!res.ok) return out;
  const data = (await res.json()) as PageDetailResponse & {
    query?: { redirects?: { from: string; to: string }[] };
  };
  const redirectFrom = new Map(
    (data.query?.redirects ?? []).map((r) => [r.to, r.from]),
  );
  const pagesRaw = data.query?.pages;
  const pages = Array.isArray(pagesRaw)
    ? pagesRaw
    : Object.values(pagesRaw ?? {});

  for (const page of pages) {
    const coord = page.coordinates?.[0];
    const blurb: WikiBlurb = {
      extract: page.extract ?? "",
      image: page.thumbnail?.source ?? null,
      url: page.fullurl ?? null,
      latitude: coord?.lat ?? null,
      longitude: coord?.lon ?? null,
    };
    out.set(page.title, blurb);
    const from = redirectFrom.get(page.title);
    if (from) out.set(from, blurb);
  }
  return out;
}

/**
 * Batch-fetch the lead paragraph, lead image and coords for known articles.
 * TextExtracts only fills the first ~20 pages per request when `exintro` is
 * set, so this chunks.
 */
export async function getWikipediaBlurbs(
  titles: string[],
): Promise<Map<string, WikiBlurb>> {
  const unique = [...new Set(titles.filter(Boolean))].slice(0, 40);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20)
    chunks.push(unique.slice(i, i + 20));
  const maps = await Promise.all(
    chunks.map((c) => blurbBatch(c).catch(() => new Map())),
  );
  const out = new Map<string, WikiBlurb>();
  for (const m of maps) for (const [k, v] of m) out.set(k, v);
  return out;
}

/** Find a representative image for a place by full-text searching Wikipedia. */
export async function getWikipediaImageBySearch(
  query: string,
): Promise<{ image: string | null; url: string | null }> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "pageimages|info");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "640");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  try {
    const res = await timedFetch(url, {
      next: { revalidate: 86400 },
      headers: {
        "User-Agent": "Wanderlens/1.0 (open-source travel discovery)",
      },
    });
    if (!res.ok) return { image: null, url: null };
    const data = (await res.json()) as {
      query?: {
        pages?: {
          thumbnail?: { source?: string };
          fullurl?: string;
        }[];
      };
    };
    const page = data.query?.pages?.[0];
    return {
      image: page?.thumbnail?.source ?? null,
      url: page?.fullurl ?? null,
    };
  } catch {
    return { image: null, url: null };
  }
}

export async function getWikipediaSummary(
  title: string,
): Promise<{
  summary: string | null;
  image: string | null;
  url: string | null;
}> {
  const url = new URL(
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(title),
  );
  const res = await timedFetch(url, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Wanderlens/1.0 (open-source travel discovery)" },
  });
  if (!res.ok) return { summary: null, image: null, url: null };
  const data = (await res.json()) as {
    extract?: string;
    originalimage?: { source?: string; width?: number };
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
  };
  // Prefer an upscaled thumbnail (fast) over the full original (can be many MB).
  const thumb = data.thumbnail?.source?.replace(
    /\/(\d{2,4})px-/,
    (_m, n) => `/${Math.min(Number(n) * 2, 960)}px-`,
  );
  return {
    summary: data.extract ?? null,
    image:
      thumb ??
      ((data.originalimage?.width ?? 9999) <= 1600
        ? data.originalimage?.source
        : null) ??
      data.thumbnail?.source ??
      null,
    url: data.content_urls?.desktop?.page ?? null,
  };
}
