import { NextRequest, NextResponse } from "next/server";
import { SEC_UA, getCikForSymbol } from "@/lib/sec";

export const dynamic = "force-dynamic";

interface InstitutionalHit {
  symbol: string;
  filer: string;
  filerCik: string;
  fileDate: string;
  filingUrl: string;
}

function fourMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  return d.toISOString().slice(0, 10);
}

async function fetchInstitutionalMentions(symbol: string): Promise<InstitutionalHit[]> {
  const cikInfo = await getCikForSymbol(symbol);
  if (!cikInfo) return [];

  const q = encodeURIComponent(`"${cikInfo.title}"`);
  const startdt = fourMonthsAgo();
  const enddt = new Date().toISOString().slice(0, 10);
  const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=13F-HR&startdt=${startdt}&enddt=${enddt}`;

  const res = await fetch(url, { headers: { "User-Agent": SEC_UA }, cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const hits: unknown[] = data?.hits?.hits ?? [];

  const seen = new Set<string>();
  const results: InstitutionalHit[] = [];

  for (const hit of hits) {
    const h = hit as {
      _id: string;
      _source: { ciks: string[]; display_names: string[]; file_date: string };
    };
    const filerCik = h._source.ciks?.[0];
    const filer = h._source.display_names?.[0] ?? "Unknown filer";
    if (!filerCik || seen.has(filerCik)) continue;
    seen.add(filerCik);

    const [accession] = h._id.split(":");
    const accessionNoDashes = accession.replace(/-/g, "");
    const cikNum = String(parseInt(filerCik.replace(/\D/g, ""), 10));
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNoDashes}/${accession}-index.htm`;

    results.push({
      symbol,
      filer,
      filerCik,
      fileDate: h._source.file_date,
      filingUrl,
    });

    if (results.length >= 8) break;
  }

  return results;
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ hits: [] });

  try {
    const results = await Promise.all(symbols.map(fetchInstitutionalMentions));
    const hits = results.flat().sort((a, b) => (a.fileDate < b.fileDate ? 1 : -1));
    return NextResponse.json({ hits });
  } catch (err) {
    return NextResponse.json(
      { hits: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
