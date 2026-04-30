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
    <section className="overflow-hidden border border-[#e8e8e8] bg-white">
      {/* Weather header */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
          Today&apos;s Fit
        </p>

        <div className="mt-3 flex items-end justify-between gap-4">
          <span className="text-[56px] font-black leading-none tracking-tight text-zinc-900">
            {Math.round(tempF)}°
          </span>
          <div className="mb-1 text-right">
            {highF != null && lowF != null && (
              <p className="text-sm font-semibold text-zinc-500">
                H {highF}° &nbsp;L {lowF}°
              </p>
            )}
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
              {condition}
              {willRain && " · Rain"}
              {" · "}
              {location}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-[#e8e8e8]" />

        {/* Hourly forecast pills */}
        {forecast && forecast.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {forecast.map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-3 py-1.5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {h.label}
                </span>
                <span className="text-[12px] font-bold text-zinc-900">{h.tempF}°</span>
                {h.rainPct >= 30 && (
                  <span className="text-[10px] font-semibold text-blue-500">{h.rainPct}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clothing grid */}
      <div className="border-t border-[#e8e8e8] grid grid-cols-2">
        {pieces.map((item, idx) => (
          <div
            key={item.id}
            className={[
              "group cursor-default transition-transform duration-150 hover:-translate-y-0.5",
              idx % 2 === 0 ? "border-r border-[#e8e8e8]" : "",
              idx >= 2 ? "border-t border-[#e8e8e8]" : "",
            ].join(" ")}
          >
            <div className="relative h-64 w-full bg-[#f8f8f8]">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized
                className="object-contain p-3"
              />
            </div>
            <div className="border-t border-[#e8e8e8] px-4 pb-4 pt-3">
              <p className="truncate text-base font-medium leading-snug">{item.name}</p>
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
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
