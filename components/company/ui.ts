export const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export const LABEL = "text-xs font-bold text-slate-500";

export const BTN_DARK =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

export const BTN_LIGHT =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40";

export const CARD = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function fmtDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "1,20,000" -> 120000; "" -> null; invalid -> NaN */
export function parseNum(value: string): number | null {
  const t = value.replace(/,/g, "").trim();
  if (!t) return null;
  return Number(t);
}

export async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
