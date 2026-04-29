import { NextResponse } from "next/server";
import { getItemsByIds } from "@/lib/db/client";
import { getOrCreateTodayOutfit } from "@/lib/outfit/service";
import { pushToTidbyt } from "@/lib/tidbyt/push";
import { itemsToNames, renderTidbytOutfitPng } from "@/lib/tidbyt/render";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization");
  if (cronSecret && provided !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const outfit = await getOrCreateTodayOutfit();
    if (!outfit) {
      return NextResponse.json({ ok: false, error: "No outfit — closet is empty." }, { status: 422 });
    }
    const ids = [outfit.topItemId, outfit.shirtItemId, outfit.bottomItemId, outfit.shoesItemId].filter(
      (value): value is number => value !== null,
    );
    const items = await getItemsByIds(ids);
    const imagePng = renderTidbytOutfitPng({
      tempF: outfit.weatherSnapshot.tempF,
      condition: outfit.weatherSnapshot.condition,
      location: outfit.weatherSnapshot.location,
      itemNames: itemsToNames(items),
    });

    const pushed = await pushToTidbyt({ imagePng });
    return NextResponse.json({ ok: true, pushed });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown cron failure",
      },
      { status: 500 },
    );
  }
}

