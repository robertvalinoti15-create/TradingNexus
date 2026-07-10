"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRelative } from "@/lib/formatRelative";
import type { NewsItem } from "@/lib/newsTypes";
import type { SportsGame } from "@/lib/sportsScores";

const LEAGUES = [
  { key: "nfl", label: "NFL", query: "NFL football" },
  { key: "nba", label: "NBA", query: "NBA basketball" },
  { key: "nhl", label: "NHL", query: "NHL hockey" },
  { key: "soccer", label: "Soccer", query: "soccer football" },
  { key: "ncaaf", label: "NCAAF", query: "college football" },
  { key: "mlb", label: "MLB", query: "MLB baseball" },
] as const;

type LeagueKey = (typeof LEAGUES)[number]["key"];

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

export default function SportsPage() {
  const [league, setLeague] = useState<LeagueKey>("nfl");
  const [games, setGames] = useState<SportsGame[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const activeLeague = useMemo(() => LEAGUES.find((l) => l.key === league) ?? LEAGUES[0], [league]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingGames(true);
      setLoadingNews(true);

      const [scoresRes, newsRes] = await Promise.allSettled([
        fetch(`/api/sports-scores?league=${league}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/market-news?q=${encodeURIComponent(activeLeague.query)}`, { cache: "no-store" }).then((r) => r.json()),
      ]);

      if (cancelled) return;

      setGames(scoresRes.status === "fulfilled" ? ((scoresRes.value.games ?? []) as SportsGame[]) : []);
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
  }, [league, activeLeague.query]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.14),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sports</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs sm:text-sm">
              {LEAGUES.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLeague(l.key)}
                  className={`rounded-full border px-3 py-1.5 font-medium transition-colors ${
                    l.key === league
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
            <h2 className="text-lg font-semibold">{activeLeague.label} scores &amp; schedule</h2>
            {loadingGames && games.length === 0 ? (
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
            <h2 className="text-lg font-semibold">{activeLeague.label} headlines</h2>
            {loadingNews && news.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">Loading headlines…</p>
            ) : news.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/50">No headlines available right now.</p>
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
