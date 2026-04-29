import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { categories } from "@/lib/types";

const analysisSchema = z.object({
  category: z.enum(categories).describe(
    "The type of clothing: long_sleeve (long sleeve shirt/sweater), short_sleeve (t-shirt/polo), shorts, pants, outerwear (jacket/coat/hoodie), shoes",
  ),
  color: z.string().describe("The primary/dominant color, e.g. 'Navy Blue', 'White', 'Black'"),
  style: z
    .enum(["casual", "athletic", "streetwear", "preppy", "formal"])
    .describe("The overall style aesthetic of the item"),
  warmthScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "How warm this item is: 1-2 = very light (thin cotton, tank top), 3-4 = light, 5-6 = medium, 7-8 = warm (fleece/thick knit), 9-10 = very warm (heavy coat/parka). Infer from visual texture, thickness, and material cues.",
    ),
  description: z.string().describe("A brief 1-sentence description of the item, e.g. 'Navy slim-fit chinos with a slight texture'"),
});

export type ClothingAnalysis = z.infer<typeof analysisSchema>;

export async function analyzeClothingImage(imageUrl: string): Promise<ClothingAnalysis> {
  const { object } = await generateObject({
    model: anthropic("claude-opus-4-6"),
    schema: analysisSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: new URL(imageUrl),
          },
          {
            type: "text",
            text: "Analyze this clothing item photo and return structured data about it. Focus on the main garment, ignore mannequins, hangers, or backgrounds.",
          },
        ],
      },
    ],
  });

  return object;
}
