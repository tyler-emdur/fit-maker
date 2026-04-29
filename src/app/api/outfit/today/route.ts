import { NextResponse } from "next/server";
import { getOrCreateTodayOutfit, regenerateTodayOutfit } from "@/lib/outfit/service";

export async function GET() {
  try {
    const outfit = await getOrCreateTodayOutfit();
    return NextResponse.json({ outfit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate outfit." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const outfit = await regenerateTodayOutfit();
    return NextResponse.json({ outfit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate outfit." },
      { status: 500 },
    );
  }
}

