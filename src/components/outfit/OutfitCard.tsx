import Image from "next/image";
import type { ClothingItem, Outfit } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  short_sleeve: "Short Sleeve",
  long_sleeve: "Long Sleeve",
  pants: "Pants",
  shorts: "Shorts",
  outerwear: "Outerwear",
  shoes: "Shoes",
};

type OutfitCardProps = {
  outfit: Outfit & { createdAt?: string };
  itemsById: Map<number, ClothingItem>;
};

export function OutfitCard({ outfit, itemsById }: OutfitCardProps) {
  const pieces = [
    outfit.topItemId ? itemsById.get(outfit.topItemId) : undefined,
    outfit.shirtItemId ? itemsById.get(outfit.shirtItemId) : undefined,
    outfit.bottomItemId ? itemsById.get(outfit.bottomItemId) : undefined,
    outfit.shoesItemId ? itemsById.get(outfit.shoesItemId) : undefined,
  ].filter((item): item is ClothingItem => Boolean(item));

  const weather = outfit.weatherSnapshot;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-bold">Today&apos;s Fit</h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {weather.location} · {weather.tempF}°F · {weather.condition}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {pieces.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50"
          >
            <div className="relative h-40 w-full">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="px-3 py-2.5">
              <p className="truncate font-semibold text-sm">{item.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400 capitalize">
                {CATEGORY_LABEL[item.category] ?? item.category} · {item.color}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
