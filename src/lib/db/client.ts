import { neon, Pool } from "@neondatabase/serverless";
import { bootstrapStatements } from "@/lib/db/schema";
import { categories, type ClothingItem, type Outfit, type WeatherSnapshot } from "@/lib/types";

const sql = neon(process.env.POSTGRES_URL!, { fullResults: true });
const pool = new Pool({ connectionString: process.env.POSTGRES_URL! });

let initialized = false;

function assertCategory(value: string): ClothingItem["category"] {
  if (!categories.includes(value as ClothingItem["category"])) {
    throw new Error(`Unknown category: ${value}`);
  }
  return value as ClothingItem["category"];
}

export async function ensureDatabase() {
  if (initialized) return;
  for (const stmt of bootstrapStatements) {
    await pool.query(stmt);
  }
  initialized = true;
}

export async function listItems() {
  await ensureDatabase();
  const result = await sql`SELECT * FROM items ORDER BY created_at DESC`;
  const rows = result.rows as Array<{
    id: number; name: string; category: string; image_url: string;
    color: string; style: string; warmth_score: number | null;
    description: string | null; pattern: string | null; active: boolean; created_at: Date;
  }>;

  return rows.map((row): ClothingItem => ({
    id: row.id,
    name: row.name,
    category: assertCategory(row.category),
    imageUrl: row.image_url,
    color: row.color,
    style: row.style,
    warmthScore: row.warmth_score ?? null,
    description: row.description ?? null,
    pattern: row.pattern ?? null,
    active: row.active,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function getItemsByIds(ids: number[]) {
  if (ids.length === 0) return [] as ClothingItem[];
  const all = await listItems();
  const allowed = new Set(ids);
  return all.filter((item) => allowed.has(item.id));
}

export async function insertItem(input: Omit<ClothingItem, "id" | "createdAt">) {
  await ensureDatabase();
  const result = await sql`
    INSERT INTO items (name, category, image_url, color, style, warmth_score, description, pattern, active)
    VALUES (${input.name}, ${input.category}, ${input.imageUrl}, ${input.color}, ${input.style},
            ${input.warmthScore ?? null}, ${input.description ?? null}, ${input.pattern ?? null}, ${input.active})
    RETURNING id`;
  const rows = result.rows as Array<{ id: number }>;
  return rows[0]?.id;
}

export async function updateItem(
  id: number,
  patch: Partial<Omit<ClothingItem, "id" | "createdAt">>,
) {
  await ensureDatabase();
  const existing = await sql`SELECT * FROM items WHERE id = ${id} LIMIT 1`;
  const current = existing.rows[0] as {
    name: string; category: string; image_url: string;
    color: string; style: string; warmth_score: number | null;
    description: string | null; pattern: string | null; active: boolean;
  } | undefined;
  if (!current) return false;

  await sql`UPDATE items
    SET name         = ${patch.name         ?? current.name},
        category     = ${patch.category     ?? current.category},
        image_url    = ${patch.imageUrl     ?? current.image_url},
        color        = ${patch.color        ?? current.color},
        style        = ${patch.style        ?? current.style},
        warmth_score = ${patch.warmthScore  ?? current.warmth_score},
        description  = ${patch.description  ?? current.description},
        pattern      = ${patch.pattern      ?? current.pattern},
        active       = ${patch.active       ?? current.active}
    WHERE id = ${id}`;
  return true;
}

export async function listRecentOutfits(limit = 14) {
  await ensureDatabase();
  const result = await sql`SELECT * FROM outfits ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = result.rows as Array<{
    id: number; created_at: Date; weather_snapshot: WeatherSnapshot;
    top_item_id: number | null; shirt_item_id: number | null;
    bottom_item_id: number; shoes_item_id: number; source: Outfit["source"];
  }>;

  return rows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    weatherSnapshot: row.weather_snapshot,
    topItemId: row.top_item_id,
    shirtItemId: row.shirt_item_id,
    bottomItemId: row.bottom_item_id,
    shoesItemId: row.shoes_item_id,
    source: row.source,
  }));
}

/** Returns all item IDs worn in recent outfits with how many days ago they were worn. */
export async function listRecentOutfitItems(days: number) {
  await ensureDatabase();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await sql`
    SELECT item_id, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0 AS days_ago
    FROM (
      SELECT top_item_id    AS item_id, created_at FROM outfits WHERE top_item_id IS NOT NULL
      UNION ALL
      SELECT shirt_item_id  AS item_id, created_at FROM outfits WHERE shirt_item_id IS NOT NULL
      UNION ALL
      SELECT bottom_item_id AS item_id, created_at FROM outfits WHERE bottom_item_id IS NOT NULL
      UNION ALL
      SELECT shoes_item_id  AS item_id, created_at FROM outfits WHERE shoes_item_id IS NOT NULL
    ) sub
    WHERE created_at >= ${cutoff}
    ORDER BY days_ago ASC`;
  return result.rows as Array<{ item_id: number; days_ago: number }>;
}

export async function insertOutfit(outfit: Outfit) {
  await ensureDatabase();
  const result = await sql`INSERT INTO outfits (
    weather_snapshot, top_item_id, shirt_item_id, bottom_item_id, shoes_item_id, source
  ) VALUES (
    ${JSON.stringify(outfit.weatherSnapshot)}::jsonb,
    ${outfit.topItemId},
    ${outfit.shirtItemId},
    ${outfit.bottomItemId},
    ${outfit.shoesItemId},
    ${outfit.source}
  ) RETURNING id`;
  const rows = result.rows as Array<{ id: number }>;
  return rows[0]?.id;
}
