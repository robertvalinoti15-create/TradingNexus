"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { formatRelative } from "@/lib/formatRelative";
import type { NewsItem } from "@/lib/newsTypes";
import type { SportsGame, UfcBout, UfcCard, UfcFighter } from "@/lib/sportsScores";

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

export default function SportsPage() {
  const [league, setLeague] = useState<LeagueKey>("nfl");
  const [games, setGames] = useState<SportsGame[]>([]);
  const [ufcCards, setUfcCards] = useState<UfcCard[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  const activeLeague = useMemo(() => LEAGUES.find((l) => l.key === league) ?? LEAGUES[0], [league]);
  const isUfc = activeLeague.key === "ufc";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingGames(true);
      setLoadingNews(true);

      const scoresUrl = league === "ufc" ? "/api/ufc-card" : `/api/sports-scores?league=${league}`;

      const [scoresRes, newsRes] = await Promise.allSettled([
        fetch(scoresUrl, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/market-news?q=${encodeURIComponent(activeLeague.query)}`, { cache: "no-store" }).then((r) => r.json()),
      ]);

      if (cancelled) return;

      if (league === "ufc") {
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
            <h2 className="text-lg font-semibold">
              {isUfc ? "UFC upcoming card" : `${activeLeague.label} scores & schedule`}
            </h2>
            {isUfc ? (
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
