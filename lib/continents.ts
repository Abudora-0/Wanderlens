export interface Continent {
  id: string;
  name: string;
  /** Natural Earth CONTINENT value(s) for polygon filtering. */
  neValues: string[];
  /** Wikivoyage article title. */
  article: string;
  blurb: string;
  /** Globe camera target. */
  view: { lat: number; lng: number; altitude: number };
}

export const continents: Continent[] = [
  {
    id: "africa",
    name: "Africa",
    neValues: ["Africa"],
    article: "Africa",
    blurb: "Deserts, savanna, ancient kingdoms and two of the world's great rivers.",
    view: { lat: 2, lng: 20, altitude: 1.9 },
  },
  {
    id: "asia",
    name: "Asia",
    neValues: ["Asia"],
    article: "Asia",
    blurb: "The largest continent: Himalayan peaks, megacities, temple towns and island chains.",
    view: { lat: 30, lng: 95, altitude: 1.9 },
  },
  {
    id: "europe",
    name: "Europe",
    neValues: ["Europe"],
    article: "Europe",
    blurb: "Short hops between old capitals, alpine passes, fjords and Mediterranean coast.",
    view: { lat: 52, lng: 15, altitude: 1.55 },
  },
  {
    id: "north-america",
    name: "North America",
    neValues: ["North America"],
    article: "North America",
    blurb: "National parks on a continental scale, from Arctic tundra to the tropics.",
    view: { lat: 40, lng: -100, altitude: 1.9 },
  },
  {
    id: "south-america",
    name: "South America",
    neValues: ["South America"],
    article: "South America",
    blurb: "The Andes, the Amazon, Patagonian ice and Atlantic beach cities.",
    view: { lat: -20, lng: -60, altitude: 1.9 },
  },
  {
    id: "oceania",
    name: "Oceania",
    neValues: ["Oceania"],
    article: "Oceania",
    blurb: "Reefs, volcanic islands and the vast open Pacific between them.",
    view: { lat: -22, lng: 140, altitude: 1.9 },
  },
];

export function continentById(id: string | null | undefined): Continent | null {
  if (!id) return null;
  return continents.find((c) => c.id === id) ?? null;
}
