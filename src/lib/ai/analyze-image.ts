import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { categories, type Category } from "@/lib/types";

const geminiSchema = z.object({
  suggestedName: z
    .string()
    .describe(
      "A short name for this item. Include the brand if clearly visible on the item (logo, tag, text), e.g. 'Nike Air Force 1', 'Levi\\'s 501 Jeans', 'Ralph Lauren Polo'. If brand is not visible, describe it plainly, e.g. 'White Oxford Shirt', 'Navy Slim Chinos', 'Grey Hoodie'.",
    ),
  brand: z
    .string()
    .describe("Brand name if visible on the item (logo, label, text). Return 'Unknown' if not visible."),
  type: z
    .string()
    .describe(
      "Clothing type in plain English, e.g. t-shirt, long sleeve shirt, jeans, chinos, shorts, hoodie, jacket, coat, sneakers, boots, loafers",
    ),
  color: z.string().describe("Dominant color, e.g. Navy Blue, White, Olive Green"),
  pattern: z
    .string()
    .describe("Surface pattern: solid, striped, plaid, floral, graphic, camo, checkered, tie-dye"),
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
      "Warmth 1–10: 1=very light (thin cotton tee), 5=medium (regular denim), 10=very warm (heavy winter coat). Infer from visible fabric weight.",
    ),
});

export type GeminiAnalysis = z.infer<typeof geminiSchema>;

/** Map Gemini's free-text `type` to our Category enum. */
function mapToCategory(type: string): Category {
  const t = type.toLowerCase();
  if (t.includes("short sleeve") || t.includes("t-shirt") || t.includes("tee") || t.includes("polo") || t.includes("tank") || t.includes("crop")) return "short_sleeve";
  if (t.includes("long") || (t.includes("sleeve") && !t.includes("short"))) return "long_sleeve";
  if (t.includes("short") && !t.includes("sleeve")) return "shorts";
  if (t.includes("pant") || t.includes("jean") || t.includes("trouser") || t.includes("chino") || t.includes("denim") || t.includes("legging")) return "pants";
  if (t.includes("jacket") || t.includes("coat") || t.includes("hoodie") || t.includes("sweatshirt") || t.includes("blazer") || t.includes("cardigan") || t.includes("vest") || t.includes("fleece") || t.includes("sweater")) return "outerwear";
  if (t.includes("shoe") || t.includes("sneaker") || t.includes("boot") || t.includes("sandal") || t.includes("loafer") || t.includes("heel")) return "shoes";
  if (t.includes("shirt") || t.includes("top") || t.includes("blouse")) return "short_sleeve";
  return "short_sleeve";
}

export type ClothingAnalysis = GeminiAnalysis & { category: Category };

const UNKNOWN_RESULT: ClothingAnalysis = {
  suggestedName: "",
  brand: "Unknown",
  type: "unknown",
  color: "unknown",
  pattern: "solid",
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
        "You are a clothing classification assistant. Analyze the clothing item in the image and return ONLY a JSON object — no markdown, no code blocks, no explanation. Look carefully for any brand logos, labels, or text on the item. If the image is unclear, return your best guess with a low confidence score.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: new URL(imageUrl) },
            { type: "text", text: "Classify this clothing item and identify the brand if visible." },
          ],
        },
      ],
    });

    return { ...object, category: mapToCategory(object.type) };
  } catch {
    return UNKNOWN_RESULT;
  }
}
