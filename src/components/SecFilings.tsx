"use client";

import { useEffect, useState } from "react";

type Tab = "insider" | "institutional";

interface InsiderFiling {
  symbol: string;
  ownerName: string | null;
  title: string | null;
  codeLabel: string;
  shares: number | null;
  price: number | null;
  acquiredDisposed: string | null;
  transactionDate: string | null;
  filingDate: string;
  filingUrl: string;
}

interface InstitutionalHit {
  symbol: string;
  filer: string;
  fileDate: string;
  filingUrl: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "insider", label: "Insider trading" },
  { id: "institutional", label: "Institutional (13F)" },
];

function fmtShares(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtPrice(n: number | null) {
  if (n === null) return "—";
  return `$${n.toFixed(2)}`;
}

export function SecFilings({ symbols }: { symbols: string[] }) {
  const [tab, setTab] = useState<Tab>("insider");
  const [insider, setInsider] = useState<InsiderFiling[] | null>(null);
  const [institutional, setInstitutional] = useState<InstitutionalHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const key = symbols.join(",");

  useEffect(() => {
    function run() {
      if (!key) return;
      if (tab === "insider" && insider === null) {
        setLoading(true);
        fetch(`/api/insider?symbols=${encodeURIComponent(key)}`)
          .then((r) => r.json())
          .then((d) => setInsider(d.filings ?? []))
          .finally(() => setLoading(false));
      }
      if (tab === "institutional" && institutional === null) {
        setLoading(true);
        fetch(`/api/institutional?symbols=${encodeURIComponent(key)}`)
          .then((r) => r.json())
          .then((d) => setInstitutional(d.hits ?? []))
          .finally(() => setLoading(false));
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key]);

  return (
    <section className="border border-foreground/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">SEC filings</h2>
      </div>
      <p className="text-xs text-foreground/50 mb-4 max-w-2xl">
        The underlying documents behind the market activity feed — raw Form 4 and 13F-HR filings
        with direct links to EDGAR.
      </p>

      <div className="flex gap-1 mb-4 border-b border-foreground/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-brand-blue text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "insider" && (
        <div>
          <p className="text-xs text-foreground/40 mb-3">
            SEC Form 4 filings — company officers, directors, and 10%+ owners buying or selling
            their own shares. Filed within days of the trade.
          </p>
          {loading && insider === null && <p className="text-sm text-foreground/50">Loading…</p>}
          {insider !== null && insider.length === 0 && !loading && (
            <p className="text-sm text-foreground/50">No recent Form 4 filings found.</p>
          )}
          <ul className="divide-y divide-foreground/10">
            {insider?.map((f, i) => (
              <li key={i} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{f.symbol}</span>{" "}
                  <span className="text-foreground/70">{f.ownerName ?? "Unknown"}</span>
                  {f.title && <span className="text-foreground/40"> · {f.title}</span>}
                  <div className="text-xs text-foreground/40">
                    {f.codeLabel} · {f.transactionDate ?? f.filingDate}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono">{fmtShares(f.shares)} sh</div>
                  <a
                    href={f.filingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-blue hover:underline"
                  >
                    {fmtPrice(f.price)} · view filing
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "institutional" && (
        <div>
          <p className="text-xs text-foreground/40 mb-3">
            Recent SEC 13F-HR filings whose holdings mention this company. 13F filings are
            quarterly and can lag up to 45 days — this is not daily activity.
          </p>
          {loading && institutional === null && <p className="text-sm text-foreground/50">Loading…</p>}
          {institutional !== null && institutional.length === 0 && !loading && (
            <p className="text-sm text-foreground/50">No recent 13F mentions found.</p>
          )}
          <ul className="divide-y divide-foreground/10">
            {institutional?.map((h, i) => (
              <li key={i} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{h.symbol}</span>{" "}
                  <span className="text-foreground/70">{h.filer}</span>
                </div>
                <a
                  href={h.filingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-blue hover:underline shrink-0"
                >
                  {h.fileDate} · view filing
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
