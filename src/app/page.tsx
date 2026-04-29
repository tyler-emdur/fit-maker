import Link from "next/link";
import { getItemsByIds } from "@/lib/db/client";
import { getOrCreateTodayOutfit } from "@/lib/outfit/service";
import { LogoutButton } from "@/components/LogoutButton";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { RegenerateButton } from "@/components/outfit/RegenerateButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const outfit = await getOrCreateTodayOutfit();
  const ids = [outfit.topItemId, outfit.shirtItemId, outfit.bottomItemId, outfit.shoesItemId].filter(
    (value): value is number => value !== null,
  );
  const items = await getItemsByIds(ids);
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Fit Maker</h1>
          <p className="text-sm text-zinc-500">Private weather-aware outfit planner.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="rounded-md border px-3 py-1 text-sm" href="/closet">
            Closet
          </Link>
          <LogoutButton />
        </div>
      </header>

      <OutfitCard outfit={outfit} itemsById={itemsById} />
      <RegenerateButton />
    </main>
  );
}
