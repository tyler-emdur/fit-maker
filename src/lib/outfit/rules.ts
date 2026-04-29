import type { ClothingItem, WeatherSnapshot } from "@/lib/types";

export function scoreItem(item: ClothingItem, weather: WeatherSnapshot) {
  let score = 0;
  const targetWarmth = weather.isCold ? 8 : 4;
  score += 20 - Math.abs(item.warmthScore - targetWarmth) * 2;

  if (weather.isCold && (item.season === "fall" || item.season === "winter")) {
    score += 6;
  }
  if (!weather.isCold && (item.season === "spring" || item.season === "summer")) {
    score += 6;
  }
  if (weather.condition === "Rainy" && item.category === "shoes") {
    score += item.style.toLowerCase().includes("boot") ? 5 : -2;
  }

  return score;
}

export function isColorCompatible(topColor: string, bottomColor: string) {
  const neutral = new Set(["black", "white", "gray", "blue", "navy", "tan", "brown"]);
  const top = topColor.toLowerCase();
  const bottom = bottomColor.toLowerCase();
  if (top === bottom) {
    return true;
  }
  return neutral.has(top) || neutral.has(bottom);
}

