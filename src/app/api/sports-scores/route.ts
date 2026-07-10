import { NextRequest, NextResponse } from "next/server";
import { getSportsScores, LEAGUE_KEYS, type LeagueKey } from "@/lib/sportsScores";

export const dynamic = "force-dynamic";

function isLeagueKey(value: string | null): value is LeagueKey {
  return value !== null && (LEAGUE_KEYS as string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");

  if (!isLeagueKey(league)) {
    return NextResponse.json({ games: [], error: "Unknown league" }, { status: 400 });
  }

  try {
    const games = await getSportsScores(league);
    return NextResponse.json({ games });
  } catch (err) {
    return NextResponse.json(
      { games: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
