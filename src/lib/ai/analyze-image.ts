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

export async function analyzeClothingImage(
  image: Uint8Array,
  mimeType: string,
): Promise<ClothingAnalysis> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: geminiSchema,
      system:
        "You are a clothing classification assistant. Your job is to identify the clothing item in the photo — ignore the background entirely, whether it's carpet, floor, bed, or any surface. The item may be laid flat, hung up, or held. Always return your best classification. Only set confidence below 0.3 if there is genuinely no clothing item visible at all. Look carefully for brand logos, labels, or text printed on the item.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image, mediaType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif" },
            { type: "text", text: "What clothing item is this? Identify the brand if visible. Focus on the garment itself, not the background or surface it is resting on." },
          ],
        },
      ],
    });

    return { ...object, category: mapToCategory(object.type) };
  } catch (err) {
    console.error("[analyzeClothingImage] error:", err);
    return UNKNOWN_RESULT;
  }
}
