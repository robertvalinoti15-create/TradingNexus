// ESPN's public scoreboard endpoints (site.api.espn.com) are unauthenticated
// and undocumented, but stable and widely relied on for exactly this kind of
// read-only, no-key score/schedule data — same tradeoff as Google News RSS
// elsewhere in this codebase.
export type LeagueKey = "nfl" | "nba" | "nhl" | "mlb" | "ncaaf" | "soccer";

export interface SportsTeam {
  name: string;
  abbreviation: string;
  score: string | null;
  logo?: string;
  winner: boolean;
}

export interface SportsGame {
  id: string;
  competition?: string;
  startTime: string;
  state: "pre" | "in" | "post";
  status: string;
  home: SportsTeam;
  away: SportsTeam;
}

interface EspnTeam {
  displayName?: string;
  abbreviation?: string;
  logo?: string;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: EspnTeam;
}

interface EspnCompetition {
  status?: { type?: { state?: string; shortDetail?: string } };
  competitors?: EspnCompetitor[];
}

interface EspnEvent {
  id?: string | number;
  date?: string;
  competitions?: EspnCompetition[];
}

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

interface EspnSource {
  path: string;
  params?: string;
  competition?: string;
}

interface LeagueConfig {
  label: string;
  newsQuery: string;
  sources: EspnSource[];
}

export const LEAGUES: Record<LeagueKey, LeagueConfig> = {
  nfl: { label: "NFL", newsQuery: "NFL football", sources: [{ path: "football/nfl" }] },
  nba: { label: "NBA", newsQuery: "NBA basketball", sources: [{ path: "basketball/nba" }] },
  nhl: { label: "NHL", newsQuery: "NHL hockey", sources: [{ path: "hockey/nhl" }] },
  mlb: { label: "MLB", newsQuery: "MLB baseball", sources: [{ path: "baseball/mlb" }] },
  ncaaf: {
    label: "NCAAF",
    newsQuery: "college football",
    sources: [{ path: "football/college-football", params: "groups=80&limit=75" }],
  },
  soccer: {
    label: "Soccer",
    newsQuery: "soccer football",
    sources: [
      { path: "soccer/eng.1", competition: "Premier League" },
      { path: "soccer/usa.1", competition: "MLS" },
      { path: "soccer/uefa.champions", competition: "Champions League" },
    ],
  },
};

export const LEAGUE_KEYS = Object.keys(LEAGUES) as LeagueKey[];

const cache = new Map<LeagueKey, { at: number; data: SportsGame[] }>();
const CACHE_TTL_MS = 60_000;
const ESPN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchEspnScoreboard(source: EspnSource): Promise<EspnScoreboardResponse> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${source.path}/scoreboard${
    source.params ? `?${source.params}` : ""
  }`;
  const res = await fetch(url, { headers: { "User-Agent": ESPN_UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  return (await res.json()) as EspnScoreboardResponse;
}

function toTeam(competitor: EspnCompetitor | undefined): SportsTeam {
  return {
    name: competitor?.team?.displayName ?? "TBD",
    abbreviation: competitor?.team?.abbreviation ?? "",
    score: competitor?.score ?? null,
    logo: competitor?.team?.logo,
    winner: Boolean(competitor?.winner),
  };
}

function parseEvents(json: EspnScoreboardResponse, competition?: string): SportsGame[] {
  const events = json.events ?? [];
  const games: SportsGame[] = [];

  for (const event of events) {
    const competition0 = event.competitions?.[0];
    if (!event.id || !event.date || !competition0) continue;

    const competitors = competition0.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home");
    const away = competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const state = competition0.status?.type?.state;
    games.push({
      id: String(event.id),
      competition,
      startTime: event.date,
      state: state === "in" || state === "post" ? state : "pre",
      status: competition0.status?.type?.shortDetail ?? "",
      home: toTeam(home),
      away: toTeam(away),
    });
  }

  return games;
}

export async function getSportsScores(league: LeagueKey): Promise<SportsGame[]> {
  const cached = cache.get(league);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const config = LEAGUES[league];
  const results = await Promise.allSettled(
    config.sources.map(async (source) => parseEvents(await fetchEspnScoreboard(source), source.competition))
  );

  const games = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  games.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  cache.set(league, { at: Date.now(), data: games });
  return games;
}
