import type { WeatherNow } from "@/lib/types";

interface ForecastResponse {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    relative_humidity_2m?: number;
    is_day?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

export async function getWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherNow | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toFixed(3));
  url.searchParams.set("longitude", longitude.toFixed(3));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`weather upstream ${res.status}`);

  const data = (await res.json()) as ForecastResponse;
  const current = data.current ?? {};
  const daily = data.daily ?? {};
  const times = daily.time ?? [];

  return {
    temperature: current.temperature_2m ?? null,
    apparentTemperature: current.apparent_temperature ?? null,
    code: current.weather_code ?? 0,
    windSpeed: current.wind_speed_10m ?? null,
    humidity: current.relative_humidity_2m ?? null,
    isDay: current.is_day !== 0,
    timezone: data.timezone ?? null,
    daily: times.map((date, index) => ({
      date,
      code: daily.weather_code?.[index] ?? 0,
      tempMax: daily.temperature_2m_max?.[index] ?? null,
      tempMin: daily.temperature_2m_min?.[index] ?? null,
      precipitationProbability: daily.precipitation_probability_max?.[index] ?? null,
    })),
  };
}
