import { ESPN_UA, LEAGUES, parseEvents, type EspnScoreboardResponse, type LeagueKey, type SportsGame } from "./sportsScores";

// Team directories and schedules rarely change mid-day, so these get a
// much longer cache than live scores.
const TEAM_LIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SCHEDULE_CACHE_TTL_MS = 5 * 60_000;

export interface TeamOption {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

interface EspnTeamListTeam {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  logos?: { href?: string }[];
}

interface EspnTeamListResponse {
  sports?: { leagues?: { teams?: { team?: EspnTeamListTeam }[] }[] }[];
}

// Soccer spans multiple ESPN competitions (Premier League, MLS, Champions
// League); the team directory/schedule endpoints need exactly one, so this
// scopes the team picker to the league's first configured source.
function leaguePath(league: LeagueKey): string {
  return LEAGUES[league].sources[0].path;
}

const teamListCache = new Map<LeagueKey, { at: number; data: TeamOption[] }>();

export async function getTeamList(league: LeagueKey): Promise<TeamOption[]> {
  const cached = teamListCache.get(league);
  if (cached && Date.now() - cached.at < TEAM_LIST_CACHE_TTL_MS) return cached.data;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath(league)}/teams?limit=200`;
  const res = await fetch(url, { headers: { "User-Agent": ESPN_UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  const json = (await res.json()) as EspnTeamListResponse;

  const teams: TeamOption[] = (json.sports?.[0]?.leagues?.[0]?.teams ?? [])
    .map((entry) => entry.team)
    .filter((team): team is EspnTeamListTeam & { id: string; displayName: string } =>
      Boolean(team?.id && team.displayName)
    )
    .map((team) => ({
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation ?? "",
      logo: team.logos?.[0]?.href,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  teamListCache.set(league, { at: Date.now(), data: teams });
  return teams;
}

const scheduleCache = new Map<string, { at: number; data: SportsGame[] }>();

export async function getTeamSchedule(league: LeagueKey, teamId: string): Promise<SportsGame[]> {
  const key = `${league}:${teamId}`;
  const cached = scheduleCache.get(key);
  if (cached && Date.now() - cached.at < SCHEDULE_CACHE_TTL_MS) return cached.data;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath(league)}/teams/${teamId}/schedule`;
  const res = await fetch(url, { headers: { "User-Agent": ESPN_UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  const json = (await res.json()) as EspnScoreboardResponse;

  const games = parseEvents(json);
  scheduleCache.set(key, { at: Date.now(), data: games });
  return games;
}
