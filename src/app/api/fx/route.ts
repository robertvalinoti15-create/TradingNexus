import { NextResponse } from "next/server";
import { getCurrencies } from "@/lib/tradingEconomics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const instruments = await getCurrencies();
    return NextResponse.json({ instruments });
  } catch (err) {
    return NextResponse.json(
      { instruments: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
