export type PlaceKind = "country" | "region" | "city" | "area" | "landmark";

export interface GeoCandidate {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  population: number | null;
  kind: PlaceKind;
  timezone: string | null;
}

export type AttractionCategory =
  | "landmark"
  | "museum"
  | "nature"
  | "religious"
  | "history"
  | "art"
  | "neighborhood"
  | "viewpoint"
  | "water"
  | "other";

export interface Attraction {
  id: string;
  title: string;
  blurb: string;
  category: AttractionCategory;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  score: number;
  source: "wikivoyage" | "wikipedia";
  url: string | null;
}

export interface CountryFacts {
  name: string;
  officialName: string | null;
  capital: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  area: number | null;
  languages: string[];
  currencies: string[];
  callingCode: string | null;
  flagEmoji: string | null;
  flagSvg: string | null;
  mapUrl: string | null;
}

export interface DailyWeather {
  date: string;
  code: number;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbability: number | null;
}

export interface WeatherNow {
  temperature: number | null;
  apparentTemperature: number | null;
  code: number;
  windSpeed: number | null;
  humidity: number | null;
  isDay: boolean;
  timezone: string | null;
  daily: DailyWeather[];
}

export interface Attribution {
  label: string;
  url: string;
  license: string;
}

export interface DestinationDossier {
  place: {
    name: string;
    displayName: string;
    latitude: number;
    longitude: number;
    kind: PlaceKind;
  };
  summary: string | null;
  summaryUrl: string | null;
  attractions: Attraction[];
  country: CountryFacts | null;
  weather: WeatherNow | null;
  attributions: Attribution[];
  partial: string[];
}

export type NodeKind = "continent" | "country" | "region" | "city" | "area";

export interface PlaceLink {
  /** Display name. */
  name: string;
  /** Wikivoyage article title to drill into next. */
  article: string;
  blurb: string;
  latitude: number | null;
  longitude: number | null;
  accent?: string;
}

export interface PlaceNode {
  title: string;
  kind: NodeKind;
  summary: string | null;
  banner: string | null;
  regions: PlaceLink[];
  cities: PlaceLink[];
  otherDestinations: PlaceLink[];
}

export interface Collection {
  id: string;
  title: string;
  tagline: string;
  accent: string;
  places: {
    name: string;
    country: string;
    blurb: string;
    latitude: number;
    longitude: number;
  }[];
}
