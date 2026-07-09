export function SiteFooter({ note }: { note: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-tight text-foreground/70">TradingNexus</span>
      </div>
      <p className="text-xs text-foreground/30">{note}</p>
    </>
  );
}
