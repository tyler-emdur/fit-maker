import Image from "next/image";
import type { ClothingItem, Outfit } from "@/lib/types";

type OutfitCardProps = {
  outfit: Outfit & { createdAt?: string };
  itemsById: Map<number, ClothingItem>;
};

export function OutfitCard({ outfit, itemsById }: OutfitCardProps) {
  const top = outfit.topItemId ? itemsById.get(outfit.topItemId) : undefined;
  const shirt = outfit.shirtItemId ? itemsById.get(outfit.shirtItemId) : undefined;
  const bottom = itemsById.get(outfit.bottomItemId);
  const shoes = itemsById.get(outfit.shoesItemId);
  const weather = outfit.weatherSnapshot;

  const rationale = weather.isCold
    ? "Cold weather detected: prioritizing warmth layers."
    : "Mild weather: lighter combo prioritized.";

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Today&apos;s Fit</h2>
        <p className="text-sm text-zinc-500">
          {weather.location} · {weather.tempF}F · {weather.condition}
        </p>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{rationale}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[shirt, top, bottom, shoes]
          .filter((item): item is ClothingItem => Boolean(item))
          .map((item) => (
            <article key={item.id} className="rounded-lg border p-3">
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={320}
                height={144}
                unoptimized
                className="h-36 w-full rounded-md object-cover"
              />
              <div className="mt-2">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-zinc-500">
                  {item.category} · {item.color} · warmth {item.warmthScore}/10
                </p>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

