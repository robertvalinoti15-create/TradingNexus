"use client";

import { TradingViewWidget } from "@/components/TradingViewWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { useColorScheme } from "@/lib/useColorScheme";

export default function CalendarPage() {
  const theme = useColorScheme();

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-foreground/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
        <div className="max-w-5xl mx-auto px-6 py-4 sm:py-5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Economic Calendar</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/60">
            US economic releases and events — rate decisions, inflation, employment, growth, and
            more — live via TradingView.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-8 sm:py-10">
        <div className="rounded-2xl border border-foreground/10 bg-card p-4 shadow-sm sm:p-6">
          <TradingViewWidget
            scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-events.js"
            height={650}
            config={{
              colorTheme: theme,
              isTransparent: true,
              width: "100%",
              height: 650,
              locale: "en",
              importanceFilter: "-1,0,1",
              countryFilter: "us",
            }}
          />
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 pb-10">
        <SiteFooter note={<>Economic calendar via TradingView. For personal use — not investment advice.</>} />
      </footer>
    </main>
  );
}
