import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { categories, type Category } from "@/lib/types";

/**
 * Raw classification returned by Gemini — matches the schema the user specified.
 * `type` uses natural language (e.g. "t-shirt", "jeans") and is mapped to
 * our Category enum below.
 */
const geminiSchema = z.object({
  type: z
    .string()
    .describe(
      "The clothing type in plain English, e.g. t-shirt, long sleeve shirt, jeans, shorts, jacket, coat, sneakers, boots",
    ),
  color: z.string().describe("Dominant color, e.g. Navy Blue, White, Olive Green"),
  pattern: z
    .string()
    .describe("Surface pattern: solid, striped, plaid, floral, graphic, camo, checkered, tie-dye"),
  style: z
    .enum(["casual", "athletic", "streetwear", "preppy", "formal"])
    .describe("Overall style aesthetic"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Classification confidence from 0.0 (unsure) to 1.0 (certain)"),
  warmthScore: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      "Warmth on a scale of 1–10: 1=very light (thin cotton tee), 5=medium (regular denim), 10=very warm (heavy winter coat). Infer from visible fabric weight and construction.",
    ),
});

export type GeminiAnalysis = z.infer<typeof geminiSchema>;

/** Map Gemini's free-text `type` to our Category enum. */
function mapToCategory(type: string): Category {
  const t = type.toLowerCase();
  if (t.includes("long") || t.includes("sleeve") && !t.includes("short")) return "long_sleeve";
  if (t.includes("short sleeve") || t.includes("t-shirt") || t.includes("tee") || t.includes("polo") || t.includes("tank") || t.includes("crop")) return "short_sleeve";
  if (t.includes("short") && !t.includes("sleeve")) return "shorts";
  if (t.includes("pant") || t.includes("jean") || t.includes("trouser") || t.includes("chino") || t.includes("denim") || t.includes("legging")) return "pants";
  if (t.includes("jacket") || t.includes("coat") || t.includes("hoodie") || t.includes("sweatshirt") || t.includes("blazer") || t.includes("cardigan") || t.includes("vest") || t.includes("fleece")) return "outerwear";
  if (t.includes("shoe") || t.includes("sneaker") || t.includes("boot") || t.includes("sandal") || t.includes("loafer") || t.includes("heel") || t.includes("slipper")) return "shoes";
  // Fallback: plain "shirt" or "top" without length cue → short sleeve
  if (t.includes("shirt") || t.includes("top") || t.includes("blouse")) return "short_sleeve";
  return "short_sleeve"; // safe default
}

export type ClothingAnalysis = GeminiAnalysis & { category: Category };

const UNKNOWN_RESULT: ClothingAnalysis = {
  type: "unknown",
  color: "unknown",
  pattern: "solid",
  style: "casual",
  confidence: 0,
  warmthScore: 5,
  category: "short_sleeve",
};

export async function analyzeClothingImage(imageUrl: string): Promise<ClothingAnalysis> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: geminiSchema,
      system:
        "You are a clothing classification assistant. Analyze the clothing item in the image and return ONLY a JSON object — no markdown, no code blocks, no explanation. If the image is unclear, blurry, or not a clothing item, still return valid JSON with your best guess and a low confidence score.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: new URL(imageUrl) },
            {
              type: "text",
              text: "Classify this clothing item.",
            },
          ],
        },
      ],
    });

    return { ...object, category: mapToCategory(object.type) };
  } catch {
    // Return safe defaults rather than crashing if the image can't be analyzed
    return UNKNOWN_RESULT;
  }
}
