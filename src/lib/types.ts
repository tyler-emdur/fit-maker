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

export type HourForecast = {
  label: string;   // e.g. "9AM"
  tempF: number;
  rainPct: number;
};

export type WeatherSnapshot = {
  location: string;
  tempF: number;       // current / morning temperature
  highF: number;       // daily high — used for outfit band decisions
  lowF: number;        // daily low
  condition: string;
  willRain: boolean;   // rain likely at any point during the day
  isCold: boolean;
  tempBand?: TempBand;
  forecast?: HourForecast[];  // key hours for the rest of today
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
