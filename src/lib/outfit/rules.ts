import type { ClothingItem, TempBand, WeatherSnapshot } from "@/lib/types";

// Ideal warmth score midpoint per temperature band
const IDEAL_WARMTH: Record<TempBand, number> = {
  freezing: 9,
  cold: 7,
  mild: 4,
  warm: 2,
};

function resolveTempBand(weather: WeatherSnapshot): TempBand {
  return weather.tempBand ?? (weather.isCold ? "cold" : "mild");
}

export function scoreItem(item: ClothingItem, weather: WeatherSnapshot) {
  const band = resolveTempBand(weather);
  let score = 0;

  // If the item has an AI-inferred warmth score, use distance from ideal
  if (item.warmthScore != null) {
    const distance = Math.abs(item.warmthScore - IDEAL_WARMTH[band]);
    score += Math.max(0, 15 - distance * 3);
  } else {
    // Fallback: category-based scoring
    if (band === "freezing") {
      if (item.category === "pants") score += 10;
      if (item.category === "long_sleeve") score += 10;
      if (item.category === "outerwear") score += 12;
    } else if (band === "cold") {
      if (item.category === "pants") score += 8;
      if (item.category === "long_sleeve") score += 8;
      if (item.category === "outerwear") score += 4;
    } else if (band === "warm") {
      if (item.category === "shorts") score += 10;
      if (item.category === "short_sleeve") score += 10;
      if (item.category === "outerwear") score -= 15;
    }
    // mild: no category-based bonus — let color/rotation decide
  }

  // Rain/snow bonus for boots
  if (weather.willRain && item.category === "shoes") {
    score += item.name.toLowerCase().includes("boot") ? 5 : -2;
  }

  return score;
}

export function isColorCompatible(topColor: string, bottomColor: string) {
  const neutral = new Set(["black", "white", "gray", "blue", "navy", "tan", "brown", "beige", "khaki", "grey", "cream"]);
  const top = topColor.toLowerCase();
  const bottom = bottomColor.toLowerCase();
  if (top === bottom) return true;
  return neutral.has(top) || neutral.has(bottom);
}
