export const categories = ["shoes", "bottom", "shirt", "top"] as const;
export type Category = (typeof categories)[number];

export type ClothingItem = {
  id: number;
  name: string;
  category: Category;
  imageUrl: string;
  warmthScore: number;
  color: string;
  style: string;
  season: string;
  active: boolean;
  createdAt: string;
};

export type WeatherSnapshot = {
  location: string;
  tempF: number;
  condition: string;
  isCold: boolean;
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

