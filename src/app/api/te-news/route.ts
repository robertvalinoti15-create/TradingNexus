import { NextRequest, NextResponse } from "next/server";
import { getTENews } from "@/lib/tradingEconomics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ items: [] });

  try {
    const items = await getTENews(path);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { items: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
