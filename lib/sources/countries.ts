import type { CountryFacts } from "@/lib/types";
import dataset from "@/lib/data/countries.json";
import { timedFetch } from "@/lib/sources/http";

interface StaticCountry {
  name: string;
  official: string | null;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  area: number | null;
  languages: string[];
  currencies: string[];
  callingCode: string | null;
  flag: string | null;
  cca3: string | null;
}

const COUNTRIES = dataset as Record<string, StaticCountry>;

function findByName(name: string): [string, StaticCountry] | null {
  const target = name.trim().toLowerCase();
  for (const [code, country] of Object.entries(COUNTRIES)) {
    if (
      country.name.toLowerCase() === target ||
      country.official?.toLowerCase() === target
    ) {
      return [code, country];
    }
  }
  for (const [code, country] of Object.entries(COUNTRIES)) {
    if (country.name.toLowerCase().includes(target) && target.length > 3) {
      return [code, country];
    }
  }
  return null;
}

async function getPopulation(iso3: string | null): Promise<number | null> {
  if (!iso3) return null;
  try {
    const res = await timedFetch(
      `https://api.worldbank.org/v2/country/${iso3}/indicator/SP.POP.TOTL?format=json&per_page=1&mrv=1`,
      { next: { revalidate: 604800 } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as [unknown, { value?: number }[] | null];
    const value = Array.isArray(body?.[1]) ? body[1][0]?.value : null;
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}

function toFacts(code: string, country: StaticCountry, population: number | null): CountryFacts {
  return {
    name: country.name,
    officialName: country.official,
    capital: country.capital,
    region: country.region,
    subregion: country.subregion,
    population,
    area: country.area,
    languages: country.languages ?? [],
    currencies: country.currencies ?? [],
    callingCode: country.callingCode,
    flagEmoji: country.flag,
    flagSvg: `https://flagcdn.com/${code.toLowerCase()}.svg`,
    mapUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(country.name)}`,
  };
}

export async function getCountryByCode(
  code: string,
): Promise<CountryFacts | null> {
  const country = COUNTRIES[code.toUpperCase()];
  if (!country) return null;
  const population = await getPopulation(country.cca3);
  return toFacts(code.toUpperCase(), country, population);
}

export async function getCountryByName(
  name: string,
): Promise<CountryFacts | null> {
  const match = findByName(name);
  if (!match) return null;
  const [code, country] = match;
  const population = await getPopulation(country.cca3);
  return toFacts(code, country, population);
}
