import { NextResponse } from "next/server";
import { z } from "zod";
import { updateItem } from "@/lib/db/client";
import { categories } from "@/lib/types";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(categories).optional(),
  color: z.string().min(1).optional(),
  style: z.string().min(1).optional(),
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
