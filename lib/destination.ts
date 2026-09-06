import type {
  Attraction,
  AttractionCategory,
  Attribution,
  DestinationDossier,
  PlaceKind,
} from "@/lib/types";
import { getWikivoyageAttractions } from "@/lib/sources/wikivoyage";
import {
  getWikipediaNearby,
  getWikipediaSummary,
  getWikipediaBlurbs,
} from "@/lib/sources/wikipedia";
import { getWikidataSights, type WikidataSight } from "@/lib/sources/wikidata";
import { getCountryByCode, getCountryByName } from "@/lib/sources/countries";
import { getWeather } from "@/lib/sources/weather";
import { haversineKm, normalizeDashes } from "@/lib/format";

interface BuildInput {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  kind: PlaceKind;
  countryCode: string | null;
  country: string | null;
}

function categoryFor(text: string): AttractionCategory {
  const s = text.toLowerCase();
  if (/museum|gallery|collection/.test(s)) return "museum";
  if (
    /temple|shrine|church|cathedral|mosque|basilica|monaster|abbey|synagogue|pagoda/.test(
      s,
    )
  ) {
    return "religious";
  }
  if (
    /castle|palace|fort|fortress|citadel|ruin|ancient|archaeolog|heritage|historic/.test(
      s,
    )
  ) {
    return "history";
  }
  if (
    /park|garden|forest|mountain|lake|falls|waterfall|nature|volcano|glacier|cave|bamboo/.test(
      s,
    )
  ) {
    return "nature";
  }
  if (/beach|harbour|harbor|bay|river|canal|lagoon|coast|waterfront/.test(s))
    return "water";
  if (/tower|observation|viewpoint|lookout|panorama/.test(s))
    return "viewpoint";
  if (/theatre|theater|opera|concert hall|mural|sculpture/.test(s))
    return "art";
  if (/quarter|district|neighbou?rhood|old town|market|bazaar|square/.test(s))
    return "neighborhood";
  return "landmark";
}

async function wikidataToAttractions(
  sights: WikidataSight[],
  origin: { latitude: number; longitude: number },
): Promise<Attraction[]> {
  if (sights.length === 0) return [];
  let blurbs: Awaited<ReturnType<typeof getWikipediaBlurbs>>;
  try {
    blurbs = await getWikipediaBlurbs(sights.map((s) => s.title));
  } catch {
    blurbs = new Map();
  }

  const NOT_VISITABLE =
    /\bwas (a|an|the) [\w-]*\s?(ancient |former |early |medieval |dutch |roman |greek |walled )?(city|town|settlement|colony|trading post|fortification|province|region|kingdom|empire|capital)\b|\bis (a|the) (former|defunct|proposed)\b|\b(football|soccer|association football|rugby|baseball|basketball) (club|team|stadium)\b|\bhome (ground|stadium|arena|venue) (of|for|to)\b|\bformer name (of|for)\b|\bis an? (administrative|municipal) (division|district|area|unit)\b/i;

  return sights
    .map((sight) => {
      const info = blurbs.get(sight.title);
      return { sight, info, extract: info?.extract ?? "" };
    })
    .filter(({ extract }) => !NOT_VISITABLE.test(extract))
    .map(({ sight, info }) => {
      const lat = info?.latitude ?? sight.latitude;
      const lon = info?.longitude ?? sight.longitude;
      const blurb =
        info?.extract && info.extract.length > 20
          ? info.extract
          : "A landmark that travellers to the area consistently seek out.";
      return {
        id: `wd-${sight.qid}`,
        title: sight.title.replace(/\s+\(.*\)$/, ""),
        blurb,
        category: categoryFor(`${sight.title} ${blurb}`),
        image: info?.image ?? null,
        latitude: lat,
        longitude: lon,
        distanceKm: haversineKm(origin.latitude, origin.longitude, lat, lon),
        // Fame, measured by how many language Wikipedias cover the place.
        score: 3 + Math.min(sight.sitelinks / 6, 9) + (info?.image ? 1.5 : 0),
        source: "wikidata" as const,
        url: info?.url ?? `https://www.wikidata.org/wiki/${sight.qid}`,
      } satisfies Attraction;
    });
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|la|le|el|les|il|los)\s+/, "");
}

function mergeAttractions(
  primary: Attraction[],
  secondary: Attraction[],
): Attraction[] {
  const byTitle = new Map<string, Attraction>();

  primary.forEach((item) => {
    byTitle.set(normalizeTitle(item.title), item);
  });

  secondary.forEach((item) => {
    const key = normalizeTitle(item.title);
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, item);
      return;
    }
    byTitle.set(key, {
      ...existing,
      image: existing.image ?? item.image,
      latitude: existing.latitude ?? item.latitude,
      longitude: existing.longitude ?? item.longitude,
      distanceKm: existing.distanceKm ?? item.distanceKm,
      blurb:
        existing.blurb.length >= item.blurb.length
          ? existing.blurb
          : item.blurb,
      url: existing.url ?? item.url,
      score: existing.score + item.score * 0.35 + 1.5,
    });
  });

  const partialTitleKeys = [...byTitle.keys()];
  secondary.forEach((item) => {
    const key = normalizeTitle(item.title);
    if (byTitle.has(key)) return;
    const overlap = partialTitleKeys.find(
      (existingKey) =>
        existingKey.length > 6 &&
        (existingKey.includes(key) || key.includes(existingKey)),
    );
    if (overlap) {
      const existing = byTitle.get(overlap);
      if (existing && !existing.image && item.image) {
        byTitle.set(overlap, {
          ...existing,
          image: item.image,
          score: existing.score + 1,
        });
      }
      return;
    }
    byTitle.set(key, item);
  });

  return [...byTitle.values()];
}

function byScoreThenDistance(a: Attraction, b: Attraction): number {
  if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
  return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
}

/**
 * Wikivoyage's editor picks and Wikidata's most-documented heritage sites are
 * the curated tier and always make the cut. Wikipedia geosearch only fills the
 * slots left over, and only for results that cleared its popularity gate well
 * enough to read like a real attraction rather than a nearby dot on the map.
 */
function rankAndTrim(attractions: Attraction[], limit = 18): Attraction[] {
  const curated = attractions
    .filter((a) => a.source === "wikivoyage" || a.source === "wikidata")
    .sort(byScoreThenDistance);
  const discovered = attractions
    .filter((a) => a.source === "wikipedia")
    .sort(byScoreThenDistance);

  const roomForDiscovered = Math.max(limit - curated.length, 0);
  // When there are barely any curated sights, allow more geosearch fill so the
  // page is not empty; when curation is rich, keep geosearch to a top-up.
  const discoveredCutoff = curated.length >= 6 ? 5.5 : 3.5;

  return [
    ...curated.slice(0, limit),
    ...discovered
      .filter((a) => a.score >= discoveredCutoff)
      .slice(0, Math.max(roomForDiscovered, curated.length < 4 ? 12 : 4)),
  ]
    .sort(byScoreThenDistance)
    .slice(0, limit);
}

function withDeadline<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const TIMED_OUT = { status: "rejected", reason: "deadline" } as const;

export async function buildDossier(
  input: BuildInput,
): Promise<DestinationDossier> {
  const origin = { latitude: input.latitude, longitude: input.longitude };
  const partial: string[] = [];

  // First wave: the curated sources plus the page-level context. Geosearch is
  // held back so we do not hammer Wikimedia when the curated sources already
  // have plenty.
  const [wikivoyage, wikidataRaw, wikipediaSummary, weather] =
    await withDeadline(
      Promise.allSettled([
        getWikivoyageAttractions(input.name, origin),
        getWikidataSights(input.latitude, input.longitude).then((sights) =>
          wikidataToAttractions(sights, origin),
        ),
        getWikipediaSummary(input.name),
        getWeather(input.latitude, input.longitude),
      ]),
      11000,
      [TIMED_OUT, TIMED_OUT, TIMED_OUT, TIMED_OUT] as never,
    );

  let voyageAttractions: Attraction[] = [];
  let summary: string | null = null;
  let summaryUrl: string | null = null;

  if (wikivoyage.status === "fulfilled") {
    voyageAttractions = wikivoyage.value.attractions;
    summary = wikivoyage.value.summary;
    summaryUrl = wikivoyage.value.url;
  } else {
    partial.push("wikivoyage");
  }

  const wikidataAttractions: Attraction[] =
    wikidataRaw.status === "fulfilled" ? wikidataRaw.value : [];

  // Only reach for geosearch if the curated sources came up thin.
  const curatedCount = new Set(
    [...voyageAttractions, ...wikidataAttractions].map((a) =>
      normalizeTitle(a.title),
    ),
  ).size;
  let nearbyAttractions: Attraction[] = [];
  if (curatedCount < 12) {
    const nearby = await withDeadline(
      getWikipediaNearby(origin).catch(() => null),
      8000,
      null,
    );
    if (nearby) nearbyAttractions = nearby;
    else partial.push("wikipedia-nearby");
  }

  if (wikipediaSummary.status === "fulfilled") {
    if (!summary && wikipediaSummary.value.summary) {
      summary = wikipediaSummary.value.summary;
      summaryUrl = wikipediaSummary.value.url;
    }
  }

  const placeKey = normalizeTitle(input.name);
  const JUNK_TITLE =
    /\b(diocese|archdiocese|prefecture|municipality|arrondissement|department|province|county|district council|regional council|urban area|metropolitan area|agglomeration|census-designated|electoral district|constituency)\b|^(history|geography|culture|economy|climate|transport|demographics|politics|tourism|timeline|outline|list|index) (of|in) /i;
  const curatedMerged = mergeAttractions(
    voyageAttractions,
    wikidataAttractions,
  );
  const merged = mergeAttractions(curatedMerged, nearbyAttractions).filter(
    (item) => {
      const key = normalizeTitle(item.title);
      if (key === placeKey) return false;
      if (JUNK_TITLE.test(item.title)) return false;
      return true;
    },
  );
  const attractions = rankAndTrim(merged).map((item) => ({
    ...item,
    title: normalizeDashes(item.title),
    blurb: normalizeDashes(item.blurb),
  }));

  if (summary) summary = normalizeDashes(summary);

  let country = null;
  try {
    const lookup = input.countryCode
      ? getCountryByCode(input.countryCode)
      : input.country
        ? getCountryByName(input.country)
        : input.kind === "country"
          ? getCountryByName(input.name)
          : Promise.resolve(null);
    country = await withDeadline(lookup, 4000, null);
  } catch {
    partial.push("countries");
  }

  const weatherValue = weather.status === "fulfilled" ? weather.value : null;
  if (weather.status === "rejected") partial.push("weather");

  const attributions: Attribution[] = [];
  if (voyageAttractions.length > 0 || summaryUrl?.includes("wikivoyage")) {
    attributions.push({
      label: "Wikivoyage",
      url: summaryUrl ?? "https://en.wikivoyage.org",
      license: "CC BY-SA 4.0",
    });
  }
  if (
    nearbyAttractions.length > 0 ||
    wikidataAttractions.length > 0 ||
    wikipediaSummary.status === "fulfilled"
  ) {
    attributions.push({
      label: "Wikipedia",
      url: "https://en.wikipedia.org",
      license: "CC BY-SA 4.0",
    });
  }
  if (wikidataAttractions.length > 0) {
    attributions.push({
      label: "Wikidata",
      url: "https://www.wikidata.org",
      license: "CC0 1.0",
    });
  }
  if (country) {
    attributions.push({
      label: "mledoze/countries",
      url: "https://github.com/mledoze/countries",
      license: "ODbL 1.0",
    });
    if (country.population !== null) {
      attributions.push({
        label: "World Bank Open Data",
        url: "https://data.worldbank.org",
        license: "CC BY 4.0",
      });
    }
  }
  if (weatherValue) {
    attributions.push({
      label: "Open-Meteo",
      url: "https://open-meteo.com",
      license: "CC BY 4.0",
    });
  }

  return {
    place: {
      name: input.name,
      displayName: input.displayName,
      latitude: input.latitude,
      longitude: input.longitude,
      kind: input.kind,
    },
    summary,
    summaryUrl,
    attractions,
    country,
    weather: weatherValue,
    attributions,
    partial,
  };
}
