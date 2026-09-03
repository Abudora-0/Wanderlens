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
}

interface PageDetailResponse {
  query?: {
    pages?: WikiPage[] | Record<string, WikiPage>;
  };
}

const SKIP_PATTERNS = [
  /\bstation\b/i,
  /\bbus (station|terminal|stop)\b/i,
  /\bairport\b/i,
  /\b(list|census|electoral|constituency|ward)\b/i,
  /\bhospital\b/i,
  /\bschool\b/i,
  /\buniversity\b/i,
  /\bstadium\b/i,
  /^battle of /i,
  /^siege of /i,
  /^treaty of /i,
  /^bombing of /i,
  /\b(rebellion|uprising|revolt|mutiny|insurrection)\b/i,
  /\b(massacre|riot|bombing|air raid|incident|affair)\b/i,
  /\b(campaign|offensive|expedition|conquest)\b/i,
  /\bwar\b/i,
  /\bdynasty\b/i,
  /\b(clan|shogunate)\b/i,
  /\belection\b/i,
];

function categorize(title: string, extract: string): AttractionCategory {
  const haystack = `${title} ${extract}`.toLowerCase();
  const lead = `${title} ${extract.slice(0, 90)}`.toLowerCase();
  if (/museum|gallery|collection of art/.test(lead)) return "museum";
  if (/theatre|theater|opera house|concert hall|playhouse/.test(lead)) return "art";
  if (/temple|church|cathedral|mosque|shrine|monaster|basilica|synagogue|chapel|convent/.test(lead)) {
    return "religious";
  }
  if (/castle|palace|fort|fortress|ruins|ancient|citadel|archaeological|city walls/.test(lead)) {
    return "history";
  }
  if (/national park|botanical garden|\bpark\b|\bgarden\b|forest|mountain|lake|waterfall|\bfalls\b|nature reserve|valley|volcano|glacier|\bcave\b|\bbeach\b|\bisland\b/.test(haystack)) {
    return "nature";
  }
  if (/tower|observation deck|viewpoint|lookout|belvedere/.test(haystack)) return "viewpoint";
  if (/bridge|\bsquare\b|plaza|\bpraça\b|boulevard|promenade|\bmarket\b|bazaar|quarter|district|neighbou?rhood/.test(haystack)) {
    return "neighborhood";
  }
  if (/monument|memorial|triumphal arch|statue|fountain|obelisk/.test(haystack)) {
    return "landmark";
  }
  return "landmark";
}

export async function getWikipediaNearby(
  origin: { latitude: number; longitude: number },
  radiusKm: number,
): Promise<Attraction[]> {
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "geosearch");
  searchUrl.searchParams.set(
    "gscoord",
    `${origin.latitude}|${origin.longitude}`,
  );
  searchUrl.searchParams.set("gsradius", String(Math.min(radiusKm, 10) * 1000));
  searchUrl.searchParams.set("gslimit", "40");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("formatversion", "2");

  const searchRes = await timedFetch(searchUrl, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Wanderlens/1.0 (open-source travel discovery)" },
  });
  if (!searchRes.ok) throw new Error(`wikipedia geosearch ${searchRes.status}`);
  const searchData = (await searchRes.json()) as GeoSearchResponse;
  const hits = searchData.query?.geosearch ?? [];
  if (hits.length === 0) return [];

  const filtered = hits
    .filter((hit) => !SKIP_PATTERNS.some((pattern) => pattern.test(hit.title)))
    .slice(0, 24);
  if (filtered.length === 0) return [];

  const detailUrl = new URL("https://en.wikipedia.org/w/api.php");
  detailUrl.searchParams.set("action", "query");
  detailUrl.searchParams.set("pageids", filtered.map((hit) => hit.pageid).join("|"));
  detailUrl.searchParams.set("prop", "extracts|pageimages|coordinates|info|pageprops");
  detailUrl.searchParams.set("exintro", "1");
  detailUrl.searchParams.set("explaintext", "1");
  detailUrl.searchParams.set("exsentences", "2");
  detailUrl.searchParams.set("piprop", "thumbnail");
  detailUrl.searchParams.set("pithumbsize", "480");
  detailUrl.searchParams.set("inprop", "url");
  detailUrl.searchParams.set("format", "json");
  detailUrl.searchParams.set("formatversion", "2");

  const detailRes = await timedFetch(detailUrl, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Wanderlens/1.0 (open-source travel discovery)" },
  });
  if (!detailRes.ok) throw new Error(`wikipedia detail ${detailRes.status}`);
  const detailData = (await detailRes.json()) as PageDetailResponse;

  const pagesRaw = detailData.query?.pages;
  const pageList = Array.isArray(pagesRaw)
    ? pagesRaw
    : Object.values(pagesRaw ?? {});

  const distanceByPage = new Map(filtered.map((hit) => [hit.pageid, hit.dist]));

  const EVENT_EXTRACT =
    /\bwas (a|an|the|part of|fought|one of)\b|\bwas a (battle|war|conflict|series|military|political|treaty|campaign|rebellion|revolt|coup)\b|\btook place\b|\bwas an? \w+ (that|who) (died|ruled|reigned|was born)/i;
  const PLACE_EXTRACT =
    /\bis (a|an|the)\b|\bare (a|the)\b|temple|shrine|museum|gallery|park|garden|castle|palace|district|neighbou?rhood|building|tower|bridge|monument|memorial|square|market|mountain|lake|river|island|beach|forest|zoo|aquarium|cathedral|church|mosque|shrine|street|avenue|hall|theatre|theater|landmark|library|observatory/i;

  return pageList
    .filter((page) => page.extract && page.extract.length > 30)
    .filter((page) => !page.pageprops || page.pageprops.disambiguation === undefined)
    .filter((page) => {
      const extract = page.extract ?? "";
      if (EVENT_EXTRACT.test(extract) && !PLACE_EXTRACT.test(extract)) return false;
      return true;
    })
    .map((page) => {
      const coords = page.coordinates?.[0];
      const distMeters = distanceByPage.get(page.pageid) ?? null;
      const distanceKm = coords
        ? haversineKm(origin.latitude, origin.longitude, coords.lat, coords.lon)
        : distMeters !== null
          ? distMeters / 1000
          : null;
      return {
        id: `wp-${page.pageid}`,
        title: page.title,
        blurb: page.extract ?? "",
        category: categorize(page.title, page.extract ?? ""),
        image: page.thumbnail?.source ?? null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
        distanceKm,
        score:
          3 +
          (page.thumbnail?.source ? 2.5 : 0) +
          (distanceKm !== null && distanceKm < 3 ? 1.5 : 0),
        source: "wikipedia" as const,
        url: page.fullurl ?? null,
      } satisfies Attraction;
    });
}

export async function getWikipediaSummary(
  title: string,
): Promise<{ summary: string | null; image: string | null; url: string | null }> {
  const url = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title));
  const res = await timedFetch(url, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Wanderlens/1.0 (open-source travel discovery)" },
  });
  if (!res.ok) return { summary: null, image: null, url: null };
  const data = (await res.json()) as {
    extract?: string;
    originalimage?: { source?: string };
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
  };
  return {
    summary: data.extract ?? null,
    image: data.originalimage?.source ?? data.thumbnail?.source ?? null,
    url: data.content_urls?.desktop?.page ?? null,
  };
}
