import { describe, expect, it } from "vitest";
import { isColorCompatible, scoreItem } from "./rules";

describe("outfit rules", () => {
  it("considers neutral colors compatible", () => {
    expect(isColorCompatible("Black", "Red")).toBe(true);
    expect(isColorCompatible("Green", "Navy")).toBe(true);
    expect(isColorCompatible("Pink", "Orange")).toBe(false);
  });

  it("prefers warmer items in cold weather", () => {
    const warmScore = scoreItem(
      {
        id: 1,
        name: "Wool Coat",
        category: "top",
        imageUrl: "x",
        warmthScore: 9,
        color: "Black",
        style: "Coat",
        season: "winter",
        active: true,
        createdAt: new Date().toISOString(),
      },
      { location: "Home", tempF: 40, condition: "Cloudy", isCold: true },
    );

    const lightScore = scoreItem(
      {
        id: 2,
        name: "Linen Shirt",
        category: "shirt",
        imageUrl: "x",
        warmthScore: 3,
        color: "White",
        style: "Linen",
        season: "summer",
        active: true,
        createdAt: new Date().toISOString(),
      },
      { location: "Home", tempF: 40, condition: "Cloudy", isCold: true },
    );

    expect(warmScore).toBeGreaterThan(lightScore);
  });
});

