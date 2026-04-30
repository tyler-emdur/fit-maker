import type { HourForecast, TempBand, WeatherSnapshot } from "@/lib/types";

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

// Hours we want to show in the "throughout the day" forecast
const FORECAST_HOURS = [9, 12, 15, 18]; // 9AM, 12PM, 3PM, 6PM

function fmtHour(h: number): string {
  if (h === 12) return "12PM";
  return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const { lat, lon, label, tz } = getLocation();

  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code_max");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", tz);
  url.searchParams.set("forecast_days", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);

  const data = (await response.json()) as {
    current?: { temperature_2m?: number; weather_code?: number };
    hourly?: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: number[];
      weather_code: number[];
    };
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
      weather_code_max?: number[];
    };
  };

  const tempF   = Math.round(data.current?.temperature_2m ?? 65);
  const highF   = Math.round(data.daily?.temperature_2m_max?.[0] ?? tempF);
  const lowF    = Math.round(data.daily?.temperature_2m_min?.[0] ?? tempF);
  const rainPct = data.daily?.precipitation_probability_max?.[0] ?? 0;
  const willRain = rainPct >= 40;

  const dailyCode = data.daily?.weather_code_max?.[0] ?? data.current?.weather_code ?? 0;
  let condition: string;
  if (willRain) {
    condition = (dailyCode >= 70 && dailyCode <= 79) || dailyCode === 85 || dailyCode === 86
      ? "Snow" : "Rain";
  } else if (dailyCode <= 3) {
    condition = "Clear";
  } else {
    condition = "Cloudy";
  }

  // Build hourly forecast for key times today
  const forecast: HourForecast[] = [];
  if (data.hourly) {
    const { time, temperature_2m, precipitation_probability } = data.hourly;
    for (const targetHour of FORECAST_HOURS) {
      // Open-Meteo hourly times look like "2026-04-30T09:00"
      const idx = time.findIndex((t) => t.endsWith(`T${String(targetHour).padStart(2, "0")}:00`));
      if (idx !== -1) {
        forecast.push({
          label: fmtHour(targetHour),
          tempF: Math.round(temperature_2m[idx]),
          rainPct: precipitation_probability[idx] ?? 0,
        });
      }
    }
  }

  // Use peak temp during school hours (8AM–4PM) for outfit band decisions
  const schoolHourTemps = data.hourly
    ? data.hourly.time
        .map((t, i) => {
          const h = parseInt(t.slice(11, 13), 10);
          return h >= 8 && h <= 16 ? data.hourly!.temperature_2m[i] : null;
        })
        .filter((t): t is number => t !== null)
    : [];
  const peakTemp = schoolHourTemps.length > 0 ? Math.max(...schoolHourTemps) : highF;

  return {
    location: label,
    tempF,
    highF,
    lowF,
    condition,
    willRain,
    isCold: peakTemp < 60,
    tempBand: getTempBand(peakTemp),
    forecast,
  };
}
