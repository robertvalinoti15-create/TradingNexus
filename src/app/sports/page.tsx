"use client";

import { useEffect, useMemo, useState } from "react";
import { AddFavoriteTeamForm } from "@/components/AddFavoriteTeamForm";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRelative } from "@/lib/formatRelative";
import type { NewsItem } from "@/lib/newsTypes";
import type { SportsGame, UfcBout, UfcCard, UfcFighter } from "@/lib/sportsScores";
import { type FavoriteTeam, useSportsFavorites } from "@/lib/useSportsFavorites";

const LEAGUES = [
  { key: "nfl", label: "NFL", query: "NFL football" },
  { key: "nba", label: "NBA", query: "NBA basketball" },
  { key: "nhl", label: "NHL", query: "NHL hockey" },
  { key: "soccer", label: "Soccer", query: "soccer football" },
  { key: "ncaaf", label: "NCAAF", query: "college football" },
  { key: "mlb", label: "MLB", query: "MLB baseball" },
  { key: "ufc", label: "UFC", query: "UFC MMA" },
] as const;

type LeagueKey = (typeof LEAGUES)[number]["key"];
type SportsTab = LeagueKey | "favorites";

function ScoreCard({ game }: { game: SportsGame }) {
  const isLive = game.state === "in";
  const isFinal = game.state === "post";

  return (
    <li className="rounded-lg border border-foreground/10 bg-background/40 p-3">
      {game.competition ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/40">{game.competition}</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {[game.away, game.home].map((team, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {team.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
              ) : null}
              <span
                className={`truncate text-sm ${
                  isFinal && team.winner ? "font-semibold" : "font-medium text-foreground/80"
                }`}
              >
                {team.name}
              </span>
            </div>
            {team.score !== null ? (
              <span className={`shrink-0 font-mono text-sm ${isFinal && team.winner ? "font-semibold" : "text-foreground/60"}`}>
                {team.score}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p className={`mt-2 text-xs ${isLive ? "font-medium text-brand-red" : "text-foreground/45"}`}>{game.status}</p>
    </li>
  );
}

function FighterName({ fighter, isFinal, align }: { fighter: UfcFighter; isFinal: boolean; align?: "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      {fighter.flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fighter.flag} alt="" className="h-3.5 w-5 shrink-0 rounded-sm object-cover" />
      ) : null}
      <span className={`truncate text-sm ${isFinal && fighter.winner ? "font-semibold" : "font-medium text-foreground/80"}`}>
        {fighter.name}
      </span>
    </div>
  );
}

function BoutRow({ bout }: { bout: UfcBout }) {
  const isLive = bout.state === "in";
  const isFinal = bout.state === "post";

  return (
    <li className="rounded-lg border border-foreground/10 bg-background/40 p-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/40">{bout.weightClass}</p>
      <div className="flex items-center justify-between gap-2">
        <FighterName fighter={bout.fighter1} isFinal={isFinal} />
        <span className="shrink-0 px-2 text-xs text-foreground/40">vs</span>
        <FighterName fighter={bout.fighter2} isFinal={isFinal} align="right" />
      </div>
      <p className={`mt-2 text-xs ${isLive ? "font-medium text-brand-red" : "text-foreground/45"}`}>{bout.status}</p>
    </li>
  );
}

function UfcCardBlock({ card }: { card: UfcCard }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{card.name}</h3>
      <p className="mb-2 text-xs text-foreground/45">
        {new Date(card.startTime).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <ul className="flex flex-col gap-2">
        {card.bouts.map((bout) => (
          <BoutRow key={bout.id} bout={bout} />
        ))}
      </ul>
    </div>
  );
}

// Prefer the soonest upcoming/live game; fall back to the most recent
// final so a favorite still shows something between events.
function pickRelevantGame(games: SportsGame[]): SportsGame | undefined {
  const upcoming = games
    .filter((g) => g.state !== "post")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  if (upcoming.length > 0) return upcoming[0];

  const past = games
    .filter((g) => g.state === "post")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  return past[0];
}

function FavoriteTeamCard({
  team,
  game,
  onRemove,
}: {
  team: FavoriteTeam;
  game?: SportsGame;
  onRemove: (league: FavoriteTeam["league"], teamId: string) => void;
}) {
  const isFinal = game?.state === "post";
  const isLive = game?.state === "in";

  return (
    <li className="rounded-lg border border-foreground/10 bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {team.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
          ) : null}
          <span className="truncate text-sm font-semibold">{team.name}</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(team.league, team.teamId)}
          className="shrink-0 text-xs text-foreground/40 hover:text-brand-red"
        >
          Remove
        </button>
      </div>

      {game ? (
        <>
          <div className="flex flex-col gap-1">
            {[game.away, game.home].map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className={isFinal && t.winner ? "font-semibold" : "text-foreground/80"}>{t.name}</span>
                {t.score !== null ? <span className="font-mono text-foreground/60">{t.score}</span> : null}
              </div>
            ))}
          </div>
          <p className={`mt-1.5 text-xs ${isLive ? "font-medium text-brand-red" : "text-foreground/45"}`}>{game.status}</p>
        </>
      ) : (
        <p className="text-xs text-foreground/45">No upcoming games found.</p>
      )}
    </li>
  );
}

export default function SportsPage() {
  const [tab, setTab] = useState<SportsTab>("nfl");
  const [autoSelected, setAutoSelected] = useState(false);
  const [games, setGames] = useState<SportsGame[]>([]);
  const [ufcCards, setUfcCards] = useState<UfcCard[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<{ team: FavoriteTeam; game?: SportsGame }[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const { items: favorites, hydrated: favoritesHydrated, addFavorite, removeFavorite } = useSportsFavorites();

  const isFavoritesMode = tab === "favorites";
  const isUfc = tab === "ufc";
  const activeLeague = useMemo(() => LEAGUES.find((l) => l.key === tab) ?? LEAGUES[0], [tab]);

  // Land returning users on their followed teams instead of always NFL —
  // but only once, so it doesn't fight a manual tab click afterward.
  useEffect(() => {
    function landOnFavorites() {
      setTab("favorites");
      setAutoSelected(true);
    }
    if (!autoSelected && favoritesHydrated && favorites.length > 0) {
      landOnFavorites();
    }
  }, [autoSelected, favoritesHydrated, favorites.length]);

  useEffect(() => {
    if (isFavoritesMode) return;
    let cancelled = false;

    async function load() {
      setLoadingGames(true);
      setLoadingNews(true);

      const scoresUrl = tab === "ufc" ? "/api/ufc-card" : `/api/sports-scores?league=${tab}`;

      const [scoresRes, newsRes] = await Promise.allSettled([
        fetch(scoresUrl, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/market-news?q=${encodeURIComponent(activeLeague.query)}`, { cache: "no-store" }).then((r) => r.json()),
      ]);

      if (cancelled) return;

      if (tab === "ufc") {
        setUfcCards(scoresRes.status === "fulfilled" ? ((scoresRes.value.cards ?? []) as UfcCard[]) : []);
        setGames([]);
      } else {
        setGames(scoresRes.status === "fulfilled" ? ((scoresRes.value.games ?? []) as SportsGame[]) : []);
        setUfcCards([]);
      }
      setLoadingGames(false);
      setNews(newsRes.status === "fulfilled" ? ((newsRes.value.items ?? []) as NewsItem[]) : []);
      setLoadingNews(false);
    }

    load();
    const interval = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [tab, isFavoritesMode, activeLeague.query]);

  useEffect(() => {
    if (!isFavoritesMode) return;
    let cancelled = false;

    async function load() {
      setLoadingGames(true);
      setLoadingNews(true);

      const scheduleResults = await Promise.allSettled(
        favorites.map(async (team) => {
          const res = await fetch(`/api/sports-team-schedule?league=${team.league}&teamId=${team.teamId}`, {
            cache: "no-store",
          });
          const data = await res.json();
          return { team, game: pickRelevantGame((data.games ?? []) as SportsGame[]) };
        })
      );

      const newsResults = await Promise.allSettled(
        Array.from(new Set(favorites.map((f) => f.name))).map(async (name) => {
          const res = await fetch(`/api/market-news?q=${encodeURIComponent(name)}`, { cache: "no-store" });
          const data = await res.json();
          return (data.items ?? []) as NewsItem[];
        })
      );

      if (cancelled) return;

      setFavoriteGames(scheduleResults.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])));
      setLoadingGames(false);

      const merged = newsResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      const deduped = Array.from(new Map(merged.map((item) => [item.url, item])).values());
      deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setNews(deduped);
      setLoadingNews(false);
    }

    load();
    const interval = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isFavoritesMode, favorites]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sports</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setTab("favorites")}
                className={`rounded-full border px-3 py-1.5 font-medium transition-colors ${
                  isFavoritesMode
                    ? "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
                    : "border-foreground/15 bg-card text-foreground/70 hover:border-brand-blue/40 hover:text-brand-blue"
                }`}
              >
                My Teams
              </button>
              {LEAGUES.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setTab(l.key)}
                  className={`rounded-full border px-3 py-1.5 font-medium transition-colors ${
                    l.key === tab
                      ? "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
                      : "border-foreground/15 bg-card text-foreground/70 hover:border-brand-blue/40 hover:text-brand-blue"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="rounded-full border border-foreground/10 px-3 py-2 text-sm text-foreground/60 w-fit">
              Scores via ESPN, headlines via Google News — auto-refreshing every minute
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              {isFavoritesMode ? "My teams" : isUfc ? "UFC upcoming card" : `${activeLeague.label} scores & schedule`}
            </h2>

            {isFavoritesMode ? (
              <div className="mt-4 flex flex-col gap-4">
                <AddFavoriteTeamForm favorites={favorites} onAdd={addFavorite} />
                {!favoritesHydrated ? (
                  <p className="text-sm text-foreground/50">Loading your teams…</p>
                ) : favorites.length === 0 ? (
                  <p className="text-sm text-foreground/50">Add a team above to follow their games and news here.</p>
                ) : loadingGames && favoriteGames.length === 0 ? (
                  <p className="text-sm text-foreground/50">Loading your teams&apos; games…</p>
                ) : (
                  <ul className="grid max-h-[32rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                    {favoriteGames.map(({ team, game }) => (
                      <FavoriteTeamCard
                        key={`${team.league}-${team.teamId}`}
                        team={team}
                        game={game}
                        onRemove={removeFavorite}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ) : isUfc ? (
              loadingGames && ufcCards.length === 0 ? (
                <p className="mt-4 text-sm text-foreground/50">Loading fight card…</p>
              ) : ufcCards.length === 0 ? (
                <p className="mt-4 text-sm text-foreground/50">No upcoming UFC events found.</p>
              ) : (
                <div className="mt-4 flex max-h-[36rem] flex-col gap-6 overflow-y-auto pr-1">
                  {ufcCards.map((card) => (
                    <UfcCardBlock key={`${card.name}-${card.startTime}`} card={card} />
                  ))}
                </div>
              )
            ) : loadingGames && games.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">Loading games…</p>
            ) : games.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">No {activeLeague.label} games scheduled right now.</p>
            ) : (
              <ul className="mt-4 grid max-h-[36rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {games.map((game) => (
                  <ScoreCard key={game.id} game={game} />
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{isFavoritesMode ? "My teams headlines" : `${activeLeague.label} headlines`}</h2>
            {loadingNews && news.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">Loading headlines…</p>
            ) : news.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">
                {isFavoritesMode && favorites.length === 0
                  ? "Add a team to see their headlines here."
                  : "No headlines available right now."}
              </p>
            ) : (
              <div style={{ maxHeight: "36rem", overflowY: "auto" }} className="mt-4 pr-2">
                <ul className="flex flex-col gap-3">
                  {news.slice(0, 12).map((item, index) => (
                    <li key={`${item.url}-${index}`} className="border-b border-foreground/10 pb-3 last:border-none last:pb-0">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                        {item.headline}
                      </a>
                      <div className="mt-1 flex items-center gap-2 text-xs text-foreground/45">
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{formatRelative(item.publishedAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 pb-10 pt-4">
        <SiteFooter
          note={
            <>
              Scores via ESPN&apos;s public scoreboard feed, headlines aggregated from Google News.
              For personal use — not betting or investment advice.
            </>
          }
        />
      </footer>
    </main>
  );
}
