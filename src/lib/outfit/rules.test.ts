import { describe, expect, it } from "vitest";
import { isColorCompatible, scoreItem } from "./rules";
import type { ClothingItem } from "@/lib/types";

function makeItem(overrides: Partial<ClothingItem>): ClothingItem {
  return {
    id: 1,
    name: "Test Item",
    category: "pants",
    imageUrl: "x",
    color: "Black",
    brand: null,
    warmthScore: null,
    description: null,
    pattern: null,
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("outfit rules", () => {
  it("considers neutral colors compatible", () => {
    expect(isColorCompatible("Black", "Red")).toBe(true);
    expect(isColorCompatible("Navy", "Green")).toBe(true);
    expect(isColorCompatible("Pink", "Orange")).toBe(false);
  });

  it("prefers pants and long sleeves in cold weather (category-based)", () => {
    const weather = { location: "Home", tempF: 50, highF: 55, lowF: 45, condition: "Cloudy", willRain: false, isCold: true, tempBand: "cold" as const };
    const pants = makeItem({ category: "pants" });
    const shorts = makeItem({ category: "shorts" });
    expect(scoreItem(pants, weather)).toBeGreaterThan(scoreItem(shorts, weather));
  });

  it("prefers shorts and short sleeves in warm weather (category-based)", () => {
    const weather = { location: "Home", tempF: 85, highF: 90, lowF: 70, condition: "Clear", willRain: false, isCold: false, tempBand: "warm" as const };
    const shorts = makeItem({ category: "shorts" });
    const pants = makeItem({ category: "pants" });
    expect(scoreItem(shorts, weather)).toBeGreaterThan(scoreItem(pants, weather));
  });

  it("heavily penalizes outerwear in warm weather", () => {
    const weather = { location: "Home", tempF: 85, highF: 90, lowF: 70, condition: "Clear", willRain: false, isCold: false, tempBand: "warm" as const };
    const outer = makeItem({ category: "outerwear" });
    expect(scoreItem(outer, weather)).toBeLessThan(0);
  });

  it("rewards outerwear in freezing weather", () => {
    const weather = { location: "Home", tempF: 30, highF: 38, lowF: 22, condition: "Clear", willRain: false, isCold: true, tempBand: "freezing" as const };
    const outer = makeItem({ category: "outerwear" });
    expect(scoreItem(outer, weather)).toBeGreaterThan(0);
  });

  it("uses warmthScore distance from ideal when available", () => {
    const weather = { location: "Home", tempF: 30, highF: 38, lowF: 22, condition: "Clear", willRain: false, isCold: true, tempBand: "freezing" as const };
    const heavy = makeItem({ warmthScore: 9 }); // ideal for freezing is 9
    const light = makeItem({ warmthScore: 2 }); // far from ideal
    expect(scoreItem(heavy, weather)).toBeGreaterThan(scoreItem(light, weather));
  });

  it("gives boots a rainy weather bonus", () => {
    const weather = { location: "Home", tempF: 60, highF: 65, lowF: 52, condition: "Rain", willRain: true, isCold: false, tempBand: "mild" as const };
    const boots = makeItem({ category: "shoes", name: "Rain Boots" });
    const sneakers = makeItem({ category: "shoes", name: "White Sneakers" });
    expect(scoreItem(boots, weather)).toBeGreaterThan(scoreItem(sneakers, weather));
  });
});
