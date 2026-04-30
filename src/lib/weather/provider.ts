import type { HourForecast, TempBand, WeatherSnapshot } from "@/lib/types";

// Boulder, CO — override with WEATHER_LOCATION="lat,lon,Label,Timezone"
function getLocation() {
  const parts = (process.env.WEATHER_LOCATION ?? "").split(",");
  const [lat, lon, label = "Boulder", tz = "America/Denver"] = parts;
  if (!lat || !lon) {
    return { lat: "40.015", lon: "-105.2706", label: "Boulder", tz: "America/Denver" };
  }
  return { lat, lon, label, tz };
}

function getTempBand(tempF: number): TempBand {
  if (tempF < 45) return "freezing";
  if (tempF < 60) return "cold";
  if (tempF < 75) return "mild";
  return "warm";
}

function fmtHour(h: number): string {
  if (h === 12) return "12PM";
  return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const { lat, lon, label, tz } = getLocation();

  // Exact URL structure requested — added current=temperature_2m for live temp,
  // precipitation_sum to daily for rain detection, weather_code to hourly for snow
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&hourly=temperature_2m,precipitation,precipitation_probability,weather_code` +
    `&timezone=${encodeURIComponent(tz)}` +
    `&forecast_days=1` +
    `&temperature_unit=fahrenheit`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);

  const data = (await res.json()) as {
    current: { temperature_2m: number };
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation: number[];
      precipitation_probability: number[];
      weather_code: number[];
    };
  };

  const tempF = Math.round(data.current.temperature_2m);
  const highF = Math.round(data.daily.temperature_2m_max[0]);
  const lowF  = Math.round(data.daily.temperature_2m_min[0]);
  const precipSum = data.daily.precipitation_sum[0] ?? 0;

  // Rain = any meaningful precipitation today
  const willRain = precipSum > 0.3 ||
    data.hourly.precipitation_probability.some((p) => p >= 40);

  // Snow = hourly weather codes 70-77 or 85-86 (snowfall)
  const hasSnow = data.hourly.weather_code.some(
    (c) => (c >= 70 && c <= 77) || c === 85 || c === 86,
  );
  const condition = hasSnow ? "Snow" : willRain ? "Rain" : "Clear";

  // Hourly forecast at 9AM / 12PM / 3PM / 6PM
  // hourly array starts at midnight (index 0 = 00:00, index 9 = 09:00, etc.)
  const forecast: HourForecast[] = [9, 12, 15, 18].map((h) => ({
    label: fmtHour(h),
    tempF: Math.round(data.hourly.temperature_2m[h]),
    rainPct: data.hourly.precipitation_probability[h] ?? 0,
  }));

  // Use peak school-hours temp (8AM–4PM) for outfit band so clothes fit the whole day
  const schoolTemps = data.hourly.temperature_2m.slice(8, 17);
  const peakTemp = schoolTemps.length > 0 ? Math.max(...schoolTemps) : highF;

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
