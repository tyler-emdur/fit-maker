import Link from "next/link";
import { getItemsByIds } from "@/lib/db/client";
import { getOrCreateTodayOutfit } from "@/lib/outfit/service";
import { LogoutButton } from "@/components/LogoutButton";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { RegenerateButton } from "@/components/outfit/RegenerateButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const outfit = await getOrCreateTodayOutfit();

  const ids = outfit
    ? [outfit.topItemId, outfit.shirtItemId, outfit.bottomItemId, outfit.shoesItemId].filter(
        (v): v is number => v !== null,
      )
    : [];
  const items = ids.length ? await getItemsByIds(ids) : [];
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3.5">
          <span className="text-base font-semibold tracking-tight">Fit Maker</span>
          <div className="flex items-center gap-1">
            <Link
              href="/closet"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Closet
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        {!outfit ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              👔
            </div>
            <h2 className="mt-4 text-base font-semibold">Your closet is empty</h2>
            <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
              Add some clothes and we&apos;ll put together your first outfit.
            </p>
            <Link
              href="/closet"
              className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Add clothes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <OutfitCard outfit={outfit} itemsById={itemsById} />
            <RegenerateButton />
          </div>
        )}
      </main>
    </div>
  );
}
