// Maps TradingEconomics crypto paths to TradingView symbols.
//
// Left empty for now — see fxTvSymbols.ts for why: TradingView's free
// embed widget appears to be rate-limiting this session after heavy use
// today. Every crypto instrument falls back to TradingEconomics' snapshot
// image in TEChart until specific symbols (e.g. BINANCE:BTCUSDT,
// COINBASE:BTCUSD) can be verified live with real rendered data, not just
// a resolved-but-blank widget.
export const CRYPTO_TV_SYMBOLS: Record<string, string> = {};
