// Maps TradingEconomics commodity paths to TradingView symbols, so the same
// interactive chart widget used for stocks can be reused for commodities.
//
// Only includes symbols individually verified to render real candle data on
// TradingView's free/anonymous embed widget. Plenty of plausible-looking
// symbols exist in TradingView's own symbol search — continuous futures
// like CBOT:ZW1!, or CFDs from brokers like FOREXCOM/Capital.com/OANDA — but
// most render blank (resolve, no error, zero data) because they need a
// logged-in TradingView session. This isn't predictable by provider prefix:
// TVC:USOIL works but TVC:UKOIL doesn't; OANDA:WHEATUSD works but
// OANDA:SOYBNUSD doesn't. Each entry here was checked live before being
// added. Guessing wrong produces a broken widget, which is worse than the
// honest fallback, so anything not listed here falls back to
// TradingEconomics' snapshot image in TEChart instead.
export const COMMODITY_TV_SYMBOLS: Record<string, string> = {
  "/commodity/crude-oil": "TVC:USOIL",
  "/commodity/gold": "TVC:GOLD",
  "/commodity/silver": "TVC:SILVER",
  "/commodity/wheat": "OANDA:WHEATUSD",
};
