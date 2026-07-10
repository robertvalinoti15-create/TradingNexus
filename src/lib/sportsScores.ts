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
  logos?: { href?: string }[];
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

export interface EspnScoreboardResponse {
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
export const ESPN_UA =
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
    logo: competitor?.team?.logo ?? competitor?.team?.logos?.[0]?.href,
    winner: Boolean(competitor?.winner),
  };
}

export function parseEvents(json: EspnScoreboardResponse, competition?: string): SportsGame[] {
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

// UFC events are a single card of individual bouts rather than a
// home/away team matchup, so they get their own shape instead of being
// forced into SportsGame.
export interface UfcFighter {
  name: string;
  flag?: string;
  winner: boolean;
}

export interface UfcBout {
  id: string;
  weightClass: string;
  state: "pre" | "in" | "post";
  status: string;
  fighter1: UfcFighter;
  fighter2: UfcFighter;
}

export interface UfcCard {
  name: string;
  startTime: string;
  bouts: UfcBout[];
}

interface EspnAthlete {
  displayName?: string;
  flag?: { href?: string };
}

interface EspnMmaCompetitor {
  order?: number;
  winner?: boolean;
  athlete?: EspnAthlete;
}

interface EspnMmaCompetition {
  type?: { abbreviation?: string };
  status?: { type?: { state?: string; shortDetail?: string } };
  competitors?: EspnMmaCompetitor[];
}

interface EspnMmaEvent {
  id?: string | number;
  name?: string;
  date?: string;
  competitions?: EspnMmaCompetition[];
}

interface EspnMmaScoreboardResponse {
  events?: EspnMmaEvent[];
}

let ufcCache: { at: number; data: UfcCard[] } = { at: 0, data: [] };

function toFighter(competitor: EspnMmaCompetitor | undefined): UfcFighter {
  return {
    name: competitor?.athlete?.displayName ?? "TBD",
    flag: competitor?.athlete?.flag?.href,
    winner: Boolean(competitor?.winner),
  };
}

export async function getUfcCards(): Promise<UfcCard[]> {
  if (ufcCache.data.length > 0 && Date.now() - ufcCache.at < CACHE_TTL_MS) return ufcCache.data;

  const url = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";
  const res = await fetch(url, { headers: { "User-Agent": ESPN_UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  const json = (await res.json()) as EspnMmaScoreboardResponse;

  const cards: UfcCard[] = (json.events ?? [])
    .filter((event): event is EspnMmaEvent & { id: string | number; date: string; name: string } =>
      Boolean(event.id && event.date && event.name)
    )
    .map((event) => {
      const bouts = (event.competitions ?? [])
        .map((competition, i): UfcBout | null => {
          const competitors = competition.competitors ?? [];
          const fighter1 = competitors.find((c) => c.order === 1) ?? competitors[0];
          const fighter2 = competitors.find((c) => c.order === 2) ?? competitors[1];
          if (!fighter1 || !fighter2) return null;

          const state = competition.status?.type?.state;
          return {
            id: `${event.id}-${i}`,
            weightClass: competition.type?.abbreviation ?? "",
            state: state === "in" || state === "post" ? state : "pre",
            status: competition.status?.type?.shortDetail ?? "",
            fighter1: toFighter(fighter1),
            fighter2: toFighter(fighter2),
          };
        })
        .filter((bout): bout is UfcBout => bout !== null)
        // ESPN lists early prelims first and the main event last; flip so
        // the marquee fights show at the top of the card.
        .reverse();

      return { name: event.name, startTime: event.date, bouts };
    });

  ufcCache = { at: Date.now(), data: cards };
  return cards;
}
