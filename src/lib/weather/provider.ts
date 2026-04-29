import type { WeatherSnapshot } from "@/lib/types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

function getLocation() {
  const [lat, lon, label = "Home"] = (process.env.WEATHER_LOCATION ?? "").split(",");
  if (!lat || !lon) {
    return { lat: "40.7128", lon: "-74.0060", label: "Home" };
  }
  return { lat, lon, label };
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const { lat, lon, label } = getLocation();
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    throw new Error("Weather provider failed.");
  }

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
  };
  const tempF = Math.round(payload.current?.temperature_2m ?? 65);
  const weatherCode = payload.current?.weather_code ?? 0;
  const condition = weatherCode <= 3 ? "Clear" : weatherCode < 50 ? "Cloudy" : "Rainy";

  return {
    location: label,
    tempF,
    condition,
    isCold: tempF < 60,
  };
}

