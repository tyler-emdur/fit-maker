export const bootstrapSchemaSql = `
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('shoes', 'bottom', 'shirt', 'top')),
  image_url TEXT NOT NULL,
  warmth_score INTEGER NOT NULL CHECK (warmth_score BETWEEN 1 AND 10),
  color TEXT NOT NULL,
  style TEXT NOT NULL,
  season TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfits (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weather_snapshot JSONB NOT NULL,
  top_item_id INTEGER REFERENCES items(id),
  shirt_item_id INTEGER REFERENCES items(id),
  bottom_item_id INTEGER REFERENCES items(id),
  shoes_item_id INTEGER REFERENCES items(id),
  source TEXT NOT NULL CHECK (source IN ('auto', 'manual_regen'))
);
`;

