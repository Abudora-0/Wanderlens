import type {
  Attraction,
  Attribution,
  DestinationDossier,
  PlaceKind,
} from "@/lib/types";
import { getWikivoyageAttractions } from "@/lib/sources/wikivoyage";
import { getWikipediaNearby, getWikipediaSummary } from "@/lib/sources/wikipedia";
import { getCountryByCode, getCountryByName } from "@/lib/sources/countries";
import { getWeather } from "@/lib/sources/weather";

interface BuildInput {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  kind: PlaceKind;
  countryCode: string | null;
  country: string | null;
}

function radiusForKind(kind: PlaceKind): number {
  switch (kind) {
    case "country":
      return 10;
    case "region":
      return 9;
    case "area":
      return 6;
    case "landmark":
      return 4;
    default:
      return 7;
  }
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
        existing.blurb.length >= item.blurb.length ? existing.blurb : item.blurb,
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
        byTitle.set(overlap, { ...existing, image: item.image, score: existing.score + 1 });
      }
      return;
    }
    byTitle.set(key, item);
  });

  return [...byTitle.values()];
}

function rankAndTrim(attractions: Attraction[], limit = 18): Attraction[] {
  return [...attractions]
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
      const aDist = a.distanceKm ?? 999;
      const bDist = b.distanceKm ?? 999;
      return aDist - bDist;
    })
    .slice(0, limit);
}

export async function buildDossier(input: BuildInput): Promise<DestinationDossier> {
  const radius = radiusForKind(input.kind);
  const origin = { latitude: input.latitude, longitude: input.longitude };
  const partial: string[] = [];

  const [wikivoyage, wikipediaNearby, wikipediaSummary, weather] =
    await Promise.allSettled([
      getWikivoyageAttractions(input.name, origin),
      getWikipediaNearby(origin, radius),
      getWikipediaSummary(input.name),
      getWeather(input.latitude, input.longitude),
    ]);

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

  let nearbyAttractions: Attraction[] = [];
  if (wikipediaNearby.status === "fulfilled") {
    nearbyAttractions = wikipediaNearby.value;
  } else {
    partial.push("wikipedia-nearby");
  }

  if (wikipediaSummary.status === "fulfilled") {
    if (!summary && wikipediaSummary.value.summary) {
      summary = wikipediaSummary.value.summary;
      summaryUrl = wikipediaSummary.value.url;
    }
  }

  const placeKey = normalizeTitle(input.name);
  const merged = mergeAttractions(voyageAttractions, nearbyAttractions).filter(
    (item) => {
      const key = normalizeTitle(item.title);
      if (key === placeKey) return false;
      if (/\bdiocese\b|\barchdiocese\b|\bprefecture\b|\bmunicipality\b/i.test(item.title)) {
        return false;
      }
      return true;
    },
  );
  const attractions = rankAndTrim(merged);

  let country = null;
  try {
    if (input.countryCode) {
      country = await getCountryByCode(input.countryCode);
    } else if (input.country) {
      country = await getCountryByName(input.country);
    } else if (input.kind === "country") {
      country = await getCountryByName(input.name);
    }
  } catch {
    partial.push("countries");
  }

  const weatherValue =
    weather.status === "fulfilled" ? weather.value : null;
  if (weather.status === "rejected") partial.push("weather");

  const attributions: Attribution[] = [];
  if (voyageAttractions.length > 0 || summaryUrl?.includes("wikivoyage")) {
    attributions.push({
      label: "Wikivoyage",
      url: summaryUrl ?? "https://en.wikivoyage.org",
      license: "CC BY-SA 4.0",
    });
  }
  if (nearbyAttractions.length > 0) {
    attributions.push({
      label: "Wikipedia",
      url: "https://en.wikipedia.org",
      license: "CC BY-SA 4.0",
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
