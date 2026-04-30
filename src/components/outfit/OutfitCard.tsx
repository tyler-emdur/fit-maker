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

  const w = weatherProp ?? outfit.weatherSnapshot;
  const { tempF, highF, lowF, condition, willRain, location, forecast } = w;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Weather header */}
      <div className="border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Today&apos;s Fit</p>
            <h2 className="mt-0.5 text-lg font-bold leading-tight">
              {Math.round(tempF)}°F now
              {highF != null && lowF != null && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  H {highF}° · L {lowF}°
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {condition}
              {willRain && " · Rain likely"}
              {" · "}{location}
            </p>
          </div>
        </div>

        {/* Hourly forecast row */}
        {forecast && forecast.length > 0 && (
          <div className="mt-3 flex gap-4 border-t border-zinc-50 pt-3">
            {forecast.map((h) => (
              <div key={h.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-medium text-zinc-400">{h.label}</span>
                <span className="text-sm font-semibold">{h.tempF}°</span>
                {h.rainPct >= 30 && (
                  <span className="text-[10px] font-medium text-blue-500">{h.rainPct}%</span>
                )}
              </div>
            ))}
          </div>
        )}
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
