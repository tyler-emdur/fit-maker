import Link from "next/link";
import { getItemsByIds } from "@/lib/db/client";
import { getOrCreateTodayOutfit } from "@/lib/outfit/service";
import { getWeatherSnapshot } from "@/lib/weather/provider";
import { LogoutButton } from "@/components/LogoutButton";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { RegenerateButton } from "@/components/outfit/RegenerateButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [outfit, freshWeather] = await Promise.all([
    getOrCreateTodayOutfit(),
    getWeatherSnapshot().catch(() => null),
  ]);

  const ids = outfit
    ? [outfit.topItemId, outfit.shirtItemId, outfit.bottomItemId, outfit.shoesItemId].filter(
        (v): v is number => v !== null,
      )
    : [];
  const items = ids.length ? await getItemsByIds(ids) : [];
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
          <span className="text-xl font-black tracking-tight">FIT MAKER</span>
          <div className="flex items-center gap-6">
            <Link
              href="/closet"
              className="text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline"
            >
              Closet
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        {!outfit ? (
          <div className="flex flex-col items-center justify-center border border-[#e8e8e8] bg-white px-6 py-16 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
              No Outfit
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-tight">Closet Empty</h2>
            <p className="mt-2 max-w-xs text-sm text-zinc-500">
              Add some clothes and we&apos;ll put together your first outfit.
            </p>
            <Link
              href="/closet"
              className="mt-6 bg-zinc-900 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-zinc-700"
            >
              Add clothes
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <OutfitCard
              outfit={outfit}
              itemsById={itemsById}
              weather={freshWeather ?? outfit.weatherSnapshot}
            />
            <RegenerateButton />
          </div>
        )}
      </main>
    </div>
  );
}
