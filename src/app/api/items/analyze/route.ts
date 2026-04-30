import { NextResponse } from "next/server";
import { uploadItemImage } from "@/lib/storage/blob";
import { analyzeClothingImage } from "@/lib/ai/analyze-image";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    // Upload to blob and analyze in parallel — client already converted HEIC → JPEG
    const [imageUrl, analysis] = await Promise.all([
      uploadItemImage(file),
      analyzeClothingImage(imageBytes, file.type || "image/jpeg"),
    ]);

    return NextResponse.json({ imageUrl, ...analysis });
  } catch (err) {
    console.error("[analyze] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
