import { insertOutfit, listRecentOutfits } from "@/lib/db/client";
import { generateOutfit } from "@/lib/outfit/generate";
import { getWeatherSnapshot } from "@/lib/weather/provider";

export async function getOrCreateTodayOutfit() {
  const recent = await listRecentOutfits(1);
  const latest = recent[0];
  const today = new Date().toISOString().slice(0, 10);

  if (latest?.createdAt?.slice(0, 10) === today) {
    return latest;
  }

  const weather = await getWeatherSnapshot().catch(() => ({
    location: "Boulder",
    tempF: 65,
    highF: 70,
    lowF: 50,
    condition: "Clear",
    willRain: false,
    isCold: false,
  }));
  try {
    const generated = await generateOutfit(weather, "auto");
    const id = await insertOutfit(generated);
    return { ...generated, id, createdAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function regenerateTodayOutfit() {
  const weather = await getWeatherSnapshot().catch(() => ({
    location: "Boulder",
    tempF: 65,
    highF: 70,
    lowF: 50,
    condition: "Clear",
    willRain: false,
    isCold: false,
  }));
  const generated = await generateOutfit(weather, "manual_regen");
  const id = await insertOutfit(generated);
  return { ...generated, id, createdAt: new Date().toISOString() };
}

