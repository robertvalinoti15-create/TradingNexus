"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import type { EconomicEvent } from "@/lib/economicCalendar";

function groupByDate(events: EconomicEvent[]): { date: string; events: EconomicEvent[] }[] {
  const groups = new Map<string, EconomicEvent[]>();
  for (const event of events) {
    const day = new Date(event.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const list = groups.get(day) ?? [];
    list.push(event);
    groups.set(day, list);
  }
  return Array.from(groups.entries()).map(([date, dateEvents]) => ({ date, events: dateEvents }));
}

function EventRow({ event }: { event: EconomicEvent }) {
  const time = new Date(event.dateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const sentimentColor =
    event.sentiment === "positive"
      ? "text-emerald-500"
      : event.sentiment === "negative"
        ? "text-red-500"
        : "text-foreground/70";

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-2 flex flex-col gap-2 rounded border-b border-foreground/10 px-2 py-3 transition-colors last:border-none hover:bg-foreground/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-14 shrink-0 font-mono text-xs text-foreground/45">{time}</span>
        <span className="w-8 shrink-0 text-xs font-semibold text-foreground/50">{event.countryCode}</span>
        <div className="min-w-0">
          <span className="text-sm font-medium">{event.event}</span>
          {event.period ? <span className="ml-1.5 text-xs text-foreground/40">{event.period}</span> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-xs font-mono">
        <div className="w-16 text-right">
          <div className="text-[10px] uppercase text-foreground/40">Actual</div>
          <div className={sentimentColor}>{event.actual ?? "—"}</div>
        </div>
        <div className="w-16 text-right">
          <div className="text-[10px] uppercase text-foreground/40">Consensus</div>
          <div className="text-foreground/60">{event.consensus ?? "—"}</div>
        </div>
        <div className="w-16 text-right">
          <div className="text-[10px] uppercase text-foreground/40">Previous</div>
          <div className="text-foreground/60">{event.previous ?? "—"}</div>
        </div>
      </div>
    </a>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/economic-calendar", { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load the calendar");
        const data = await res.json();
        if (!cancelled) {
          setEvents((data.events ?? []) as EconomicEvent[]);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load the calendar right now.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(load, 5 * 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const groups = useMemo(() => groupByDate(events), [events]);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-5xl mx-auto px-6 py-4 sm:py-5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Economic Calendar</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/60">
            High-impact releases from the US, Euro Area, UK, Japan, China, Germany, and Canada — rate
            decisions, inflation, employment, growth, and PMI data. Filtered down from TradingEconomics&apos;
            full global feed to what actually moves cross-asset desks.
          </p>
          <div className="mt-3 w-fit rounded-full border border-foreground/10 px-3 py-2 text-sm text-foreground/60">
            Auto-refreshing every 5 minutes
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-8 sm:py-10">
        {loading && events.length === 0 ? (
          <p className="text-sm text-foreground/50">Loading calendar…</p>
        ) : error ? (
          <p className="text-sm text-foreground/50">{error}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-foreground/50">No high-impact events scheduled right now.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <div key={group.date}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/50">
                  {group.date}
                </h2>
                <div className="rounded-2xl border border-foreground/10 bg-card px-4">
                  {group.events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="max-w-5xl mx-auto px-6 pb-10">
        <SiteFooter
          note={
            <>
              Economic calendar via TradingEconomics.com, filtered to major-economy high-impact
              releases. For personal use — not investment advice.
            </>
          }
        />
      </footer>
    </main>
  );
}
