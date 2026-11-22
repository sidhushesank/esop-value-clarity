/**
 * ============================================================================
 * STARTUP EQUITY DESK: CAP TABLE ENGINE
 * ============================================================================
 *
 * The cap table is never stored. It is computed from the share-movement log:
 *
 *   ALLOTMENT   +quantity to toHolder (class)
 *   TRANSFER    -quantity from fromHolder, +quantity to toHolder (same class)
 *   BUYBACK     -quantity from fromHolder (the company cancels the units)
 *   CONVERSION  -quantity of class from fromHolder,
 *               +toQuantity of toClass to the same holder
 *
 * Pure functions only (no database), so this file is easy to test.
 * ============================================================================
 */

export type SecurityKindLite =
  | "EQUITY"
  | "CCPS"
  | "CCD"
  | "CONVERTIBLE_NOTE"
  | "ISAFE"
  | "WARRANT";

export type MovementKindLite = "ALLOTMENT" | "TRANSFER" | "CONVERSION" | "BUYBACK";

export type ClassLite = {
  id: string;
  name: string;
  kind: SecurityKindLite;
  conversionRatio: number | null;
  principalAmount: number | null;
};

export type HolderLite = {
  id: string;
  name: string;
  type: "FOUNDER" | "INVESTOR" | "EMPLOYEE" | "OTHER";
};

export type MovementLite = {
  id: string;
  kind: MovementKindLite;
  date: Date;
  createdAt: Date;
  classId: string;
  toClassId: string | null;
  fromHolderId: string | null;
  toHolderId: string | null;
  quantity: number;
  toQuantity: number | null;
};

export type EsopLite = {
  /** Sum of pool sizes of active schemes. */
  poolSize: number;
  /** Options ever granted (issued grants), net of lapsed options returned to the pool. */
  grantedNetOfLapsed: number;
  /** Granted, not lapsed, not yet exercised. */
  outstandingOptions: number;
};

/** Units of a class that have no share count until they convert at a later round. */
export function isAmountBased(kind: SecurityKindLite): boolean {
  return kind === "CONVERTIBLE_NOTE" || kind === "ISAFE";
}

/* ------------------------------------------------------------------ */
/* Balances                                                            */
/* ------------------------------------------------------------------ */

type Balances = Map<string, number>; // key: holderId|classId

const key = (holderId: string, classId: string) => `${holderId}|${classId}`;

function add(b: Balances, holderId: string, classId: string, n: number) {
  const k = key(holderId, classId);
  b.set(k, (b.get(k) ?? 0) + n);
}

export function sortMovements(movements: MovementLite[]): MovementLite[] {
  return [...movements].sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
}

function apply(b: Balances, m: MovementLite) {
  switch (m.kind) {
    case "ALLOTMENT":
      if (m.toHolderId) add(b, m.toHolderId, m.classId, m.quantity);
      break;
    case "TRANSFER":
      if (m.fromHolderId) add(b, m.fromHolderId, m.classId, -m.quantity);
      if (m.toHolderId) add(b, m.toHolderId, m.classId, m.quantity);
      break;
    case "BUYBACK":
      if (m.fromHolderId) add(b, m.fromHolderId, m.classId, -m.quantity);
      break;
    case "CONVERSION":
      if (m.fromHolderId) {
        add(b, m.fromHolderId, m.classId, -m.quantity);
        if (m.toClassId) add(b, m.fromHolderId, m.toClassId, m.toQuantity ?? 0);
      }
      break;
  }
}

/** Balances after every movement on or before `asOf` (all movements if omitted). */
export function balancesAsOf(movements: MovementLite[], asOf?: Date): Balances {
  const b: Balances = new Map();
  for (const m of sortMovements(movements)) {
    if (asOf && m.date.getTime() > asOf.getTime()) break;
    apply(b, m);
  }
  return b;
}

export type NegativeBalance = {
  movementId: string;
  holderId: string;
  classId: string;
  balance: number;
  date: Date;
};

/**
 * Walks the log in date order and returns the first point where any holder's
 * balance of any class goes below zero. Used to reject a new movement (or a
 * delete) that would make the history impossible.
 */
export function findNegativeBalance(
  movements: MovementLite[]
): NegativeBalance | null {
  const b: Balances = new Map();

  for (const m of sortMovements(movements)) {
    apply(b, m);

    for (const [k, v] of b) {
      if (v < 0) {
        const [holderId, classId] = k.split("|");
        return { movementId: m.id, holderId, classId, balance: v, date: m.date };
      }
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Cap table snapshot                                                  */
/* ------------------------------------------------------------------ */

export type CapTableRow = {
  holderId: string;
  name: string;
  type: HolderLite["type"];
  /** Units held per class id (share/unit count; amount-based classes excluded). */
  units: Record<string, number>;
  /** Amount held per amount-based class id (notes / iSAFE), by principal share. */
  amounts: Record<string, number>;
  equityShares: number;
  fullyDilutedShares: number;
  issuedPct: number;
  fullyDilutedPct: number;
};

export type CapTableSnapshot = {
  asOf: Date | null;
  classes: (ClassLite & { totalUnits: number; amountBased: boolean })[];
  rows: CapTableRow[];
  totals: {
    equityShares: number;
    fullyDilutedShares: number;
  };
  esop: {
    poolSize: number;
    outstandingOptions: number;
    unallocated: number;
    fullyDilutedShares: number;
    fullyDilutedPct: number;
  };
  /** Plain-language notes about what is and is not counted. */
  notes: string[];
};

function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

function fdFactor(c: ClassLite): number {
  if (c.kind === "EQUITY") return 1;
  if (isAmountBased(c.kind)) return 0;
  return c.conversionRatio && c.conversionRatio > 0 ? c.conversionRatio : 1;
}

export function buildCapTable(input: {
  classes: ClassLite[];
  holders: HolderLite[];
  movements: MovementLite[];
  esop: EsopLite;
  asOf?: Date;
}): CapTableSnapshot {
  const { classes, holders, movements, esop, asOf } = input;
  const b = balancesAsOf(movements, asOf);
  const notes: string[] = [];

  const rows: CapTableRow[] = holders.map((h) => {
    const units: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    let equityShares = 0;
    let fd = 0;

    for (const c of classes) {
      const n = b.get(key(h.id, c.id)) ?? 0;
      if (n === 0) continue;

      if (isAmountBased(c.kind)) {
        amounts[c.id] = n;
        continue;
      }

      units[c.id] = n;
      if (c.kind === "EQUITY") equityShares += n;
      fd += n * fdFactor(c);
    }

    return {
      holderId: h.id,
      name: h.name,
      type: h.type,
      units,
      amounts,
      equityShares,
      fullyDilutedShares: fd,
      issuedPct: 0,
      fullyDilutedPct: 0,
    };
  });

  const unallocated = Math.max(0, esop.poolSize - esop.grantedNetOfLapsed);
  const esopFd = esop.outstandingOptions + unallocated;

  const totalEquity = rows.reduce((s, r) => s + r.equityShares, 0);
  const totalFd = rows.reduce((s, r) => s + r.fullyDilutedShares, 0) + esopFd;

  for (const r of rows) {
    r.issuedPct = pct(r.equityShares, totalEquity);
    r.fullyDilutedPct = pct(r.fullyDilutedShares, totalFd);
  }

  const visibleRows = rows
    .filter(
      (r) =>
        Object.keys(r.units).length > 0 || Object.keys(r.amounts).length > 0
    )
    .sort((a, b2) => b2.fullyDilutedShares - a.fullyDilutedShares);

  const classTotals = classes.map((c) => {
    let total = 0;
    for (const h of holders) total += b.get(key(h.id, c.id)) ?? 0;
    return { ...c, totalUnits: total, amountBased: isAmountBased(c.kind) };
  });

  for (const c of classTotals) {
    if (
      (c.kind === "CCPS" || c.kind === "CCD" || c.kind === "WARRANT") &&
      !(c.conversionRatio && c.conversionRatio > 0) &&
      c.totalUnits > 0
    ) {
      notes.push(
        `${c.name}: no conversion ratio entered, so each unit is counted as 1 share in the fully diluted view.`
      );
    }
    if (c.amountBased && c.totalUnits > 0) {
      notes.push(
        `${c.name}: a convertible note or SAFE has no share count until it converts at a priced round, so it is not in the percentages.`
      );
    }
  }

  if (esop.poolSize === 0) {
    notes.push(
      "No option pool is recorded yet. Add one on the pool tab so the fully diluted view includes it."
    );
  }

  return {
    asOf: asOf ?? null,
    classes: classTotals,
    rows: visibleRows,
    totals: { equityShares: totalEquity, fullyDilutedShares: totalFd },
    esop: {
      poolSize: esop.poolSize,
      outstandingOptions: esop.outstandingOptions,
      unallocated,
      fullyDilutedShares: esopFd,
      fullyDilutedPct: pct(esopFd, totalFd),
    },
    notes,
  };
}
