import { NextRequest, NextResponse } from "next/server";
import { getCikForSymbol } from "@/lib/sec";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) return NextResponse.json({ title: null });

  try {
    const info = await getCikForSymbol(symbol);
    return NextResponse.json({ title: info?.title ?? null });
  } catch {
    return NextResponse.json({ title: null });
  }
}
