// Maps TradingEconomics index paths to TradingView symbols.
//
// Left empty for now — see fxTvSymbols.ts for why: TradingView's free
// embed widget appears to be rate-limiting this session after heavy use
// today. Every index falls back to TradingEconomics' snapshot image in
// TEChart until specific symbols (e.g. TVC:SPX, TVC:DJI, TVC:IXIC) can be
// verified live with real rendered data, not just a resolved-but-blank
// widget.
export const INDICES_TV_SYMBOLS: Record<string, string> = {};
