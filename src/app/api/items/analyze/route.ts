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

    // Run blob upload and Gemini analysis in parallel — pass raw bytes to Gemini
    // so it doesn't need to make a secondary fetch to the Blob CDN (avoids failures
    // on large files or URLs with special characters in the filename).
    const arrayBuffer = await file.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

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
