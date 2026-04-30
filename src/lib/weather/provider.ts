import type { TempBand, WeatherSnapshot } from "@/lib/types";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

// Boulder, CO — override with WEATHER_LOCATION="lat,lon,Label,Timezone"
function getLocation() {
  const parts = (process.env.WEATHER_LOCATION ?? "").split(",");
  const [lat, lon, label = "Boulder", tz = "America/Denver"] = parts;
  if (!lat || !lon) {
    return { lat: "40.0150", lon: "-105.2705", label: "Boulder", tz: "America/Denver" };
  }
  return { lat, lon, label, tz };
}

function getTempBand(tempF: number): TempBand {
  if (tempF < 45) return "freezing";
  if (tempF < 60) return "cold";
  if (tempF < 75) return "mild";
  return "warm";
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const { lat, lon, label, tz } = getLocation();

  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code_max");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", tz);
  url.searchParams.set("forecast_days", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
      weather_code_max?: number[];
    };
  };

  const tempF  = Math.round(payload.current?.temperature_2m ?? 65);
  const highF  = Math.round(payload.daily?.temperature_2m_max?.[0] ?? tempF);
  const lowF   = Math.round(payload.daily?.temperature_2m_min?.[0] ?? tempF);
  const rainPct = payload.daily?.precipitation_probability_max?.[0] ?? 0;
  const willRain = rainPct >= 40;

  const dailyCode = payload.daily?.weather_code_max?.[0] ?? payload.current?.weather_code ?? 0;
  let condition: string;
  if (willRain) {
    // WMO codes 70–79 = snow, 85–86 = snow showers
    condition = (dailyCode >= 70 && dailyCode <= 79) || dailyCode === 85 || dailyCode === 86
      ? "Snow"
      : "Rain";
  } else if (dailyCode <= 3) {
    condition = "Clear";
  } else {
    condition = "Cloudy";
  }

  return {
    location: label,
    tempF,
    highF,
    lowF,
    condition,
    willRain,
    isCold: highF < 60,
    tempBand: getTempBand(highF), // dress for the whole day, not just the morning
  };
}
