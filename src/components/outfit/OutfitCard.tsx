import Image from "next/image";
import type { ClothingItem, Outfit, WeatherSnapshot } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  short_sleeve: "Tee",
  long_sleeve: "Long Sleeve",
  pants: "Pants",
  shorts: "Shorts",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

type OutfitCardProps = {
  outfit: Outfit & { createdAt?: string };
  itemsById: Map<number, ClothingItem>;
  weather?: WeatherSnapshot;
};

export function OutfitCard({ outfit, itemsById, weather: weatherProp }: OutfitCardProps) {
  const pieces = [
    outfit.topItemId ? itemsById.get(outfit.topItemId) : undefined,
    outfit.shirtItemId ? itemsById.get(outfit.shirtItemId) : undefined,
    outfit.bottomItemId ? itemsById.get(outfit.bottomItemId) : undefined,
    outfit.shoesItemId ? itemsById.get(outfit.shoesItemId) : undefined,
  ].filter((item): item is ClothingItem => Boolean(item));

  const { tempF, highF, lowF, condition, willRain, location } = weatherProp ?? outfit.weatherSnapshot;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Today&apos;s Fit</p>
          <h2 className="mt-0.5 text-lg font-bold leading-tight">
            {highF != null ? `${highF}° / ${lowF}°F` : `${Math.round(tempF)}°F`}
            {" — "}{condition}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {willRain && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              Rain likely
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">{location}</span>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-px bg-zinc-100">
        {pieces.map((item) => (
          <div key={item.id} className="bg-white">
            <div className="relative h-52 w-full bg-zinc-50">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized
                className="object-contain p-2"
              />
            </div>
            <div className="px-3.5 pb-3.5 pt-2.5">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {CATEGORY_LABEL[item.category] ?? item.category}
                {item.color ? ` · ${item.color}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
