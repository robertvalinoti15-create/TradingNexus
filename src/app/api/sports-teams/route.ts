import { NextRequest, NextResponse } from "next/server";
import { LEAGUE_KEYS, type LeagueKey } from "@/lib/sportsScores";
import { getTeamList } from "@/lib/sportsTeams";

export const dynamic = "force-dynamic";

function isLeagueKey(value: string | null): value is LeagueKey {
  return value !== null && (LEAGUE_KEYS as string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league");

  if (!isLeagueKey(league)) {
    return NextResponse.json({ teams: [], error: "Unknown league" }, { status: 400 });
  }

  try {
    const teams = await getTeamList(league);
    return NextResponse.json({ teams });
  } catch (err) {
    return NextResponse.json(
      { teams: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
