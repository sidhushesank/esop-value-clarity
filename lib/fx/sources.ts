/**
 * Automatic market data for the Foreign Equity Tax Pack.
 *
 * - SBI TT buying rates: the public SBI FX RateKeeper archive (MIT licence,
 *   github.com/sahilgupta/sbi-fx-ratekeeper), one CSV per currency, daily
 *   since January 2020. Saved as EVC shared rates (firmId "").
 * - Daily closing prices and stock splits: Yahoo Finance chart data. Closes
 *   are split-adjusted, so the engine converts every share count to today's
 *   shares using the splits saved here.
 *
 * Each source is fetched at most every few hours (FxSync), and a failure never
 * breaks the report: the report shows what is missing and the firm can upload.
 */
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/fx/engine";

export const SBI_SOURCE = "SBI FX RateKeeper archive (github.com/sahilgupta/sbi-fx-ratekeeper)";
export const PRICE_SOURCE = "Yahoo Finance daily close (split-adjusted)";

const FRESH_MS = 6 * 60 * 60 * 1000; // re-fetch at most every 6 hours
const RETRY_MS = 30 * 60 * 1000; // after a failure, wait 30 minutes
const FORCE_MIN_MS = 5 * 60 * 1000; // "Refresh" button: at most every 5 minutes
const TIMEOUT_MS = 15_000;
const BATCH = 1000;

export type SyncResult = { key: string; label: string; ok: boolean; message: string; skipped?: boolean };

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function shouldSkip(key: string, force: boolean) {
  const last = await prisma.fxSync.findUnique({ where: { key } });
  if (!last) return null;
  const age = Date.now() - last.syncedAt.getTime();
  if (force) return age < FORCE_MIN_MS ? last : null;
  if (last.ok && age < FRESH_MS) return last;
  if (!last.ok && age < RETRY_MS) return last;
  return null;
}

async function record(key: string, ok: boolean, message: string) {
  await prisma.fxSync.upsert({
    where: { key },
    update: { syncedAt: new Date(), ok, message: message.slice(0, 500) },
    create: { key, syncedAt: new Date(), ok, message: message.slice(0, 500) },
  });
}

function dateOnly(isoDay: string) {
  return new Date(`${isoDay}T00:00:00.000Z`);
}

/* ------------------------------------------------------------------ */
/* SBI TT buying rates                                                 */
/* ------------------------------------------------------------------ */

/** Parses the RateKeeper CSV: DATE ("2024-03-15 09:00"), PDF FILE, TT BUY, ... One rate per day (the last published). */
export function parseSbiArchive(csv: string) {
  const lines = csv.split(/\r?\n/);
  const header = (lines[0] ?? "").split(",").map((h) => h.trim().toUpperCase());
  const dateCol = header.indexOf("DATE");
  const ttCol = header.indexOf("TT BUY");
  if (dateCol < 0 || ttCol < 0) throw new Error("Unexpected SBI archive format (no DATE / TT BUY column).");
  const byDay = new Map<string, number>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split(",");
    const day = (cells[dateCol] ?? "").trim().slice(0, 10);
    const tt = Number((cells[ttCol] ?? "").trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(tt) || tt <= 0) continue;
    byDay.set(day, tt);
  }
  return byDay;
}

export async function syncSbiRates(currency: string, force = false): Promise<SyncResult> {
  const cur = currency.toUpperCase();
  const key = `sbi:${cur}`;
  const label = `SBI TT buying rates (${cur})`;
  if (!/^[A-Z]{3}$/.test(cur) || cur === "INR") return { key, label, ok: true, message: "Not needed.", skipped: true };
  const recent = await shouldSkip(key, force);
  if (recent) return { key, label, ok: recent.ok, message: recent.message ?? "", skipped: true };

  try {
    const res = await fetchWithTimeout(
      `https://raw.githubusercontent.com/sahilgupta/sbi-fx-ratekeeper/main/csv_files/SBI_REFERENCE_RATES_${cur}.csv`
    );
    if (res.status === 404) throw new Error(`SBI archive has no ${cur} file.`);
    if (!res.ok) throw new Error(`SBI archive answered ${res.status}.`);
    const byDay = parseSbiArchive(await res.text());
    if (byDay.size === 0) throw new Error("SBI archive file had no usable rates.");

    const rows = [...byDay.entries()].map(([day, ttbr]) => ({
      firmId: "",
      currency: cur,
      date: dateOnly(day),
      ttbr,
      source: SBI_SOURCE,
    }));
    let added = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const r = await prisma.fxRate.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true });
      added += r.count;
    }
    const days = [...byDay.keys()].sort();
    const message = `${byDay.size} days (${days[0]} to ${days[days.length - 1]}), ${added} new.`;
    await record(key, true, message);
    return { key, label, ok: true, message };
  } catch (error) {
    const message = error instanceof Error ? (error.name === "AbortError" ? "Timed out." : error.message) : "Fetch failed.";
    await record(key, false, message);
    return { key, label, ok: false, message };
  }
}

/* ------------------------------------------------------------------ */
/* Prices and splits                                                   */
/* ------------------------------------------------------------------ */

/** Broker symbols to Yahoo's: share classes use a dash (BRK.B -> BRK-B). */
export function yahooSymbol(symbol: string) {
  return /^[A-Z]{1,5}\.[A-Z]$/.test(symbol) ? symbol.replace(".", "-") : symbol;
}

type YahooChart = {
  chart?: {
    result?: {
      meta?: { gmtoffset?: number; currency?: string };
      timestamp?: number[];
      indicators?: { quote?: { close?: (number | null)[] }[] };
      events?: { splits?: Record<string, { date: number; numerator: number; denominator: number }> };
    }[];
    error?: { code?: string; description?: string } | null;
  };
};

export function parseYahooChart(json: YahooChart) {
  const err = json.chart?.error;
  if (err) throw new Error(err.description || err.code || "Price source returned an error.");
  const r = json.chart?.result?.[0];
  if (!r || !r.timestamp?.length) throw new Error("No price history found for this symbol.");
  const offset = r.meta?.gmtoffset ?? 0;
  const closes = r.indicators?.quote?.[0]?.close ?? [];
  const prices = new Map<string, number>();
  r.timestamp.forEach((ts, i) => {
    const c = closes[i];
    if (typeof c === "number" && Number.isFinite(c) && c > 0) prices.set(iso(new Date((ts + offset) * 1000)), Math.round(c * 10000) / 10000);
  });
  const splits = Object.values(r.events?.splits ?? {})
    .filter((s) => s.numerator > 0 && s.denominator > 0)
    .map((s) => ({ date: iso(new Date((s.date + offset) * 1000)), ratio: s.numerator / s.denominator }));
  return { prices, splits, currency: r.meta?.currency ?? null };
}

export async function syncPrices(symbol: string, from: Date, force = false): Promise<SyncResult> {
  const sym = symbol.toUpperCase();
  const key = `px:${sym}`;
  const label = `${sym} prices and splits`;
  const recent = await shouldSkip(key, force);
  // Also re-fetch if the saved history doesn't reach back far enough.
  if (recent && recent.ok) {
    const first = await prisma.fxPrice.findFirst({ where: { firmId: "", symbol: sym }, orderBy: { date: "asc" }, select: { date: true } });
    if (first && first.date.getTime() <= from.getTime() + 10 * 86_400_000) {
      return { key, label, ok: true, message: recent.message ?? "", skipped: true };
    }
  } else if (recent) {
    return { key, label, ok: false, message: recent.message ?? "", skipped: true };
  }

  try {
    const p1 = Math.floor(from.getTime() / 1000) - 20 * 86400;
    const p2 = Math.floor(Date.now() / 1000) + 86400;
    const path = `/v8/finance/chart/${encodeURIComponent(yahooSymbol(sym))}?period1=${p1}&period2=${p2}&interval=1d&events=split&includeAdjustedClose=false`;
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    };
    let res = await fetchWithTimeout(`https://query2.finance.yahoo.com${path}`, { headers });
    if (!res.ok && res.status !== 404) res = await fetchWithTimeout(`https://query1.finance.yahoo.com${path}`, { headers });
    if (res.status === 404) throw new Error(`Symbol ${sym} not found at the price source. Use the exchange symbol (e.g. GOOGL, MSFT, SAP.DE).`);
    if (!res.ok) throw new Error(`Price source answered ${res.status}. Try "Refresh market data" later, or upload a price file.`);
    const { prices, splits, currency } = parseYahooChart((await res.json()) as YahooChart);

    // A new split changes every older adjusted close: replace the shared history.
    const known = await prisma.fxSplit.findMany({ where: { symbol: sym }, select: { date: true } });
    const knownDays = new Set(known.map((k) => iso(k.date)));
    const newSplit = splits.some((s) => !knownDays.has(s.date));
    if (newSplit) await prisma.fxPrice.deleteMany({ where: { firmId: "", symbol: sym } });
    for (const s of splits) {
      await prisma.fxSplit.upsert({
        where: { symbol_date: { symbol: sym, date: dateOnly(s.date) } },
        update: { ratio: s.ratio },
        create: { symbol: sym, date: dateOnly(s.date), ratio: s.ratio },
      });
    }

    const rows = [...prices.entries()].map(([day, close]) => ({ firmId: "", symbol: sym, date: dateOnly(day), close }));
    let added = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const r = await prisma.fxPrice.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true });
      added += r.count;
    }
    const days = [...prices.keys()].sort();
    const message = `${prices.size} days (${days[0]} to ${days[days.length - 1]})${currency && currency !== "USD" ? `, priced in ${currency}` : ""}${splits.length ? `, ${splits.length} split(s)` : ""}, ${added} new.`;
    await record(key, true, message);
    return { key, label, ok: true, message };
  } catch (error) {
    const message = error instanceof Error ? (error.name === "AbortError" ? "Timed out." : error.message) : "Fetch failed.";
    await record(key, false, message);
    return { key, label, ok: false, message };
  }
}

/** Fetches whatever the transactions need. Never throws. */
export async function ensureMarketData(
  txns: { date: Date; symbol: string; currency: string; type: string }[],
  force = false
): Promise<SyncResult[]> {
  if (txns.length === 0) return [];
  const from = new Date(Math.min(...txns.map((t) => t.date.getTime())));
  const currencies = [...new Set(txns.map((t) => t.currency.toUpperCase()).filter((c) => c !== "INR"))];
  const symbols = [...new Set(txns.map((t) => t.symbol.toUpperCase()))];
  const jobs = [...currencies.map((c) => syncSbiRates(c, force)), ...symbols.map((s) => syncPrices(s, from, force))];
  const settled = await Promise.allSettled(jobs);
  return settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { key: `job${i}`, label: "Market data", ok: false, message: s.reason instanceof Error ? s.reason.message : "Failed." }
  );
}
