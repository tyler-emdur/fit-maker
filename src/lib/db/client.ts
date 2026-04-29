import { sql } from "@vercel/postgres";
import { bootstrapSchemaSql } from "@/lib/db/schema";
import { categories, type ClothingItem, type Outfit, type WeatherSnapshot } from "@/lib/types";

let initialized = false;

function assertCategory(value: string): ClothingItem["category"] {
  if (!categories.includes(value as ClothingItem["category"])) {
    throw new Error(`Unknown category: ${value}`);
  }
  return value as ClothingItem["category"];
}

export async function ensureDatabase() {
  if (initialized) {
    return;
  }
  await sql.query(bootstrapSchemaSql);
  initialized = true;
}

export async function listItems() {
  await ensureDatabase();
  const result = await sql<{
    id: number;
    name: string;
    category: string;
    image_url: string;
    warmth_score: number;
    color: string;
    style: string;
    season: string;
    active: boolean;
    created_at: Date;
  }>`SELECT * FROM items ORDER BY created_at DESC`;

  return result.rows.map((row): ClothingItem => ({
    id: row.id,
    name: row.name,
    category: assertCategory(row.category),
    imageUrl: row.image_url,
    warmthScore: row.warmth_score,
    color: row.color,
    style: row.style,
    season: row.season,
    active: row.active,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getItemsByIds(ids: number[]) {
  if (ids.length === 0) {
    return [] as ClothingItem[];
  }
  const all = await listItems();
  const allowed = new Set(ids);
  return all.filter((item) => allowed.has(item.id));
}

export async function insertItem(input: Omit<ClothingItem, "id" | "createdAt">) {
  await ensureDatabase();
  const result = await sql<{
    id: number;
  }>`INSERT INTO items (name, category, image_url, warmth_score, color, style, season, active)
  VALUES (${input.name}, ${input.category}, ${input.imageUrl}, ${input.warmthScore}, ${input.color}, ${input.style}, ${input.season}, ${input.active})
  RETURNING id`;
  return result.rows[0]?.id;
}

export async function updateItem(
  id: number,
  patch: Partial<Omit<ClothingItem, "id" | "createdAt">>,
) {
  await ensureDatabase();
  const existing = await sql`SELECT * FROM items WHERE id = ${id} LIMIT 1`;
  const current = existing.rows[0];
  if (!current) {
    return false;
  }

  await sql`UPDATE items
  SET name = ${patch.name ?? current.name},
      category = ${patch.category ?? current.category},
      image_url = ${patch.imageUrl ?? current.image_url},
      warmth_score = ${patch.warmthScore ?? current.warmth_score},
      color = ${patch.color ?? current.color},
      style = ${patch.style ?? current.style},
      season = ${patch.season ?? current.season},
      active = ${patch.active ?? current.active}
  WHERE id = ${id}`;
  return true;
}

export async function listRecentOutfits(limit = 14) {
  await ensureDatabase();
  const result = await sql<{
    id: number;
    created_at: Date;
    weather_snapshot: WeatherSnapshot;
    top_item_id: number | null;
    shirt_item_id: number | null;
    bottom_item_id: number;
    shoes_item_id: number;
    source: Outfit["source"];
  }>`SELECT * FROM outfits ORDER BY created_at DESC LIMIT ${limit}`;

  return result.rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at.toISOString(),
    weatherSnapshot: row.weather_snapshot,
    topItemId: row.top_item_id,
    shirtItemId: row.shirt_item_id,
    bottomItemId: row.bottom_item_id,
    shoesItemId: row.shoes_item_id,
    source: row.source,
  }));
}

export async function insertOutfit(outfit: Outfit) {
  await ensureDatabase();
  const result = await sql<{ id: number }>`INSERT INTO outfits (
    weather_snapshot,
    top_item_id,
    shirt_item_id,
    bottom_item_id,
    shoes_item_id,
    source
  ) VALUES (
    ${JSON.stringify(outfit.weatherSnapshot)}::jsonb,
    ${outfit.topItemId},
    ${outfit.shirtItemId},
    ${outfit.bottomItemId},
    ${outfit.shoesItemId},
    ${outfit.source}
  ) RETURNING id`;
  return result.rows[0]?.id;
}

