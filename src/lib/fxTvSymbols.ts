// Maps TradingEconomics currency paths to TradingView symbols.
//
// Left empty for now: TradingView's free/anonymous embed widget appears to
// be rate-limiting this session after heavy use today (even previously
// confirmed-working commodity symbols like TVC:USOIL stopped rendering data
// mid-session). Rather than guess and ship potentially-broken charts, every
// FX pair falls back to TradingEconomics' snapshot image in TEChart until
// specific symbols can be re-verified live. See commodityTvSymbols.ts for
// the verification method once rate limiting clears.
export const FX_TV_SYMBOLS: Record<string, string> = {};
