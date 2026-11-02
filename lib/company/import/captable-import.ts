/**
 * Cap table import: each row becomes an opening allotment (one share
 * movement) for a shareholder in a class. Missing classes and shareholders
 * are created; existing ones are matched by name, ignoring case.
 *
 * Pure: the route passes in what already exists and does the database work.
 */

import type { ImportMapping } from "@/lib/company/import/fields";
import {
  isBlank,
  parseDateValue,
  parseIntegerValue,
  parseNumberValue,
  parseYesNo,
  text,
} from "@/lib/company/import/values";

type Cells = unknown[];
export type Row = { rowNumber: number; cells: Cells };

export type SecurityKindLite = "EQUITY" | "CCPS" | "CCD" | "CONVERTIBLE_NOTE" | "ISAFE" | "WARRANT";
export type HolderTypeLite = "FOUNDER" | "INVESTOR" | "EMPLOYEE" | "OTHER";

export type CapImportItem = {
  rowNumber: number;
  holderName: string;
  holderKey: string;
  holderType: HolderTypeLite;
  email: string | null;
  isResident: boolean;
  className: string;
  classKey: string;
  classKind: SecurityKindLite;
  quantity: number;
  date: Date;
  price: number | null;
};

export type CapImportAnalysis = {
  items: CapImportItem[];
  invalid: { rowNumber: number; errors: string[] }[];
  newClasses: { name: string; kind: SecurityKindLite }[];
  newHolders: { name: string; type: HolderTypeLite }[];
  matchedHolders: number;
  totalsByClass: { className: string; quantity: number }[];
};

export const DEFAULT_CLASS_NAME = "Equity shares";

export const nameKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function parseClassKind(value: unknown): SecurityKindLite | null {
  const t = text(value).toLowerCase().replace(/[^a-z]/g, "");
  if (!t) return null;
  if (t.includes("isafe") || t === "safe") return "ISAFE";
  if (t.includes("ccps") || t.includes("preference") || t.includes("pref")) return "CCPS";
  if (t.includes("ccd") || t.includes("debenture")) return "CCD";
  if (t.includes("note")) return "CONVERTIBLE_NOTE";
  if (t.includes("warrant")) return "WARRANT";
  if (t.includes("equity") || t.includes("ordinary") || t.includes("common")) return "EQUITY";
  return null;
}

/** Guess a kind from the class name when no type column is given. */
function kindFromName(name: string): SecurityKindLite {
  return parseClassKind(name) ?? "EQUITY";
}

export function parseHolderType(value: unknown): HolderTypeLite {
  const t = text(value).toLowerCase();
  if (/(founder|promoter|co-founder|cofounder)/.test(t)) return "FOUNDER";
  if (/(investor|angel|vc|fund|venture|capital|syndicate)/.test(t)) return "INVESTOR";
  if (/(employee|esop|staff)/.test(t)) return "EMPLOYEE";
  return "OTHER";
}

function cell(row: Row, mapping: ImportMapping, key: string): unknown {
  const i = mapping[key];
  return i === null || i === undefined ? null : row.cells[i];
}

export function analyseCapTable(
  rows: Row[],
  mapping: ImportMapping,
  ctx: {
    asOf: Date;
    today: Date;
    existingClasses: { name: string; kind: SecurityKindLite }[];
    existingHolders: { name: string }[];
  }
): CapImportAnalysis {
  const existingClass = new Map(ctx.existingClasses.map((c) => [nameKey(c.name), c]));
  const existingHolder = new Set(ctx.existingHolders.map((h) => nameKey(h.name)));

  const items: CapImportItem[] = [];
  const invalid: CapImportAnalysis["invalid"] = [];
  const newClasses = new Map<string, { name: string; kind: SecurityKindLite; firstRow: number }>();
  const newHolders = new Map<string, { name: string; type: HolderTypeLite }>();
  const matched = new Set<string>();

  for (const row of rows) {
    const errors: string[] = [];

    const holderName = text(cell(row, mapping, "holderName"));
    if (!holderName) errors.push("Shareholder name is empty.");
    else if (holderName.length > 200) errors.push("Shareholder name is longer than 200 characters.");

    const className = text(cell(row, mapping, "className")) || DEFAULT_CLASS_NAME;
    const classKey = nameKey(className);
    const typeCell = cell(row, mapping, "classType");
    let classKind: SecurityKindLite;

    const known = existingClass.get(classKey);
    if (known) {
      classKind = known.kind;
      const stated = parseClassKind(typeCell);
      if (stated && stated !== known.kind) {
        errors.push(`"${className}" already exists in EVC as a different class type.`);
      }
    } else {
      const stated = parseClassKind(typeCell);
      if (!isBlank(typeCell) && !stated) {
        errors.push(`Class type "${text(typeCell)}" is not recognised (use Equity, CCPS, CCD, Note, iSAFE or Warrant).`);
      }
      classKind = stated ?? kindFromName(className);
      const already = newClasses.get(classKey);
      if (already && already.kind !== classKind) {
        errors.push(`"${className}" has a different class type than on row ${already.firstRow}.`);
      }
    }

    const qty = parseIntegerValue(cell(row, mapping, "quantity"));
    let quantity = 0;
    if (isBlank(cell(row, mapping, "quantity"))) errors.push("Number of shares is empty.");
    else if (!qty.ok) errors.push(`Number of shares ${qty.error}.`);
    else if (qty.value <= 0) errors.push("Number of shares must be more than zero.");
    else quantity = qty.value;

    let date = ctx.asOf;
    const dateCell = cell(row, mapping, "date");
    if (!isBlank(dateCell)) {
      const d = parseDateValue(dateCell);
      if (!d.ok) errors.push(`Date acquired ${d.error}.`);
      else if (d.value.getTime() > ctx.today.getTime()) errors.push("Date acquired is in the future.");
      else if (d.value.getUTCFullYear() < 1990) errors.push("Date acquired looks wrong.");
      else date = d.value;
    }

    let price: number | null = null;
    const priceCell = cell(row, mapping, "price");
    if (!isBlank(priceCell)) {
      const p = parseNumberValue(priceCell);
      if (!p.ok) errors.push(`Price per share ${p.error}.`);
      else if (p.value < 0) errors.push("Price per share cannot be negative.");
      else price = p.value;
    }

    const emailRaw = text(cell(row, mapping, "email")).toLowerCase();
    let email: string | null = null;
    if (emailRaw) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) errors.push(`Email "${emailRaw}" is not valid.`);
      else email = emailRaw;
    }

    const residentCell = cell(row, mapping, "resident");
    const resident = parseYesNo(residentCell);
    if (!isBlank(residentCell) && resident === null) errors.push(`Resident "${text(residentCell)}" should be Yes or No.`);

    if (errors.length) {
      invalid.push({ rowNumber: row.rowNumber, errors });
      continue;
    }

    const holderKey = nameKey(holderName);
    const holderType = parseHolderType(cell(row, mapping, "holderType"));

    if (!known && !newClasses.has(classKey)) {
      newClasses.set(classKey, { name: className, kind: classKind, firstRow: row.rowNumber });
    }
    if (existingHolder.has(holderKey)) matched.add(holderKey);
    else if (!newHolders.has(holderKey)) newHolders.set(holderKey, { name: holderName, type: holderType });

    items.push({
      rowNumber: row.rowNumber,
      holderName,
      holderKey,
      holderType,
      email,
      isResident: resident ?? true,
      className: known ? known.name : (newClasses.get(classKey)?.name ?? className),
      classKey,
      classKind,
      quantity,
      date,
      price,
    });
  }

  const totals = new Map<string, { className: string; quantity: number }>();
  for (const it of items) {
    const t = totals.get(it.classKey) ?? { className: it.className, quantity: 0 };
    t.quantity += it.quantity;
    totals.set(it.classKey, t);
  }

  return {
    items,
    invalid,
    newClasses: [...newClasses.values()].map(({ name, kind }) => ({ name, kind })),
    newHolders: [...newHolders.values()],
    matchedHolders: matched.size,
    totalsByClass: [...totals.values()],
  };
}
