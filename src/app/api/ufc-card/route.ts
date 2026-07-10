import { NextResponse } from "next/server";
import { getUfcCards } from "@/lib/sportsScores";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = await getUfcCards();
    return NextResponse.json({ cards });
  } catch (err) {
    return NextResponse.json(
      { cards: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
