import type { GeoCandidate, PlaceKind } from "@/lib/types";
import { timedFetch } from "@/lib/sources/http";

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  population?: number;
  timezone?: string;
  feature_code?: string;
}

const COUNTRY_FEATURE_CODES = new Set(["PCLI", "PCLD", "PCLF", "PCLS", "PCL"]);
const REGION_FEATURE_CODES = new Set([
  "ADM1",
  "ADM2",
  "ADM3",
  "RGN",
  "AREA",
  "TERR",
]);

function classify(result: OpenMeteoResult): PlaceKind {
  const code = result.feature_code ?? "";
  if (COUNTRY_FEATURE_CODES.has(code)) return "country";
  if (code.startsWith("PPL")) return "city";
  if (REGION_FEATURE_CODES.has(code)) return "region";
  if (code.startsWith("PRK") || code.startsWith("RES")) return "area";
  if (code.startsWith("MT") || code.startsWith("MON") || code.startsWith("CH")) {
    return "landmark";
  }
  return "area";
}

function buildDisplayName(result: OpenMeteoResult): string {
  const parts = [result.name];
  if (result.admin1 && result.admin1 !== result.name) parts.push(result.admin1);
  if (result.country && result.country !== result.name) parts.push(result.country);
  return parts.join(", ");
}

export async function geocode(query: string): Promise<GeoCandidate[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await timedFetch(url, { next: { revalidate: 86400 } }, 8000);
  if (!res.ok) throw new Error(`geocode upstream ${res.status}`);

  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  const results = data.results ?? [];

  return results.map((result) => ({
    id: String(result.id),
    name: result.name,
    displayName: buildDisplayName(result),
    country: result.country ?? "",
    countryCode: result.country_code ?? null,
    admin1: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    population: result.population ?? null,
    kind: classify(result),
    timezone: result.timezone ?? null,
  }));
}
