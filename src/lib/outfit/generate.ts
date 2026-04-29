import { listItems, listRecentOutfits } from "@/lib/db/client";
import { isColorCompatible, scoreItem } from "@/lib/outfit/rules";
import type { ClothingItem, Outfit, WeatherSnapshot } from "@/lib/types";

function pickBest(items: ClothingItem[], weather: WeatherSnapshot) {
  return [...items].sort((a, b) => scoreItem(b, weather) - scoreItem(a, weather))[0];
}

function buildHistorySet(
  outfits: Array<{ topItemId: number | null; shirtItemId: number | null; bottomItemId: number; shoesItemId: number }>,
) {
  return new Set(
    outfits.map(
      (o) => `${o.topItemId ?? "none"}:${o.shirtItemId ?? "none"}:${o.bottomItemId}:${o.shoesItemId}`,
    ),
  );
}

export async function generateOutfit(weather: WeatherSnapshot, source: Outfit["source"]) {
  const [items, recent] = await Promise.all([listItems(), listRecentOutfits(14)]);
  const tops = items.filter((i) => i.active && i.category === "top");
  const shirts = items.filter((i) => i.active && i.category === "shirt");
  const bottoms = items.filter((i) => i.active && i.category === "bottom");
  const shoes = items.filter((i) => i.active && i.category === "shoes");

  if (bottoms.length === 0 || shoes.length === 0 || (tops.length === 0 && shirts.length === 0)) {
    throw new Error("Not enough clothing items to build an outfit.");
  }

  const historySet = buildHistorySet(recent);
  const sortedBottoms = [...bottoms].sort((a, b) => scoreItem(b, weather) - scoreItem(a, weather));
  const sortedShoes = [...shoes].sort((a, b) => scoreItem(b, weather) - scoreItem(a, weather));
  const sortedTops = [...tops].sort((a, b) => scoreItem(b, weather) - scoreItem(a, weather));
  const sortedShirts = [...shirts].sort((a, b) => scoreItem(b, weather) - scoreItem(a, weather));

  for (const bottom of sortedBottoms) {
    for (const shoe of sortedShoes) {
      const shirt = pickBest(
        sortedShirts.filter((candidate) => isColorCompatible(candidate.color, bottom.color)),
        weather,
      );
      const topLayer = weather.isCold
        ? pickBest(
            sortedTops.filter((candidate) => isColorCompatible(candidate.color, bottom.color)),
            weather,
          )
        : null;

      const key = `${topLayer?.id ?? "none"}:${shirt?.id ?? "none"}:${bottom.id}:${shoe.id}`;
      if (historySet.has(key)) {
        continue;
      }

      if (!shirt && !topLayer) {
        continue;
      }

      return {
        topItemId: topLayer?.id ?? null,
        shirtItemId: shirt?.id ?? null,
        bottomItemId: bottom.id,
        shoesItemId: shoe.id,
        weatherSnapshot: weather,
        source,
      } satisfies Outfit;
    }
  }

  return {
    topItemId: sortedTops[0]?.id ?? null,
    shirtItemId: sortedShirts[0]?.id ?? null,
    bottomItemId: sortedBottoms[0].id,
    shoesItemId: sortedShoes[0].id,
    weatherSnapshot: weather,
    source,
  } satisfies Outfit;
}

