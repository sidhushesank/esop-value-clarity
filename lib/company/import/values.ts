/** Value parsers shared with the Advisor importer (Indian date formats, ₹ amounts, durations). */
export {
  parseDateValue,
  parseDurationValue,
  parseIntegerValue,
  parseNumberValue,
} from "@/lib/advisor/import-parse";

export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.replace(/^﻿/, "").trim() === "";
  return false;
}

export function text(value: unknown): string {
  return isBlank(value) ? "" : String(value).replace(/^﻿/, "").trim();
}

/** Yes / No style cells. Returns null when blank or unrecognised. */
export function parseYesNo(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const t = text(value).toLowerCase();
  if (!t) return null;
  if (["y", "yes", "true", "1", "resident", "indian"].includes(t)) return true;
  if (["n", "no", "false", "0", "non-resident", "nonresident", "nri", "foreign"].includes(t)) return false;
  return null;
}
