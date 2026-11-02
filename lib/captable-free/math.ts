/**
 * Free cap table builder: pure maths, no React, no server.
 * Used by /cap-table and the home page preview.
 *
 * Model: a single fully diluted snapshot (shares per holder, ESOP pool
 * included), plus an optional priced round with an option-pool top-up
 * added before the money (the usual "pool shuffle").
 */

export type HolderGroup = "FOUNDER" | "INVESTOR" | "EMPLOYEE" | "ADVISOR" | "POOL";

export type Holder = {
  id: string;
  name: string;
  group: HolderGroup;
  shares: number;
};

export type RoundInput = {
  enabled: boolean;
  name: string;
  /** Pre-money valuation, in rupees. */
  preMoney: number;
  /** New money invested, in rupees. */
  investment: number;
  /** Target size of the whole ESOP pool after the round, as a % (0 = no top-up). */
  poolTargetPct: number;
};

export const GROUPS: { key: HolderGroup; label: string; color: string }[] = [
  { key: "FOUNDER", label: "Founders", color: "#042653" },
  { key: "INVESTOR", label: "Investors", color: "#5B9BFF" },
  { key: "EMPLOYEE", label: "Employees", color: "#2BB3A3" },
  { key: "ADVISOR", label: "Advisors", color: "#A3B1C6" },
  { key: "POOL", label: "ESOP pool", color: "#F2B421" },
];

export const NEW_INVESTOR_COLOR = "#8B6CFF";

export function groupMeta(group: HolderGroup) {
  return GROUPS.find((g) => g.key === group) ?? GROUPS[0];
}

export type Row = {
  id: string;
  name: string;
  group: HolderGroup;
  color: string;
  before: number;
  beforePct: number;
  after: number;
  afterPct: number;
  isNew?: boolean;
};

export type RoundResult = {
  pricePerShare: number;
  newInvestorShares: number;
  poolTopUpShares: number;
  postMoney: number;
  investorPct: number;
  /** Set when the inputs cannot produce a valid round. */
  problem?: string;
};

export type CapTableResult = {
  totalBefore: number;
  totalAfter: number;
  rows: Row[];
  round: RoundResult | null;
  byGroupBefore: { group: HolderGroup; shares: number; pct: number }[];
  byGroupAfter: { group: HolderGroup | "NEW"; shares: number; pct: number }[];
};

function pct(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

export function modelRound(holders: Holder[], round: RoundInput): RoundResult | null {
  if (!round.enabled) return null;

  const S = holders.reduce((sum, h) => sum + Math.max(0, h.shares), 0);
  const E = holders.filter((h) => h.group === "POOL").reduce((sum, h) => sum + Math.max(0, h.shares), 0);
  const V = round.preMoney;
  const I = round.investment;

  const empty: RoundResult = { pricePerShare: 0, newInvestorShares: 0, poolTopUpShares: 0, postMoney: 0, investorPct: 0 };

  if (S <= 0) return { ...empty, problem: "Add shareholders first." };
  if (!(V > 0)) return { ...empty, problem: "Enter a pre-money valuation." };
  if (!(I > 0)) return { ...empty, problem: "Enter the amount being raised." };

  // Pool top-up X is added before the money so the target holds post-money.
  // (E + X) = p * T,  T = (S + X)(V + I) / V  =>  X = (kS - E) / (1 - k),  k = p(V + I)/V
  const p = Math.max(0, Math.min(60, round.poolTargetPct)) / 100;
  let X = 0;
  if (p > 0) {
    const k = (p * (V + I)) / V;
    if (k >= 1) {
      return { ...empty, problem: "The pool target is too large for this round. Lower the pool % or raise less." };
    }
    X = Math.max(0, Math.round((k * S - E) / (1 - k)));
  }

  const preShares = S + X;
  const price = V / preShares;
  const N = Math.round(I / price);

  return {
    pricePerShare: price,
    newInvestorShares: N,
    poolTopUpShares: X,
    postMoney: V + I,
    investorPct: pct(N, preShares + N),
  };
}

export function computeCapTable(holders: Holder[], round: RoundInput): CapTableResult {
  const clean = holders.map((h) => ({ ...h, shares: Math.max(0, Math.round(h.shares || 0)) }));
  const totalBefore = clean.reduce((s, h) => s + h.shares, 0);
  const r = modelRound(clean, round);
  const valid = r && !r.problem ? r : null;

  const poolHolders = clean.filter((h) => h.group === "POOL");
  const topUp = valid?.poolTopUpShares ?? 0;

  const rows: Row[] = clean.map((h) => {
    // The top-up goes to the first pool line (or a new one, below).
    const extra = topUp > 0 && poolHolders[0]?.id === h.id ? topUp : 0;
    return {
      id: h.id,
      name: h.name || "Unnamed",
      group: h.group,
      color: groupMeta(h.group).color,
      before: h.shares,
      beforePct: 0,
      after: h.shares + extra,
      afterPct: 0,
    };
  });

  if (valid && topUp > 0 && poolHolders.length === 0) {
    rows.push({ id: "__pool_topup", name: "ESOP pool (new)", group: "POOL", color: groupMeta("POOL").color, before: 0, beforePct: 0, after: topUp, afterPct: 0, isNew: true });
  }
  if (valid && valid.newInvestorShares > 0) {
    rows.push({
      id: "__new_investor",
      name: round.name.trim() || "New investor",
      group: "INVESTOR",
      color: NEW_INVESTOR_COLOR,
      before: 0,
      beforePct: 0,
      after: valid.newInvestorShares,
      afterPct: 0,
      isNew: true,
    });
  }

  const totalAfter = rows.reduce((s, x) => s + x.after, 0);
  for (const row of rows) {
    row.beforePct = pct(row.before, totalBefore);
    row.afterPct = pct(row.after, valid ? totalAfter : totalBefore);
    if (!valid) row.after = row.before;
  }

  const byGroupBefore = GROUPS.map((g) => {
    const shares = rows.filter((x) => x.group === g.key && !x.isNew).reduce((s, x) => s + x.before, 0);
    return { group: g.key, shares, pct: pct(shares, totalBefore) };
  }).filter((g) => g.shares > 0);

  const afterTotal = valid ? totalAfter : totalBefore;
  const byGroupAfter: CapTableResult["byGroupAfter"] = GROUPS.map((g) => {
    const shares = rows.filter((x) => x.group === g.key && x.id !== "__new_investor").reduce((s, x) => s + x.after, 0);
    return { group: g.key as HolderGroup | "NEW", shares, pct: pct(shares, afterTotal) };
  }).filter((g) => g.shares > 0);
  if (valid && valid.newInvestorShares > 0) {
    byGroupAfter.push({ group: "NEW", shares: valid.newInvestorShares, pct: pct(valid.newInvestorShares, afterTotal) });
  }

  return { totalBefore, totalAfter: afterTotal, rows, round: r, byGroupBefore, byGroupAfter };
}

/* ---------- formatting ---------- */

export function fmtShares(n: number) {
  return Math.round(n).toLocaleString("en-IN");
}

export function fmtPct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function fmtInr(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function parseNumber(text: string) {
  const n = Number(String(text).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* ---------- CSV ---------- */

function csvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(company: string, result: CapTableResult, round: RoundInput) {
  const hasRound = Boolean(result.round && !result.round.problem);
  const lines: (string | number)[][] = [];
  lines.push(["Company", company || "My company"]);
  lines.push(["Generated", new Date().toISOString().slice(0, 10)]);
  lines.push(["Source", "ESOP Value Clarity free cap table builder (esopvalueclarity.com/cap-table)"]);
  lines.push([]);
  lines.push(
    hasRound
      ? ["Shareholder", "Group", "Shares today", "% today (fully diluted)", "Shares after round", "% after round"]
      : ["Shareholder", "Group", "Shares", "% (fully diluted)"]
  );
  for (const r of result.rows) {
    if (!hasRound && r.isNew) continue;
    const label = r.id === "__new_investor" ? "New investor" : groupMeta(r.group).label;
    lines.push(
      hasRound
        ? [r.name, label, r.before, r.beforePct.toFixed(4), r.after, r.afterPct.toFixed(4)]
        : [r.name, label, r.before, r.beforePct.toFixed(4)]
    );
  }
  lines.push(hasRound ? ["Total", "", result.totalBefore, "100.0000", result.totalAfter, "100.0000"] : ["Total", "", result.totalBefore, "100.0000"]);

  if (hasRound && result.round) {
    lines.push([]);
    lines.push(["Round", round.name || "Funding round"]);
    lines.push(["Pre-money valuation (INR)", Math.round(round.preMoney)]);
    lines.push(["Amount raised (INR)", Math.round(round.investment)]);
    lines.push(["Post-money valuation (INR)", Math.round(result.round.postMoney)]);
    lines.push(["Price per share (INR)", result.round.pricePerShare.toFixed(4)]);
    lines.push(["New investor shares", result.round.newInvestorShares]);
    lines.push(["ESOP pool top-up shares", result.round.poolTopUpShares]);
    lines.push(["Target ESOP pool after round (%)", round.poolTargetPct]);
  }
  lines.push([]);
  lines.push(["Note", "Illustrative model. Not a statutory register. Check with your CS before filing anything."]);

  return lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
}

/* ---------- starting data ---------- */

let seq = 0;
export function newId() {
  seq += 1;
  return `h${Date.now().toString(36)}${seq}`;
}

export const EXAMPLE_HOLDERS: Holder[] = [
  { id: "f1", name: "Founder A", group: "FOUNDER", shares: 4_500_000 },
  { id: "f2", name: "Founder B", group: "FOUNDER", shares: 3_500_000 },
  { id: "a1", name: "Angel investors", group: "INVESTOR", shares: 800_000 },
  { id: "e1", name: "Early employees", group: "EMPLOYEE", shares: 200_000 },
  { id: "ad", name: "Advisor", group: "ADVISOR", shares: 100_000 },
  { id: "p1", name: "ESOP pool", group: "POOL", shares: 900_000 },
];

export const EXAMPLE_ROUND: RoundInput = {
  enabled: true,
  name: "Seed",
  preMoney: 20 * 1e7,
  investment: 5 * 1e7,
  poolTargetPct: 12,
};

export const BLANK_HOLDERS: Holder[] = [
  { id: "b1", name: "Founder 1", group: "FOUNDER", shares: 5_000_000 },
  { id: "b2", name: "Founder 2", group: "FOUNDER", shares: 5_000_000 },
];
