export const categories = ["long_sleeve", "short_sleeve", "shorts", "pants", "outerwear", "shoes"] as const;
export type Category = (typeof categories)[number];

export type ClothingItem = {
  id: number;
  name: string;
  category: Category;
  imageUrl: string;
  color: string;
  brand: string | null;
  warmthScore: number | null;
  description: string | null;
  pattern: string | null;
  active: boolean;
  createdAt: string;
};

export type TempBand = "freezing" | "cold" | "mild" | "warm";

export type WeatherSnapshot = {
  location: string;
  tempF: number;       // current / morning temperature
  highF: number;       // daily high — used for outfit band decisions
  lowF: number;        // daily low — shown in UI
  condition: string;
  willRain: boolean;   // precipitation probability ≥ 40 %
  isCold: boolean;
  tempBand?: TempBand;
};

export type Outfit = {
  id?: number;
  createdAt?: string;
  topItemId: number | null;
  shirtItemId: number | null;
  bottomItemId: number;
  shoesItemId: number;
  source: "auto" | "manual_regen";
  weatherSnapshot: WeatherSnapshot;
};
