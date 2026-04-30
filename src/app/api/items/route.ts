import { NextResponse } from "next/server";
import { z } from "zod";
import { insertItem, listItems } from "@/lib/db/client";
import { categories } from "@/lib/types";

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(categories),
  color: z.string().min(1),
  style: z.string().min(1),
  warmthScore: z.coerce.number().int().min(1).max(10).nullable().optional(),
  description: z.string().optional().nullable(),
  pattern: z.string().optional().nullable(),
  imageUrl: z.string().url(),
  active: z.coerce.boolean().default(true),
});

export async function GET() {
  const items = await listItems();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const form = await request.formData();

  const parsed = bodySchema.safeParse({
    name: form.get("name"),
    category: form.get("category"),
    color: form.get("color"),
    style: form.get("style"),
    warmthScore: form.get("warmthScore") || null,
    description: form.get("description") || null,
    pattern: form.get("pattern") || null,
    imageUrl: form.get("imageUrl"),
    active: form.get("active"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { active, imageUrl, ...rest } = parsed.data;
  const id = await insertItem({
    ...rest,
    imageUrl,
    active,
    warmthScore: rest.warmthScore ?? null,
    description: rest.description ?? null,
    pattern: rest.pattern ?? null,
  });

  return NextResponse.json({ id, imageUrl }, { status: 201 });
}
