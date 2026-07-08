import { NextRequest, NextResponse } from "next/server";
import { SEC_UA, getCikForSymbol } from "@/lib/sec";

export const dynamic = "force-dynamic";

const CODE_LABELS: Record<string, string> = {
  P: "Open-market buy",
  S: "Open-market sell",
  A: "Award / grant",
  D: "Disposition to issuer",
  F: "Tax withholding",
  M: "Option exercise",
  G: "Gift",
  C: "Conversion",
  X: "Option exercise (in-the-money)",
};

function extract(tag: string, xml: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>[\\s\\S]*?<value>([^<]*)</value>[\\s\\S]*?</${tag}>`));
  return match ? match[1].trim() : null;
}

function extractSimple(tag: string, xml: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1].trim() : null;
}

interface InsiderFiling {
  symbol: string;
  ownerName: string | null;
  title: string | null;
  code: string | null;
  codeLabel: string;
  shares: number | null;
  price: number | null;
  acquiredDisposed: string | null;
  transactionDate: string | null;
  filingDate: string;
  filingUrl: string;
}

async function fetchInsiderFilings(symbol: string): Promise<InsiderFiling[]> {
  const cikInfo = await getCikForSymbol(symbol);
  if (!cikInfo) return [];
  const { cik } = cikInfo;
  const cikNum = String(parseInt(cik, 10));

  const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: { "User-Agent": SEC_UA },
    cache: "no-store",
  });
  if (!subRes.ok) return [];
  const sub = await subRes.json();
  const recent = sub?.filings?.recent;
  if (!recent) return [];

  const form4Indexes: number[] = [];
  for (let i = 0; i < recent.form.length && form4Indexes.length < 3; i++) {
    if (recent.form[i] === "4") form4Indexes.push(i);
  }

  const filings = await Promise.all(
    form4Indexes.map(async (i): Promise<InsiderFiling | null> => {
      const accession: string = recent.accessionNumber[i];
      const accessionNoDashes = accession.replace(/-/g, "");
      const primaryDoc: string = recent.primaryDocument[i];
      const basename = primaryDoc.split("/").pop() ?? "form4.xml";
      const filingDate: string = recent.filingDate[i];
      const filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNoDashes}/${accession}-index.htm`;

      try {
        const xmlRes = await fetch(
          `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNoDashes}/${basename}`,
          { headers: { "User-Agent": SEC_UA }, cache: "no-store" }
        );
        if (!xmlRes.ok) return null;
        const xml = await xmlRes.text();

        const ownerName = extractSimple("rptOwnerName", xml);
        const isOfficer = extractSimple("isOfficer", xml) === "1";
        const isDirector = extractSimple("isDirector", xml) === "1";
        const isTenPercent = extractSimple("isTenPercentOwner", xml) === "1";
        const officerTitle = extractSimple("officerTitle", xml);
        const title = officerTitle || (isDirector ? "Director" : isTenPercent ? "10%+ owner" : isOfficer ? "Officer" : null);

        const code = extractSimple("transactionCode", xml);
        const shares = extract("transactionShares", xml);
        const price = extract("transactionPricePerShare", xml);
        const acquiredDisposed = extract("transactionAcquiredDisposedCode", xml);
        const transactionDate = extract("transactionDate", xml);

        return {
          symbol,
          ownerName,
          title,
          code,
          codeLabel: code ? CODE_LABELS[code] ?? `Code ${code}` : "Holding update",
          shares: shares ? parseFloat(shares) : null,
          price: price ? parseFloat(price) : null,
          acquiredDisposed,
          transactionDate,
          filingDate,
          filingUrl,
        };
      } catch {
        return null;
      }
    })
  );

  return filings.filter((f): f is InsiderFiling => f !== null);
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) return NextResponse.json({ filings: [] });

  try {
    const results = await Promise.all(symbols.map(fetchInsiderFilings));
    const filings = results.flat().sort((a, b) => (a.filingDate < b.filingDate ? 1 : -1));
    return NextResponse.json({ filings });
  } catch (err) {
    return NextResponse.json(
      { filings: [], error: err instanceof Error ? err.message : "Unknown error" },
      { status: 200 }
    );
  }
}
