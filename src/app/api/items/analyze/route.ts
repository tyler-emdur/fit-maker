import { NextResponse } from "next/server";
import { uploadItemImage } from "@/lib/storage/blob";
import { analyzeClothingImage } from "@/lib/ai/analyze-image";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  // Upload first so Claude gets a stable public URL
  const imageUrl = await uploadItemImage(file);

  try {
    const analysis = await analyzeClothingImage(imageUrl);
    return NextResponse.json({ imageUrl, ...analysis });
  } catch (error) {
    // Return the URL even if analysis fails — user can fill fields manually
    return NextResponse.json(
      { imageUrl, error: error instanceof Error ? error.message : "Analysis failed." },
      { status: 200 },
    );
  }
}
