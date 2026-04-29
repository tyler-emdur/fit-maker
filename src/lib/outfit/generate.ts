import { listItems, listRecentOutfits, listRecentOutfitItems } from "@/lib/db/client";
import { isColorCompatible, scoreItem } from "@/lib/outfit/rules";
import type { ClothingItem, Outfit, WeatherSnapshot } from "@/lib/types";

const HARD_BLOCK_DAYS = 1.5;  // items worn within this many days are excluded entirely
const SOFT_PENALTY_DAYS = 5;   // items worn within this many days get a rotation penalty

function buildHistorySet(
  outfits: Array<{ topItemId: number | null; shirtItemId: number | null; bottomItemId: number; shoesItemId: number }>,
) {
  return new Set(
    outfits.map(
      (o) => `${o.topItemId ?? "none"}:${o.shirtItemId ?? "none"}:${o.bottomItemId}:${o.shoesItemId}`,
    ),
  );
}

function rotationPenalty(itemId: number, penaltyMap: Map<number, number>): number {
  const daysAgo = penaltyMap.get(itemId);
  if (daysAgo === undefined) return 0;
  return -Math.round((SOFT_PENALTY_DAYS - daysAgo) * 3);
}

function pickBest(
  items: ClothingItem[],
  weather: WeatherSnapshot,
  penaltyMap: Map<number, number>,
) {
  return [...items].sort(
    (a, b) =>
      scoreItem(b, weather) + rotationPenalty(b.id, penaltyMap) -
      (scoreItem(a, weather) + rotationPenalty(a.id, penaltyMap)),
  )[0];
}

function isIncludeOuterwear(weather: WeatherSnapshot) {
  const band = weather.tempBand ?? (weather.isCold ? "cold" : "mild");
  return band === "freezing" || band === "cold";
}

export async function generateOutfit(weather: WeatherSnapshot, source: Outfit["source"]) {
  const [items, recent, recentItemRows] = await Promise.all([
    listItems(),
    listRecentOutfits(14),
    listRecentOutfitItems(7),
  ]);

  const active = items.filter((i) => i.active);

  // Build rotation sets
  const blockedIds = new Set(
    recentItemRows
      .filter((r) => r.days_ago < HARD_BLOCK_DAYS)
      .map((r) => r.item_id),
  );
  const penaltyMap = new Map<number, number>();
  for (const r of recentItemRows) {
    if (r.days_ago >= HARD_BLOCK_DAYS && r.days_ago < SOFT_PENALTY_DAYS) {
      // keep smallest daysAgo per item (most recent wear)
      const existing = penaltyMap.get(r.item_id);
      if (existing === undefined || r.days_ago < existing) {
        penaltyMap.set(r.item_id, r.days_ago);
      }
    }
  }

  const filter = (arr: ClothingItem[]) => arr.filter((i) => !blockedIds.has(i.id));

  // Category pools (excluding hard-blocked items)
  const tees = filter(active.filter((i) => i.category === "long_sleeve" || i.category === "short_sleeve"));
  const bottoms = filter(active.filter((i) => i.category === "shorts" || i.category === "pants"));
  const outerwear = filter(active.filter((i) => i.category === "outerwear"));
  const shoes = filter(active.filter((i) => i.category === "shoes"));

  // Fall back to including blocked items if a category is empty after filtering
  const teesAll = active.filter((i) => i.category === "long_sleeve" || i.category === "short_sleeve");
  const bottomsAll = active.filter((i) => i.category === "shorts" || i.category === "pants");
  const shoesAll = active.filter((i) => i.category === "shoes");

  const teeFinal = tees.length > 0 ? tees : teesAll;
  const bottomFinal = bottoms.length > 0 ? bottoms : bottomsAll;
  const shoesFinal = shoes.length > 0 ? shoes : shoesAll;

  if (teeFinal.length === 0 || bottomFinal.length === 0 || shoesFinal.length === 0) {
    throw new Error("Not enough clothing items to build an outfit.");
  }

  const historySet = buildHistorySet(recent);
  const withPenalty = (arr: ClothingItem[]) =>
    [...arr].sort(
      (a, b) =>
        scoreItem(b, weather) + rotationPenalty(b.id, penaltyMap) -
        (scoreItem(a, weather) + rotationPenalty(a.id, penaltyMap)),
    );

  const sortedBottoms = withPenalty(bottomFinal);
  const sortedShoes = withPenalty(shoesFinal);
  const sortedTees = withPenalty(teeFinal);
  const sortedOuterwear = withPenalty(outerwear.length > 0 ? outerwear : active.filter((i) => i.category === "outerwear"));

  const includeOuterwear = isIncludeOuterwear(weather);

  for (const bottom of sortedBottoms) {
    for (const shoe of sortedShoes) {
      const tee = pickBest(
        sortedTees.filter((t) => isColorCompatible(t.color, bottom.color)),
        weather,
        penaltyMap,
      );
      const outer = includeOuterwear
        ? pickBest(
            sortedOuterwear.filter((o) => isColorCompatible(o.color, bottom.color)),
            weather,
            penaltyMap,
          )
        : null;

      if (!tee) continue;

      const key = `${outer?.id ?? "none"}:${tee.id}:${bottom.id}:${shoe.id}`;
      if (historySet.has(key)) continue;

      return {
        topItemId: outer?.id ?? null,
        shirtItemId: tee.id,
        bottomItemId: bottom.id,
        shoesItemId: shoe.id,
        weatherSnapshot: weather,
        source,
      } satisfies Outfit;
    }
  }

  // Fallback: best items regardless of history
  return {
    topItemId: includeOuterwear ? (sortedOuterwear[0]?.id ?? null) : null,
    shirtItemId: sortedTees[0].id,
    bottomItemId: sortedBottoms[0].id,
    shoesItemId: sortedShoes[0].id,
    weatherSnapshot: weather,
    source,
  } satisfies Outfit;
}
