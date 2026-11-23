/**
 * ============================================================================
 * FOREIGN EQUITY TAX ENGINE (pure: no database)
 * ============================================================================
 *
 * For an Indian-resident individual holding foreign shares from RSU vests,
 * ESPP / ESOP purchases or plain buys:
 *
 *  1. Lots      every VEST / BUY becomes a lot. Cost in INR = Form 16
 *               perquisite per share if given, else price x SBI TTBR.
 *  2. Sales     every SELL is matched to lots: the named lot first (lotRef),
 *               then oldest first (FIFO). Fees reduce the proceeds.
 *  3. Gains     held more than 24 months = long-term (foreign shares count as
 *               unlisted in India), else short-term. Grouped by Indian
 *               financial year (Apr-Mar) and the Schedule CG date buckets.
 *  4. Dividends gross dividend and foreign tax withheld, in INR, per FY,
 *               with a foreign tax credit estimate (lower of foreign tax and
 *               Indian tax on that income).
 *  5. Schedule FA (calendar year): per lot, initial / peak / closing value
 *               and sale proceeds (table A3); per broker account, peak /
 *               closing value and gross amount credited (table A2).
 *
 * Every conversion rule is a setting because sources differ. Everything is
 * an estimate to be checked by a CA, and the UI says so.
 * ============================================================================
 */

export type FxTxnType = "VEST" | "BUY" | "SELL" | "DIVIDEND" | "TAX_WITHHELD";
export type RateRule = "SAME_DAY" | "PREV_MONTH_END";
/** Cost can also be converted at the sale's rate (gain worked out in USD, then converted: Rule 206 view). */
export type CostRule = RateRule | "AT_SALE_RATE";

export type FxTxn = {
  id: string;
  type: FxTxnType;
  date: Date;
  symbol: string;
  company: string | null;
  broker: string | null;
  account: string | null;
  quantity: number;
  priceUsd: number | null;
  amountUsd: number | null;
  feesUsd: number | null;
  currency: string;
  lotRef: string | null;
  costInrPerShare: number | null;
  /** Date the quantity and price are expressed as of (gains reports state the sale-date share count). Null = the transaction date. */
  basisDate?: Date | null;
  /** ESPP purchase / option exercise: cost = market value on that day (the amount taxed as perquisite), not the price paid. */
  fmvCost?: boolean;
};

export type FxSettings = {
  costRateRule: CostRule;
  saleRateRule: RateRule;
  dividendRateRule: RateRule;
  /** Client's marginal slab rate (e.g. 0.3) for STCG and the FTC estimate. */
  slabRate: number;
};

/** Rate table: currency -> sorted [isoDate, ttbr][] */
export type RateTable = Map<string, { date: string; ttbr: number }[]>;
/** Price table: symbol -> sorted [isoDate, close][], split-adjusted to today's share count. */
export type PriceTable = Map<string, { date: string; close: number }[]>;
/** Splits: symbol -> sorted [isoDate, ratio] (ratio 20 = 20-for-1). */
export type SplitTable = Map<string, { date: string; ratio: number }[]>;

/** The free SBI TT rate archive starts in January 2020. */
export const SBI_ARCHIVE_START = "2020-01-01";

export type FxWarning = { level: "BLOCK" | "WARN" | "INFO"; message: string };

const DAY = 86_400_000;
export const CESS = 0.04;
export const LTCG_RATE = 0.125;
/** How far back we look for a published rate (holidays, weekends). */
const RATE_LOOKBACK_DAYS = 10;

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

export function addMonthsUtc(d: Date, months: number): Date {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return r;
}

/** Last day of the month before the given date's month. */
export function prevMonthEnd(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), 0);
}

/** Indian financial year label, e.g. 2026-05-10 -> "2026-27". */
export function fyOf(d: Date): string {
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** Schedule CG date-of-transfer buckets within a financial year. */
export function cgBucket(d: Date): string {
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const md = m * 100 + day; // Jan 15 -> 15, Jun 15 -> 515
  if (md >= 300 && md <= 515) return "Up to 15 Jun";
  if (md >= 516 && md <= 815) return "16 Jun - 15 Sep";
  if (md >= 816 && md <= 1115) return "16 Sep - 15 Dec";
  if (md >= 1116 || md <= 215) return "16 Dec - 15 Mar";
  return "16 Mar - 31 Mar";
}

export const CG_BUCKETS = ["Up to 15 Jun", "16 Jun - 15 Sep", "16 Sep - 15 Dec", "16 Dec - 15 Mar", "16 Mar - 31 Mar"];

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

/** Latest entry on or before `date`, within `maxBackDays`. Binary search. */
function onOrBefore<T extends { date: string }>(rows: T[] | undefined, date: Date, maxBackDays: number): T | null {
  if (!rows || rows.length === 0) return null;
  const target = iso(date);
  let lo = 0;
  let hi = rows.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].date <= target) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found < 0) return null;
  const row = rows[found];
  const gap = (date.getTime() - new Date(`${row.date}T00:00:00Z`).getTime()) / DAY;
  return gap <= maxBackDays ? row : null;
}

export type RateHit = { ttbr: number; rateDate: string };

export function rateFor(rates: RateTable, currency: string, date: Date, rule: RateRule): RateHit | null {
  if (currency === "INR") return { ttbr: 1, rateDate: iso(date) };
  const wanted = rule === "PREV_MONTH_END" ? prevMonthEnd(date) : date;
  const hit = onOrBefore(rates.get(currency), wanted, RATE_LOOKBACK_DAYS);
  return hit ? { ttbr: hit.ttbr, rateDate: hit.date } : null;
}

function priceOn(prices: PriceTable, symbol: string, date: Date): number | null {
  const hit = onOrBefore(prices.get(symbol), date, 7);
  return hit ? hit.close : null;
}

/* ------------------------------------------------------------------ */
/* Result types                                                        */
/* ------------------------------------------------------------------ */

export type Lot = {
  id: string;
  ref: string;
  type: "VEST" | "BUY";
  date: Date;
  symbol: string;
  company: string;
  broker: string;
  account: string;
  currency: string;
  quantity: number;
  priceUsd: number;
  costInrPerShare: number | null;
  costSource: "FORM16" | "TTBR" | "AT_SALE" | "MISSING_RATE" | "MISSING_VALUE";
  /** Where the per-share value came from. */
  valueSource: "STATEMENT" | "MARKET_CLOSE" | "MISSING";
  rateUsed: RateHit | null;
  /** Shares left after all sales. */
  remaining: number;
};

export type SalePiece = {
  saleId: string;
  lotId: string;
  lotRef: string;
  symbol: string;
  company: string;
  broker: string;
  account: string;
  acquiredOn: Date;
  soldOn: Date;
  quantity: number;
  salePriceUsd: number;
  saleRate: RateHit | null;
  proceedsInr: number | null;
  feesInr: number | null;
  costInr: number | null;
  gainInr: number | null;
  holdingMonths: number;
  longTerm: boolean;
  fy: string;
  bucket: string;
};

export type FyGains = {
  fy: string;
  shortTerm: { proceeds: number; cost: number; fees: number; gain: number };
  longTerm: { proceeds: number; cost: number; fees: number; gain: number };
  byBucket: Record<string, { shortTerm: number; longTerm: number }>;
  estimatedTax: { shortTerm: number; longTerm: number };
  incomplete: boolean;
};

export type DividendRow = {
  id: string;
  date: Date;
  symbol: string;
  company: string;
  broker: string;
  account: string;
  kind: "DIVIDEND" | "TAX_WITHHELD";
  amountUsd: number;
  currency: string;
  rate: RateHit | null;
  amountInr: number | null;
  fy: string;
};

export type FyDividends = {
  fy: string;
  grossInr: number;
  taxWithheldInr: number;
  indianTaxOnDividendInr: number;
  ftcEstimateInr: number;
  byCountryNote: string;
  incomplete: boolean;
};

export type FaLotRow = {
  year: number;
  lotRef: string;
  symbol: string;
  company: string;
  broker: string;
  account: string;
  acquiredOn: Date;
  sharesAcquired: number;
  sharesAtYearEnd: number;
  initialValueInr: number | null;
  peakValueInr: number | null;
  peakDate: string | null;
  closingValueInr: number | null;
  saleProceedsInr: number;
  missing: string[];
};

export type FaAccountRow = {
  year: number;
  broker: string;
  account: string;
  peakValueInr: number | null;
  peakDate: string | null;
  closingValueInr: number | null;
  grossCreditedInr: number;
  missing: string[];
};

export type FxReport = {
  lots: Lot[];
  pieces: SalePiece[];
  gainsByFy: FyGains[];
  dividends: DividendRow[];
  dividendsByFy: FyDividends[];
  faYears: number[];
  faLots: FaLotRow[];
  faAccounts: FaAccountRow[];
  holdings: { symbol: string; company: string; shares: number }[];
  warnings: FxWarning[];
  ratesUsed: { currency: string; date: string; ttbr: number }[];
};

/* ------------------------------------------------------------------ */
/* Main computation                                                    */
/* ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function wholeMonths(from: Date, to: Date): number {
  let m = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) m -= 1;
  return m;
}

export function computeFxReport(
  txns: FxTxn[],
  settings: FxSettings,
  rates: RateTable,
  prices: PriceTable,
  today: Date = new Date(),
  splits: SplitTable = new Map()
): FxReport {
  const warnings: FxWarning[] = [];
  const notedMarketValue = new Set<string>();
  const ratesUsed = new Map<string, { currency: string; date: string; ttbr: number }>();
  const useRate = (cur: string, date: Date, rule: RateRule, what: string): RateHit | null => {
    const hit = rateFor(rates, cur, date, rule);
    if (!hit) {
      const wanted = rule === "PREV_MONTH_END" ? prevMonthEnd(date) : date;
      warnings.push({
        level: "BLOCK",
        message:
          iso(wanted) < SBI_ARCHIVE_START && cur === "USD"
            ? `No SBI TT buying rate for ${iso(wanted)} (needed for ${what}). The free SBI archive starts in 2020: get this rate from SBI or the client's bank certificate and upload it (Individuals page, "Upload rates").`
            : `No SBI TT buying rate for ${cur} on or just before ${iso(wanted)} (needed for ${what}). Use "Refresh market data", or upload rates covering that date.`,
      });
      return null;
    }
    if (cur !== "INR") ratesUsed.set(`${cur}|${hit.rateDate}`, { currency: cur, date: hit.rateDate, ttbr: hit.ttbr });
    return hit;
  };

  /* ---- 0. Stock splits: express every share count in today's shares ---- */
  const todayIso = iso(today);
  const applied = new Map<string, string>();
  const adjusted = txns.map((t) => {
    if (t.type === "DIVIDEND" || t.type === "TAX_WITHHELD") return t;
    const basis = iso(t.basisDate ?? t.date);
    let f = 1;
    for (const s of splits.get(t.symbol) ?? []) {
      if (s.date > basis && s.date <= todayIso && s.ratio > 0) {
        f *= s.ratio;
        applied.set(`${t.symbol}|${s.date}`, `${t.symbol} ${s.ratio >= 1 ? `${round2(s.ratio)}-for-1` : `1-for-${round2(1 / s.ratio)}`} split on ${s.date}`);
      }
    }
    if (f === 1) return t;
    return {
      ...t,
      quantity: t.quantity * f,
      priceUsd: t.priceUsd != null ? t.priceUsd / f : null,
      costInrPerShare: t.costInrPerShare != null ? t.costInrPerShare / f : null,
    };
  });
  for (const msg of applied.values()) {
    warnings.push({
      level: "INFO",
      message: `${msg}: earlier share counts are multiplied (and per-share prices divided) so every figure is in today's shares. Totals in rupees don't change.`,
    });
  }

  const sorted = [...adjusted].sort((a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id));
  const label = (t: FxTxn) => ({
    company: t.company?.trim() || t.symbol,
    broker: t.broker?.trim() || "Broker not given",
    account: t.account?.trim() || "-",
  });

  /* ---- 1. Lots ---- */
  const lots: Lot[] = [];
  for (const t of sorted) {
    if (t.type !== "VEST" && t.type !== "BUY") continue;
    const l = label(t);
    const what = t.fmvCost ? "ESPP purchase / exercise" : t.type === "VEST" ? "vest" : "purchase";
    // Value per share: the statement's figure, else the market close that day.
    let price: number | null = t.priceUsd != null && t.priceUsd > 0 && !t.fmvCost ? t.priceUsd : null;
    let valueSource: Lot["valueSource"] = price != null ? "STATEMENT" : "MISSING";
    const hasForm16 = Boolean(t.costInrPerShare && t.costInrPerShare > 0);
    if (price == null) {
      const close = priceOn(prices, t.symbol, t.date);
      if (close != null) {
        price = close;
        valueSource = "MARKET_CLOSE";
        if (!hasForm16) {
          const key = `${t.symbol}|${t.fmvCost ? "fmv" : "vest"}`;
          if (!notedMarketValue.has(key)) {
            notedMarketValue.add(key);
            warnings.push({
              level: "WARN",
              message: t.fmvCost
                ? `${t.symbol} ESPP purchases / exercises use the market close on the purchase date as cost (the value taxed as a perquisite), not the discounted price paid. If Form 16 shows a different value, enter it as "Cost INR per share (Form 16)".`
                : `${t.symbol} vests with no value in the statement use the market close on the vest date. Employers sometimes use another price (e.g. the previous close): enter the Form 16 value per share where it differs.`,
            });
          }
        }
      } else if (t.priceUsd != null && t.priceUsd > 0) {
        price = t.priceUsd;
        valueSource = "STATEMENT";
        warnings.push({
          level: "WARN",
          message: `No market price for ${t.symbol} on ${iso(t.date)}, so the ${what} uses the price in the statement (${round2(t.priceUsd)}). For ESPP / exercises cost should be the market value that day: check it.`,
        });
      }
    }
    let rate: RateHit | null = null;
    let costPerShare: number | null = null;
    let source: Lot["costSource"] = "TTBR";
    if (hasForm16) {
      costPerShare = t.costInrPerShare as number;
      source = "FORM16";
      rate = rateFor(rates, t.currency, t.date, "SAME_DAY"); // for Schedule FA only
    } else if (price == null) {
      source = "MISSING_VALUE";
      warnings.push({
        level: "BLOCK",
        message: `${t.symbol} ${what} on ${iso(t.date)} has no value per share and no market price for that day. Add the price (value at vest / market value) or the Form 16 value per share.`,
      });
    } else if (settings.costRateRule === "AT_SALE_RATE") {
      source = "AT_SALE"; // converted per sale, at the sale's rate
      rate = rateFor(rates, t.currency, t.date, "SAME_DAY");
    } else {
      rate = useRate(t.currency, t.date, settings.costRateRule, `the cost of the ${what} of ${t.symbol} on ${iso(t.date)}`);
      if (rate) costPerShare = price * rate.ttbr;
      else source = "MISSING_RATE";
    }
    lots.push({
      id: t.id,
      ref: t.lotRef?.trim() || `${t.symbol}-${iso(t.date)}`,
      type: t.type,
      date: t.date,
      symbol: t.symbol,
      ...l,
      currency: t.currency,
      quantity: t.quantity,
      priceUsd: price ?? 0,
      costInrPerShare: costPerShare,
      costSource: source,
      valueSource,
      rateUsed: rate,
      remaining: t.quantity,
    });
  }

  /* ---- 2. Sales matched to lots ---- */
  const pieces: SalePiece[] = [];
  for (const t of sorted) {
    if (t.type !== "SELL") continue;
    const l = label(t);
    const saleRate = useRate(t.currency, t.date, settings.saleRateRule, `the sale of ${t.symbol} on ${iso(t.date)}`);
    const totalQty = t.quantity;
    let left = totalQty;
    const candidates = lots
      .filter((x) => x.symbol === t.symbol && x.date.getTime() <= t.date.getTime() && x.remaining > 1e-9)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (t.lotRef?.trim()) {
      const named = candidates.findIndex((x) => x.ref === t.lotRef!.trim());
      if (named > 0) candidates.unshift(...candidates.splice(named, 1));
      else if (named < 0) {
        warnings.push({
          level: "WARN",
          message: `Sale of ${t.symbol} on ${iso(t.date)} names lot "${t.lotRef}", which wasn't found (or is already sold). Oldest lots were used instead.`,
        });
      }
    }
    for (const lot of candidates) {
      if (left <= 1e-9) break;
      const q = Math.min(lot.remaining, left);
      lot.remaining -= q;
      left -= q;
      const share = totalQty > 0 ? q / totalQty : 0;
      const proceeds = saleRate && t.priceUsd != null ? q * t.priceUsd * saleRate.ttbr : null;
      const fees = saleRate ? (t.feesUsd ?? 0) * share * saleRate.ttbr : null;
      const cost =
        lot.costSource === "AT_SALE"
          ? saleRate
            ? q * lot.priceUsd * saleRate.ttbr
            : null
          : lot.costInrPerShare != null
            ? q * lot.costInrPerShare
            : null;
      const months = wholeMonths(lot.date, t.date);
      const longTerm = t.date.getTime() > addMonthsUtc(lot.date, 24).getTime();
      pieces.push({
        saleId: t.id,
        lotId: lot.id,
        lotRef: lot.ref,
        symbol: t.symbol,
        ...l,
        acquiredOn: lot.date,
        soldOn: t.date,
        quantity: q,
        salePriceUsd: t.priceUsd ?? 0,
        saleRate,
        proceedsInr: proceeds,
        feesInr: fees,
        costInr: cost,
        gainInr: proceeds != null && fees != null && cost != null ? proceeds - fees - cost : null,
        holdingMonths: months,
        longTerm,
        fy: fyOf(t.date),
        bucket: cgBucket(t.date),
      });
    }
    if (left > 1e-6) {
      warnings.push({
        level: "BLOCK",
        message: `Sale of ${round2(totalQty)} ${t.symbol} shares on ${iso(t.date)} is ${round2(left)} more than the shares held then. Add the missing vest or purchase (often an older year's statement).`,
      });
    }
  }

  /* ---- 3. Gains per FY ---- */
  const fyMap = new Map<string, FyGains>();
  for (const p of pieces) {
    let g = fyMap.get(p.fy);
    if (!g) {
      g = {
        fy: p.fy,
        shortTerm: { proceeds: 0, cost: 0, fees: 0, gain: 0 },
        longTerm: { proceeds: 0, cost: 0, fees: 0, gain: 0 },
        byBucket: Object.fromEntries(CG_BUCKETS.map((b) => [b, { shortTerm: 0, longTerm: 0 }])),
        estimatedTax: { shortTerm: 0, longTerm: 0 },
        incomplete: false,
      };
      fyMap.set(p.fy, g);
    }
    if (p.gainInr == null) {
      g.incomplete = true;
      continue;
    }
    const side = p.longTerm ? g.longTerm : g.shortTerm;
    side.proceeds += p.proceedsInr ?? 0;
    side.cost += p.costInr ?? 0;
    side.fees += p.feesInr ?? 0;
    side.gain += p.gainInr;
    g.byBucket[p.bucket][p.longTerm ? "longTerm" : "shortTerm"] += p.gainInr;
  }
  const gainsByFy = [...fyMap.values()]
    .map((g) => ({
      ...g,
      estimatedTax: {
        shortTerm: Math.max(0, g.shortTerm.gain) * settings.slabRate * (1 + CESS),
        longTerm: Math.max(0, g.longTerm.gain) * LTCG_RATE * (1 + CESS),
      },
    }))
    .sort((a, b) => a.fy.localeCompare(b.fy));
  for (const g of gainsByFy) {
    if (g.shortTerm.gain < 0 || g.longTerm.gain < 0) {
      warnings.push({
        level: "INFO",
        message: `FY ${g.fy} has a capital loss. Losses can be set off and carried forward under the Act's rules; the tax estimate here ignores set-off (verify).`,
      });
    }
  }

  /* ---- 4. Dividends and tax withheld ---- */
  const dividends: DividendRow[] = [];
  for (const t of sorted) {
    if (t.type !== "DIVIDEND" && t.type !== "TAX_WITHHELD") continue;
    const l = label(t);
    const amount = Math.abs(t.amountUsd ?? 0);
    const rate = useRate(t.currency, t.date, settings.dividendRateRule, `the ${t.type === "DIVIDEND" ? "dividend" : "tax withheld"} on ${iso(t.date)}`);
    dividends.push({
      id: t.id,
      date: t.date,
      symbol: t.symbol,
      ...l,
      kind: t.type,
      amountUsd: amount,
      currency: t.currency,
      rate,
      amountInr: rate ? amount * rate.ttbr : null,
      fy: fyOf(t.date),
    });
  }
  const divMap = new Map<string, FyDividends>();
  for (const d of dividends) {
    let f = divMap.get(d.fy);
    if (!f) {
      f = { fy: d.fy, grossInr: 0, taxWithheldInr: 0, indianTaxOnDividendInr: 0, ftcEstimateInr: 0, byCountryNote: "", incomplete: false };
      divMap.set(d.fy, f);
    }
    if (d.amountInr == null) {
      f.incomplete = true;
      continue;
    }
    if (d.kind === "DIVIDEND") f.grossInr += d.amountInr;
    else f.taxWithheldInr += d.amountInr;
  }
  const dividendsByFy = [...divMap.values()]
    .map((f) => {
      const indianTax = f.grossInr * settings.slabRate * (1 + CESS);
      return {
        ...f,
        indianTaxOnDividendInr: indianTax,
        ftcEstimateInr: Math.min(f.taxWithheldInr, indianTax),
        byCountryNote:
          "Credit is the lower of foreign tax paid and Indian tax on that income, claimed in Form 67 before the return is filed (verify DTAA rate, e.g. 25% India-US).",
      };
    })
    .sort((a, b) => a.fy.localeCompare(b.fy));

  /* ---- 5. Schedule FA (calendar years) ---- */
  const firstYear = lots.length ? Math.min(...lots.map((x) => x.date.getUTCFullYear())) : null;
  const lastYear = Math.min(today.getUTCFullYear() - (today.getUTCMonth() === 11 && today.getUTCDate() === 31 ? 0 : 1), 9999);
  const faYears: number[] = [];
  if (firstYear !== null) for (let y = firstYear; y <= lastYear; y += 1) faYears.push(y);

  // Sold quantity per lot by date, for "shares held on day X".
  const soldByLot = new Map<string, { date: number; q: number }[]>();
  for (const p of pieces) {
    const arr = soldByLot.get(p.lotId) ?? [];
    arr.push({ date: p.soldOn.getTime(), q: p.quantity });
    soldByLot.set(p.lotId, arr);
  }
  const heldOn = (lot: Lot, day: Date) => {
    if (lot.date.getTime() > day.getTime()) return 0;
    const sold = (soldByLot.get(lot.id) ?? []).filter((s) => s.date <= day.getTime()).reduce((a, s) => a + s.q, 0);
    return Math.max(0, lot.quantity - sold);
  };

  const faLots: FaLotRow[] = [];
  const faAccounts: FaAccountRow[] = [];

  for (const year of faYears) {
    const yStart = utcDate(year, 0, 1);
    const yEnd = utcDate(year, 11, 31);
    const lotsInYear = lots.filter((lot) => lot.date.getTime() <= yEnd.getTime() && heldOn(lot, new Date(yStart.getTime() - DAY)) + (lot.date >= yStart ? lot.quantity : 0) > 1e-9);

    // Days with a price for each symbol in the year.
    const daysBySymbol = new Map<string, string[]>();
    for (const lot of lotsInYear) {
      if (daysBySymbol.has(lot.symbol)) continue;
      const rows = (prices.get(lot.symbol) ?? []).filter((r) => r.date >= iso(yStart) && r.date <= iso(yEnd));
      daysBySymbol.set(lot.symbol, rows.map((r) => r.date));
    }

    const accountPeaks = new Map<string, Map<string, number>>(); // account -> day -> value
    const accountMissing = new Map<string, Set<string>>();

    for (const lot of lotsInYear) {
      const missing: string[] = [];
      const days = daysBySymbol.get(lot.symbol) ?? [];
      if (days.length === 0) missing.push(`daily prices for ${lot.symbol} in ${year}`);

      // Initial value: shares acquired x price x TTBR on acquisition date.
      const acqRate = rateFor(rates, lot.currency, lot.date, "SAME_DAY");
      if (!acqRate && lot.currency !== "INR") missing.push(`TTBR on ${iso(lot.date)}`);
      if (lot.valueSource === "MISSING") missing.push(`value per share on ${iso(lot.date)}`);
      const initial = acqRate && lot.valueSource !== "MISSING" ? lot.quantity * lot.priceUsd * acqRate.ttbr : null;

      let peak: number | null = null;
      let peakDate: string | null = null;
      const accKey = `${lot.broker}|${lot.account}`;
      const accDays = accountPeaks.get(accKey) ?? new Map<string, number>();
      for (const d of days) {
        const day = new Date(`${d}T00:00:00Z`);
        const q = heldOn(lot, day);
        if (q <= 1e-9) continue;
        const close = priceOn(prices, lot.symbol, day);
        const r = rateFor(rates, lot.currency, day, "SAME_DAY");
        if (close == null || !r) continue;
        const v = q * close * r.ttbr;
        if (peak === null || v > peak) {
          peak = v;
          peakDate = d;
        }
        accDays.set(d, (accDays.get(d) ?? 0) + v);
      }
      accountPeaks.set(accKey, accDays);

      const sharesAtEnd = heldOn(lot, yEnd);
      let closing: number | null = 0;
      if (sharesAtEnd > 1e-9) {
        const close = priceOn(prices, lot.symbol, yEnd);
        const r = rateFor(rates, lot.currency, yEnd, "SAME_DAY");
        if (close == null) missing.push(`${lot.symbol} price on 31 Dec ${year}`);
        if (!r && lot.currency !== "INR") missing.push(`TTBR on 31 Dec ${year}`);
        closing = close != null && r ? sharesAtEnd * close * r.ttbr : null;
      }

      // Sale proceeds credited in the year from this lot, at TTBR on the sale date.
      let proceeds = 0;
      for (const p of pieces) {
        if (p.lotId !== lot.id || p.soldOn.getUTCFullYear() !== year) continue;
        const r = rateFor(rates, lot.currency, p.soldOn, "SAME_DAY");
        if (r) proceeds += p.quantity * p.salePriceUsd * r.ttbr;
        else missing.push(`TTBR on ${iso(p.soldOn)}`);
      }

      if (missing.length) {
        const set = accountMissing.get(accKey) ?? new Set<string>();
        missing.forEach((m) => set.add(m));
        accountMissing.set(accKey, set);
      }

      faLots.push({
        year,
        lotRef: lot.ref,
        symbol: lot.symbol,
        company: lot.company,
        broker: lot.broker,
        account: lot.account,
        acquiredOn: lot.date,
        sharesAcquired: lot.quantity,
        sharesAtYearEnd: sharesAtEnd,
        initialValueInr: initial,
        peakValueInr: peak,
        peakDate,
        closingValueInr: closing,
        saleProceedsInr: proceeds,
        missing,
      });
    }

    // A2: one row per broker account.
    for (const [accKey, dayMap] of accountPeaks) {
      const [broker, account] = accKey.split("|");
      let peak: number | null = null;
      let peakDate: string | null = null;
      for (const [d, v] of dayMap) {
        if (peak === null || v > peak) {
          peak = v;
          peakDate = d;
        }
      }
      const rows = faLots.filter((r) => r.year === year && r.broker === broker && r.account === account);
      const closing = rows.some((r) => r.closingValueInr === null)
        ? null
        : rows.reduce((a, r) => a + (r.closingValueInr ?? 0), 0);
      const divs = dividends
        .filter((d) => d.kind === "DIVIDEND" && d.broker === broker && d.account === account && d.date.getUTCFullYear() === year)
        .reduce((a, d) => {
          const r = rateFor(rates, d.currency, d.date, "SAME_DAY");
          return a + (r ? d.amountUsd * r.ttbr : 0);
        }, 0);
      const proceeds = rows.reduce((a, r) => a + r.saleProceedsInr, 0);
      faAccounts.push({
        year,
        broker,
        account,
        peakValueInr: peak,
        peakDate,
        closingValueInr: closing,
        grossCreditedInr: divs + proceeds,
        missing: [...(accountMissing.get(accKey) ?? new Set<string>())],
      });
    }
  }

  const missingFa = [...new Set(faLots.flatMap((r) => r.missing))];
  if (missingFa.length) {
    warnings.push({
      level: "WARN",
      message: `Schedule FA is incomplete. Missing: ${missingFa.slice(0, 8).join("; ")}${missingFa.length > 8 ? ` and ${missingFa.length - 8} more` : ""}.`,
    });
  }
  if (lots.some((l) => l.costSource === "TTBR")) {
    warnings.push({
      level: "INFO",
      message: "Where no Form 16 perquisite value was given, cost = value at vest x SBI TTBR. If the employer used a different rate in Form 16, enter the Form 16 value per share so cost matches the salary already taxed (verify).",
    });
  }

  const holdingMap = new Map<string, { symbol: string; company: string; shares: number }>();
  for (const lot of lots) {
    const h = holdingMap.get(lot.symbol) ?? { symbol: lot.symbol, company: lot.company, shares: 0 };
    h.shares += lot.remaining;
    holdingMap.set(lot.symbol, h);
  }

  return {
    lots,
    pieces,
    gainsByFy,
    dividends,
    dividendsByFy,
    faYears,
    faLots,
    faAccounts,
    holdings: [...holdingMap.values()].filter((h) => h.shares > 1e-9),
    warnings: dedupe(warnings),
    ratesUsed: [...ratesUsed.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function dedupe(ws: FxWarning[]): FxWarning[] {
  const seen = new Set<string>();
  return ws.filter((w) => (seen.has(w.message) ? false : (seen.add(w.message), true)));
}
