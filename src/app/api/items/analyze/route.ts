import { NextResponse } from "next/server";
import sharp from "sharp";
import { uploadItemImage } from "@/lib/storage/blob";
import { analyzeClothingImage } from "@/lib/ai/analyze-image";

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Convert HEIC/HEIF → JPEG so Gemini can read it and browsers can display it
    let imageBuffer: Buffer;
    let mimeType: string;
    let uploadFile: File;

    if (isHeic(file)) {
      imageBuffer = await sharp(rawBuffer).jpeg({ quality: 88 }).toBuffer();
      mimeType = "image/jpeg";
      const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      uploadFile = new File([new Uint8Array(imageBuffer)], jpegName, { type: "image/jpeg" });
    } else {
      imageBuffer = rawBuffer;
      mimeType = file.type || "image/jpeg";
      uploadFile = file;
    }

    // Upload JPEG to blob and send bytes to Gemini in parallel
    const [imageUrl, analysis] = await Promise.all([
      uploadItemImage(uploadFile),
      analyzeClothingImage(new Uint8Array(imageBuffer), mimeType),
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
