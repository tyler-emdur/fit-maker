import { NextResponse } from "next/server";
import { z } from "zod";
import { updateItem } from "@/lib/db/client";
import { categories } from "@/lib/types";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
  }
  const success = await updateItem(numericId, { active: false });
  if (!success) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(categories).optional(),
  warmthScore: z.number().int().min(1).max(10).optional(),
  color: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
  season: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const success = await updateItem(numericId, parsed.data);
  if (!success) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

