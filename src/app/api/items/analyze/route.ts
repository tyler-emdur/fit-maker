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

  // analyzeClothingImage never throws — it returns UNKNOWN_RESULT on any error
  const analysis = await analyzeClothingImage(imageUrl);
  return NextResponse.json({ imageUrl, ...analysis });
}
