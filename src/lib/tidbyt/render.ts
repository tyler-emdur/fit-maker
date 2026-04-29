import type { ClothingItem } from "@/lib/types";

export function renderTidbytOutfitPng(input: {
  tempF: number;
  condition: string;
  location: string;
  itemNames: string[];
}) {
  const summary = `Outfit ${input.location} ${input.tempF}F ${input.condition} ${input.itemNames.join(", ")}`;
  const textBytes = Buffer.from(summary, "utf8").length;

  // Minimal 1x1 PNG with deterministic byte marker from the summary.
  const basePng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WnQ0AAAAASUVORK5CYII=",
    "base64",
  );
  const marker = Buffer.from([textBytes % 255]);
  return Buffer.concat([basePng, marker]);
}

export function itemsToNames(items: ClothingItem[]) {
  return items
    .sort((a, b) => a.category.localeCompare(b.category))
    .map((item) => `${item.category}: ${item.name}`);
}

