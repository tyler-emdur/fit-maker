export const bootstrapStatements = [
  `CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    color TEXT NOT NULL,
    style TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check`,
  `ALTER TABLE items ADD CONSTRAINT items_category_check
    CHECK (category IN ('long_sleeve', 'short_sleeve', 'shorts', 'pants', 'outerwear', 'shoes'))`,
  `ALTER TABLE items DROP COLUMN IF EXISTS season`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS warmth_score INTEGER CHECK (warmth_score BETWEEN 1 AND 10)`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT`,
  `ALTER TABLE items ADD COLUMN IF NOT EXISTS pattern TEXT`,
  `CREATE TABLE IF NOT EXISTS outfits (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weather_snapshot JSONB NOT NULL,
    top_item_id INTEGER REFERENCES items(id),
    shirt_item_id INTEGER REFERENCES items(id),
    bottom_item_id INTEGER REFERENCES items(id),
    shoes_item_id INTEGER REFERENCES items(id),
    source TEXT NOT NULL CHECK (source IN ('auto', 'manual_regen'))
  )`,
];
