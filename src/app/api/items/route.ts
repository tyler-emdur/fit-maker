import { NextResponse } from "next/server";
import { z } from "zod";
import { insertItem, listItems } from "@/lib/db/client";
import { uploadItemImage } from "@/lib/storage/blob";
import { categories } from "@/lib/types";

const categoryEnum = z.enum(categories);

const bodySchema = z.object({
  name: z.string().min(1),
  category: categoryEnum,
  warmthScore: z.coerce.number().int().min(1).max(10),
  color: z.string().min(1),
  style: z.string().min(1),
  season: z.string().min(1),
  active: z.coerce.boolean().default(true),
});

export async function GET() {
  const items = await listItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Item image is required." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse({
    name: form.get("name"),
    category: form.get("category"),
    warmthScore: form.get("warmthScore"),
    color: form.get("color"),
    style: form.get("style"),
    season: form.get("season"),
    active: form.get("active"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const imageUrl = await uploadItemImage(file);
  const id = await insertItem({
    ...parsed.data,
    imageUrl,
  });

  return NextResponse.json({ id, imageUrl }, { status: 201 });
}

