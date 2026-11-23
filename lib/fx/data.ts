import { prisma } from "@/lib/prisma";
import { ProAccessError } from "@/lib/pro-access";
import {
  computeFxReport,
  iso,
  type FxSettings,
  type FxTxn,
  type PriceTable,
  type RateTable,
  type SplitTable,
} from "@/lib/fx/engine";
import { ensureMarketData, type SyncResult } from "@/lib/fx/sources";

/** The individual client, checked to belong to this firm. */
export async function requireFxClient(firmId: string, fxClientId: string) {
  const client = await prisma.fxClient.findFirst({
    where: { id: fxClientId, firmId, archivedAt: null },
  });
  if (!client) {
    throw new ProAccessError("Client not found.", 404, "FX_CLIENT_NOT_FOUND");
  }
  return client;
}

export function settingsOf(client: {
  slabRate: number;
  costRateRule: "SAME_DAY" | "PREV_MONTH_END" | "AT_SALE_RATE";
  saleRateRule: "SAME_DAY" | "PREV_MONTH_END" | "AT_SALE_RATE";
  dividendRateRule: "SAME_DAY" | "PREV_MONTH_END" | "AT_SALE_RATE";
}): FxSettings {
  // "At sale rate" only means something for cost; elsewhere fall back to the month-end rule.
  const plain = (r: string) => (r === "SAME_DAY" ? "SAME_DAY" : "PREV_MONTH_END") as "SAME_DAY" | "PREV_MONTH_END";
  return {
    slabRate: client.slabRate,
    costRateRule: client.costRateRule,
    saleRateRule: plain(client.saleRateRule),
    dividendRateRule: plain(client.dividendRateRule),
  };
}

export async function loadTransactions(clientId: string): Promise<FxTxn[]> {
  const rows = await prisma.fxTransaction.findMany({
    where: { clientId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    date: r.date,
    symbol: r.symbol,
    company: r.company,
    broker: r.broker,
    account: r.account,
    quantity: r.quantity,
    priceUsd: r.priceUsd,
    amountUsd: r.amountUsd,
    feesUsd: r.feesUsd,
    currency: r.currency,
    lotRef: r.lotRef,
    costInrPerShare: r.costInrPerShare,
    basisDate: r.basisDate,
    fmvCost: r.fmvCost,
  }));
}

/** Rates and prices covering every date the report can need. */
async function loadTables(firmId: string, txns: FxTxn[]) {
  if (txns.length === 0) {
    return { rates: new Map() as RateTable, prices: new Map() as PriceTable, splits: new Map() as SplitTable };
  }
  const min = new Date(Math.min(...txns.map((t) => t.date.getTime())) - 70 * 86_400_000);
  const maxYear = Math.max(...txns.map((t) => t.date.getUTCFullYear()), new Date().getUTCFullYear());
  const max = new Date(Date.UTC(maxYear, 11, 31));
  const currencies = [...new Set(txns.map((t) => t.currency).filter((c) => c !== "INR"))];
  const symbols = [...new Set(txns.map((t) => t.symbol))];

  const [rateRows, priceRows, splitRows] = await Promise.all([
    prisma.fxRate.findMany({
      where: { firmId: { in: ["", firmId] }, currency: { in: currencies }, date: { gte: min, lte: max } },
      orderBy: { date: "asc" },
      select: { firmId: true, currency: true, date: true, ttbr: true },
    }),
    prisma.fxPrice.findMany({
      where: { firmId: { in: ["", firmId] }, symbol: { in: symbols }, date: { gte: min, lte: max } },
      orderBy: { date: "asc" },
      select: { firmId: true, symbol: true, date: true, close: true },
    }),
    prisma.fxSplit.findMany({
      where: { symbol: { in: symbols } },
      orderBy: { date: "asc" },
      select: { symbol: true, date: true, ratio: true },
    }),
  ]);

  // The firm's own rate for a day wins over EVC's shared rate.
  const byDay = new Map<string, { currency: string; date: string; ttbr: number; own: boolean }>();
  for (const r of rateRows) {
    const key = `${r.currency}|${iso(r.date)}`;
    const own = r.firmId !== "";
    const prev = byDay.get(key);
    if (!prev || (own && !prev.own)) byDay.set(key, { currency: r.currency, date: iso(r.date), ttbr: r.ttbr, own });
  }
  const rates: RateTable = new Map();
  for (const r of [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const arr = rates.get(r.currency) ?? [];
    arr.push({ date: r.date, ttbr: r.ttbr });
    rates.set(r.currency, arr);
  }
  // The firm's own price for a day wins over the fetched one.
  const priceDay = new Map<string, { symbol: string; date: string; close: number; own: boolean }>();
  for (const p of priceRows) {
    const key = `${p.symbol}|${iso(p.date)}`;
    const own = p.firmId !== "";
    const prev = priceDay.get(key);
    if (!prev || (own && !prev.own)) priceDay.set(key, { symbol: p.symbol, date: iso(p.date), close: p.close, own });
  }
  const prices: PriceTable = new Map();
  for (const p of [...priceDay.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const arr = prices.get(p.symbol) ?? [];
    arr.push({ date: p.date, close: p.close });
    prices.set(p.symbol, arr);
  }
  const splits: SplitTable = new Map();
  for (const sp of splitRows) {
    const arr = splits.get(sp.symbol) ?? [];
    arr.push({ date: iso(sp.date), ratio: sp.ratio });
    splits.set(sp.symbol, arr);
  }
  return { rates, prices, splits };
}

export async function buildClientReport(
  firmId: string,
  client: Parameters<typeof settingsOf>[0] & { id: string },
  opts: { sync?: boolean; force?: boolean } = {}
) {
  const txns = await loadTransactions(client.id);
  const dataStatus: SyncResult[] = opts.sync ? await ensureMarketData(txns, Boolean(opts.force)) : [];
  const { rates, prices, splits } = await loadTables(firmId, txns);
  return { txns, dataStatus, report: computeFxReport(txns, settingsOf(client), rates, prices, new Date(), splits) };
}

export const FX_CLIENT_LIMIT_MIN = 50;

/** How many individuals a firm can keep: 5 per company-client seat, at least 50. */
export function fxClientLimit(clientLimit: number, isFounder: boolean) {
  return isFounder ? 100000 : Math.max(FX_CLIENT_LIMIT_MIN, clientLimit * 5);
}

/** What rate and price data exists, for the coverage panel. */
export async function coverage(firmId: string) {
  const [rateGroups, priceGroups] = await Promise.all([
    prisma.fxRate.groupBy({
      by: ["firmId", "currency"],
      where: { firmId: { in: ["", firmId] } },
      _min: { date: true },
      _max: { date: true },
      _count: { _all: true },
    }),
    prisma.fxPrice.groupBy({
      by: ["firmId", "symbol"],
      where: { firmId: { in: ["", firmId] } },
      _min: { date: true },
      _max: { date: true },
      _count: { _all: true },
    }),
  ]);
  return {
    rates: rateGroups.map((g) => ({
      currency: g.currency,
      shared: g.firmId === "",
      from: g._min.date ? iso(g._min.date) : null,
      to: g._max.date ? iso(g._max.date) : null,
      days: g._count._all,
    })),
    prices: priceGroups.map((g) => ({
      symbol: g.symbol,
      shared: g.firmId === "",
      from: g._min.date ? iso(g._min.date) : null,
      to: g._max.date ? iso(g._max.date) : null,
      days: g._count._all,
    })),
  };
}
