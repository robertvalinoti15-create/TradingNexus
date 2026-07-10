import { NextResponse } from "next/server";
import { getEconomicCalendar } from "@/lib/economicCalendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getEconomicCalendar();
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { events: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
