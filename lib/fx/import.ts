import { Readable } from "node:stream";

import ExcelJS from "exceljs";

import { ProAccessError } from "@/lib/pro-access";
import { parseDateValue, parseNumberValue } from "@/lib/advisor/import-parse";
import type { FxTxnType } from "@/lib/fx/engine";

export const FX_MAX_BYTES = 5 * 1024 * 1024;
export const FX_MAX_ROWS = 20000;

function importError(message: string) {
  return new ProAccessError(message, 400, "FX_IMPORT_ERROR");
}

/* ------------------------------------------------------------------ */
/* Reading a CSV / XLSX into header + rows                             */
/* ------------------------------------------------------------------ */

type Row = { rowNumber: number; cells: unknown[] };

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;
  const obj = value as unknown as Record<string, unknown>;
  if ("result" in obj) return cellValue(obj.result as ExcelJS.CellValue);
  if (Array.isArray(obj.richText)) return (obj.richText as { text: string }[]).map((p) => p.text).join("");
  if (typeof obj.text === "string") return obj.text;
  return null;
}

function blank(v: unknown) {
  return v === null || v === undefined || (typeof v === "string" && v.replace(/^\uFEFF/, "").trim() === "");
}

export async function fileFromForm(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) throw importError("Please attach a .xlsx or .csv file.");
  if (file.size === 0) throw importError("The uploaded file is empty.");
  if (file.size > FX_MAX_BYTES) throw importError("The file is larger than 5 MB. Split it and upload in parts.");
  return { buffer: Buffer.from(await file.arrayBuffer()), fileName: file.name };
}

export async function readTable(buffer: Buffer, fileName: string, minHeaderCells = 2) {
  const wb = new ExcelJS.Workbook();
  const lower = fileName.toLowerCase();
  let sheet: ExcelJS.Worksheet | undefined;
  try {
    if (lower.endsWith(".xlsx")) {
      await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
      sheet = wb.worksheets[0];
    } else if (lower.endsWith(".csv")) {
      sheet = await wb.csv.read(Readable.from([buffer]));
    } else {
      throw importError("Only .xlsx and .csv files are supported. Save .xls or PDF statements as .xlsx / .csv first.");
    }
  } catch (error) {
    if (error instanceof ProAccessError) throw error;
    throw importError("The file could not be read. Check that it is a valid spreadsheet.");
  }
  if (!sheet) throw importError("The file has no sheets.");

  const cols = sheet.columnCount;
  const grid: Row[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: unknown[] = [];
    for (let c = 1; c <= cols; c++) cells.push(cellValue(row.getCell(c).value));
    grid.push({ rowNumber, cells });
  });

  const headerIndex = grid
    .slice(0, 15)
    .findIndex((r) => r.cells.filter((c) => typeof c === "string" && !blank(c)).length >= minHeaderCells);
  if (headerIndex < 0) throw importError("Could not find a header row with column names in the first 15 rows.");

  const headers = grid[headerIndex].cells.map((c, i) => (blank(c) ? `Column ${i + 1}` : String(c).replace(/^\uFEFF/, "").trim()));
  const rows = grid.slice(headerIndex + 1).filter((r) => r.cells.some((c) => !blank(c)));
  if (rows.length === 0) throw importError("No data rows found under the header.");
  if (rows.length > FX_MAX_ROWS) throw importError(`More than ${FX_MAX_ROWS} rows. Split the file.`);
  return { headers, rows };
}

export type DateOrder = "DMY" | "MDY";

/**
 * US brokers (E*TRADE, Schwab, Fidelity) write 11/03/2026 for 3 November;
 * Indian sheets write 03/11/2026. The importer asks which one the file uses.
 */
function parseDateOrdered(v: unknown, order: DateOrder) {
  if (order === "MDY" && typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(.*)$/);
    if (m) return parseDateValue(`${m[2]}/${m[1]}/${m[3]}${m[4]}`);
  }
  return parseDateValue(v);
}

/**
 * Looks at every a/b/yyyy text date in the file: a first part above 12 means
 * DD/MM, a second part above 12 means MM/DD. Null if the file never says.
 */
export function detectDateOrder(rows: Row[]): DateOrder | null {
  let dmy = 0;
  let mdy = 0;
  for (const r of rows.slice(0, 5000)) {
    for (const c of r.cells) {
      if (typeof c !== "string") continue;
      const m = c.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
      if (!m) continue;
      if (Number(m[1]) > 12) dmy += 1;
      if (Number(m[2]) > 12) mdy += 1;
    }
  }
  if (dmy && !mdy) return "DMY";
  if (mdy && !dmy) return "MDY";
  return null;
}

const norm = (h: string) => h.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function money(v: unknown) {
  if (typeof v === "string") {
    const cleaned = v.replace(/\$|usd|us\$/gi, "").replace(/[()]/g, (m) => (m === "(" ? "-" : "")).trim();
    return parseNumberValue(cleaned);
  }
  return parseNumberValue(v);
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

type FieldKey =
  | "type" | "date" | "symbol" | "company" | "broker" | "account" | "quantity"
  | "price" | "amount" | "fees" | "currency" | "lotRef" | "costInr";

export const FX_FIELDS: { key: FieldKey; label: string; required: boolean; synonyms: string[] }[] = [
  { key: "type", label: "Type", required: true, synonyms: ["type", "transactiontype", "action", "activity", "event", "recordtype", "transaction", "buysell"] },
  { key: "date", label: "Date", required: true, synonyms: ["date", "rundate", "transactiondate", "tradedate", "vestdate", "releasedate", "saledate", "settlementdate", "exercisedate", "paydate", "purchasedate"] },
  { key: "symbol", label: "Symbol", required: true, synonyms: ["symbol", "ticker", "stocksymbol", "security", "scrip", "stock"] },
  { key: "company", label: "Company", required: false, synonyms: ["company", "companyname", "issuer", "securityname", "description", "name"] },
  { key: "broker", label: "Broker", required: false, synonyms: ["broker", "platform", "custodian", "provider", "brokername"] },
  { key: "account", label: "Account", required: false, synonyms: ["account", "accountnumber", "accountno", "acct", "accountid"] },
  { key: "quantity", label: "Quantity", required: false, synonyms: ["quantity", "qty", "shares", "units", "sharessold", "sharesvested", "netshares", "numberofshares", "sharesreleased", "sharespurchased"] },
  { key: "price", label: "Price per share (USD)", required: false, synonyms: ["price", "priceusd", "pricepershare", "fmv", "fmvpershare", "fmvusd", "saleprice", "vestprice", "purchaseprice", "executionprice", "releaseprice", "marketprice"] },
  { key: "amount", label: "Amount (USD)", required: false, synonyms: ["amount", "amountusd", "grossamount", "dividend", "dividendamount", "netamount", "taxwithheld", "tax", "value", "cashamount"] },
  { key: "fees", label: "Fees (USD)", required: false, synonyms: ["fees", "fee", "commission", "commissions", "charges", "brokerage", "feesusd", "feescomm", "feesandcomm", "feescommissions", "feesandcommissions", "commissionsandfees"] },
  { key: "currency", label: "Currency", required: false, synonyms: ["currency", "ccy", "cur"] },
  { key: "lotRef", label: "Lot ref", required: false, synonyms: ["lotref", "lot", "lotid", "grantid", "grantnumber", "lotnumber", "awardid"] },
  { key: "costInr", label: "Cost INR per share (Form 16)", required: false, synonyms: ["costinrpershare", "perquisiteinrpershare", "form16valuepershare", "form16pershare", "perquisitepershare", "costinr"] },
];

function mapHeaders(headers: string[]) {
  const n = headers.map(norm);
  const used = new Set<number>();
  const map = {} as Record<FieldKey, number | null>;
  for (const f of FX_FIELDS) {
    const i = n.findIndex((h, idx) => !used.has(idx) && f.synonyms.includes(h));
    map[f.key] = i >= 0 ? i : null;
    if (i >= 0) used.add(i);
  }
  for (const f of FX_FIELDS) {
    if (map[f.key] !== null) continue;
    const i = n.findIndex((h, idx) => !used.has(idx) && h.length > 0 && f.synonyms.some((s) => s.length >= 5 && h.includes(s)));
    map[f.key] = i >= 0 ? i : null;
    if (i >= 0) used.add(i);
  }
  return map;
}

export type ActionClass =
  | { kind: "use"; type: FxTxnType; fmvCost: boolean }
  | { kind: "skip"; label: string }
  | null;

/**
 * Reads the Type / Action column. Actions the tax pack doesn't use (cash
 * transfers, interest, journals, splits) come back as "skip" and are listed
 * for the user rather than failing the import.
 */
export function classifyAction(v: unknown): ActionClass {
  const raw = String(v ?? "").trim();
  const t = norm(raw);
  if (!t) return null;
  if (/split/.test(t)) return { kind: "skip", label: raw };
  // Cashless exercise: shares bought and sold the same day, nothing held (perquisite only, in Form 16).
  if (/exercise.*sell|exercisesell|sameday|cashless/.test(t)) return { kind: "skip", label: `${raw} (cashless exercise: no shares held)` };
  if (/(tax|withh|^nra)/.test(t) && !/taxable/.test(t)) return { kind: "use", type: "TAX_WITHHELD", fmvCost: false };
  if (/reinvest(ed|ment)?shares?/.test(t)) return { kind: "use", type: "BUY", fmvCost: false };
  if (/div/.test(t)) return { kind: "use", type: "DIVIDEND", fmvCost: false };
  if (/^(sell|sale|sold)|sale$|sold$|^ss$|selltocover|salestocover|^yousold/.test(t)) return { kind: "use", type: "SELL", fmvCost: false };
  if (/(espp|exercise|option)/.test(t)) return { kind: "use", type: "BUY", fmvCost: true };
  if (/(vest|release|rsu|deposit|stockplan|lapse|award|restricted)/.test(t)) return { kind: "use", type: "VEST", fmvCost: false };
  if (/(buy|purchase|bought|reinvest)/.test(t)) return { kind: "use", type: "BUY", fmvCost: false };
  return { kind: "skip", label: raw };
}

/** Kept for callers that only need the type. */
export function parseType(v: unknown): FxTxnType | null {
  const c = classifyAction(v);
  return c && c.kind === "use" ? c.type : null;
}

export type FxTxnInput = {
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
  basisDate: Date | null;
  fmvCost: boolean;
};

export function parseTransactions(
  headers: string[],
  rows: Row[],
  defaults: { broker?: string | null; dateOrder?: DateOrder }
) {
  if (isGainsReport(headers)) return parseGainsReport(headers, rows, defaults);
  const order: DateOrder = defaults.dateOrder ?? "DMY";
  const map = mapHeaders(headers);
  const missing = FX_FIELDS.filter((f) => f.required && map[f.key] === null).map((f) => f.label);
  if (missing.length) {
    throw importError(
      `Couldn't find these columns: ${missing.join(", ")}. Columns found: ${headers.join(", ")}. Download the EVC template, or rename the columns.`
    );
  }
  const get = (r: Row, k: FieldKey) => (map[k] === null ? null : r.cells[map[k] as number]);
  const str = (v: unknown) => (blank(v) ? null : String(v).trim().slice(0, 120));

  const valid: FxTxnInput[] = [];
  const errors: { rowNumber: number; errors: string[] }[] = [];
  const skipped = new Map<string, number>();
  const skip = (label: string) => skipped.set(label, (skipped.get(label) ?? 0) + 1);

  for (const r of rows) {
    // Broker exports end with note lines in one cell (Fidelity's "Date downloaded…", disclaimers). Not transactions.
    if (r.cells.filter((c) => !blank(c)).length <= 1) continue;
    const e: string[] = [];
    const action = classifyAction(get(r, "type"));
    if (action && action.kind === "skip") {
      skip(action.label);
      continue;
    }
    const type = action ? action.type : null;
    const fmvCost = action ? action.fmvCost : false;
    if (!type) e.push("Type / Action is empty (use Vest, ESPP, Exercise, Buy, Sell, Dividend or Tax withheld).");
    const d = parseDateOrdered(get(r, "date"), order);
    if (!d.ok) e.push(`Date ${d.error}.`);
    const symbol = str(get(r, "symbol"))?.toUpperCase().replace(/\s+/g, "") ?? null;
    if (!symbol) e.push("Symbol is empty.");

    const num = (k: FieldKey, label: string) => {
      const v = get(r, k);
      if (blank(v)) return null;
      const p = money(v);
      if (!p.ok) {
        e.push(`${label} ${p.error}.`);
        return null;
      }
      return p.value;
    };
    let quantity = num("quantity", "Quantity");
    let price = num("price", "Price");
    let amount = num("amount", "Amount");
    const fees = num("fees", "Fees");
    const costInr = num("costInr", "Cost INR per share");

    if ((type === "VEST" || type === "BUY") && !quantity) {
      // A cash movement that happens to share a word with a share event (e.g. "Funds deposit").
      skip(`${str(get(r, "type"))} (no share quantity)`);
      continue;
    }
    if (type === "VEST" || type === "BUY" || type === "SELL") {
      quantity = quantity === null ? null : Math.abs(quantity);
      if (!quantity) e.push("Quantity is needed for a sale.");
      if ((price === null || price <= 0) && amount && quantity) price = Math.abs(amount) / quantity;
      if (price !== null && price <= 0) price = null;
      // Vest / ESPP / exercise values can come from the market close; a sale or a market purchase needs its own price.
      if (price === null && (type === "SELL" || (type === "BUY" && !fmvCost))) {
        e.push(`Price per share is needed (${type === "SELL" ? "sale price" : "purchase price"}).`);
      }
    }
    if (type === "DIVIDEND" || type === "TAX_WITHHELD") {
      amount = amount === null ? null : Math.abs(amount);
      if (!amount) e.push("Amount is needed for dividends and tax withheld.");
      quantity = quantity ?? 0;
    }
    const currency = (str(get(r, "currency")) ?? "USD").toUpperCase().slice(0, 3);
    if (!/^[A-Z]{3}$/.test(currency)) e.push(`Currency "${currency}" should be a 3-letter code like USD.`);

    if (e.length) {
      errors.push({ rowNumber: r.rowNumber, errors: e });
      continue;
    }
    valid.push({
      type: type as FxTxnType,
      date: (d as { ok: true; value: Date }).value,
      symbol: symbol as string,
      company: str(get(r, "company")),
      broker: str(get(r, "broker")) ?? defaults.broker ?? null,
      account: str(get(r, "account")),
      quantity: quantity ?? 0,
      priceUsd: price,
      amountUsd: amount,
      feesUsd: fees === null ? null : Math.abs(fees),
      currency,
      lotRef: str(get(r, "lotRef")),
      costInrPerShare: costInr,
      basisDate: null,
      fmvCost,
    });
  }
  return { valid, errors, mapping: map, gainsReport: false as const, skipped: [...skipped.entries()] };
}

/* ------------------------------------------------------------------ */
/* Realised gains reports (one row per sale, with acquired + sold)     */
/* E*TRADE "Gains & Losses", Schwab "Realized Gain/Loss", Fidelity...   */
/* ------------------------------------------------------------------ */

const ACQ = ["dateacquired", "acquireddate", "acquisitiondate", "openeddate", "opendate", "dateofacquisition", "vestdate", "purchasedate"];
const SOLD = ["datesold", "solddate", "saledate", "closeddate", "closedate", "dateofsale", "dateofsaletransfer"];

function findCol(n: string[], exact: string[], partial: string[] = [], skip: Set<number> = new Set()) {
  let i = n.findIndex((h, idx) => !skip.has(idx) && exact.includes(h));
  if (i < 0 && partial.length) i = n.findIndex((h, idx) => !skip.has(idx) && partial.some((p) => h.includes(p)));
  return i >= 0 ? i : null;
}

export function isGainsReport(headers: string[]) {
  const n = headers.map(norm);
  return findCol(n, ACQ, ["acquired"]) !== null && findCol(n, SOLD, ["datesold", "solddate"]) !== null;
}

function parseGainsReport(headers: string[], rows: Row[], defaults: { broker?: string | null; dateOrder?: DateOrder }) {
  const order: DateOrder = defaults.dateOrder ?? "MDY";
  const n = headers.map(norm);
  const used = new Set<number>();
  const take = (exact: string[], partial: string[] = []) => {
    const i = findCol(n, exact, partial, used);
    if (i !== null) used.add(i);
    return i;
  };
  const col = {
    acq: take(ACQ, ["acquired"]),
    sold: take(SOLD, ["datesold", "solddate"]),
    symbol: take(["symbol", "ticker", "stocksymbol", "security"]),
    qty: take(["quantity", "qty", "shares", "sharessold", "units", "quantitysold"], ["quantity", "shares"]),
    costPs: take(["adjustedcostbasispershare", "costbasispershare", "acquisitioncostpershare", "costpershare", "purchasepricepershare", "vestdatefmv", "fmvpershare", "adjustedcostpershare"], ["costbasispershare", "costpershare"]),
    costTot: take(["adjustedcostbasis", "costbasis", "totalcostbasis", "acquisitioncost", "cost", "adjustedcost", "totalcost"], ["costbasis"]),
    procPs: take(["proceedspershare", "salepricepershare", "salesprice", "saleprice", "pricepershare", "salesproceedspershare"], ["proceedspershare", "saleprice"]),
    procTot: take(["totalproceeds", "proceeds", "grossproceeds", "salesproceeds", "adjustedproceeds"], ["proceeds"]),
    fees: take(["fees", "commission", "commissions", "feescomm", "feesandcomm"], ["commission"]),
    plan: take(["plantype", "type", "securitytype", "granttype", "awardtype", "source"]),
    company: take(["company", "companyname", "description", "securityname", "name"]),
    broker: take(["broker", "custodian", "platform"]),
    account: take(["account", "accountnumber", "accountno"]),
    currency: take(["currency", "ccy"]),
    lot: take(["lotref", "lot", "lotid", "grantnumber", "grantid", "awardid", "orderid", "ordernumber"]),
    costInr: take(["costinrpershare", "form16valuepershare", "perquisitepershare", "perquisiteinrpershare"]),
  };
  const missing: string[] = [];
  if (col.symbol === null) missing.push("Symbol");
  if (col.qty === null) missing.push("Quantity");
  if (col.costPs === null && col.costTot === null) missing.push("Cost basis (per share or total)");
  if (col.procPs === null && col.procTot === null) missing.push("Proceeds (per share or total)");
  if (missing.length) {
    throw importError(
      `This looks like a realised gains report (it has Date Acquired and Date Sold), but these columns are missing: ${missing.join(", ")}. Columns found: ${headers.join(", ")}.`
    );
  }
  const cell = (r: Row, i: number | null) => (i === null ? null : r.cells[i]);
  const str = (v: unknown) => (blank(v) ? null : String(v).trim().slice(0, 120));

  const valid: FxTxnInput[] = [];
  const errors: { rowNumber: number; errors: string[] }[] = [];
  const skipped = new Map<string, number>();
  const mapping = {
    type: col.plan, date: col.sold, symbol: col.symbol, company: col.company, broker: col.broker,
    account: col.account, quantity: col.qty, price: col.procPs ?? col.procTot, amount: null,
    fees: col.fees, currency: col.currency, lotRef: col.lot, costInr: col.costInr,
  } as Record<FieldKey, number | null>;

  for (const r of rows) {
    const e: string[] = [];
    const symbol = str(cell(r, col.symbol))?.toUpperCase().replace(/\s+/g, "") ?? null;
    // Skip total / subtotal lines.
    if (!symbol || /^(total|subtotal|grandtotal)/i.test(symbol)) continue;
    const acq = parseDateOrdered(cell(r, col.acq), order);
    const sold = parseDateOrdered(cell(r, col.sold), order);
    if (!acq.ok) e.push(`Date acquired ${acq.error}.`);
    if (!sold.ok) e.push(`Date sold ${sold.error}.`);
    const numOf = (i: number | null, label: string) => {
      const v = cell(r, i);
      if (i === null || blank(v)) return null;
      const p = money(v);
      if (!p.ok) {
        e.push(`${label} ${p.error}.`);
        return null;
      }
      return Math.abs(p.value);
    };
    const qty = numOf(col.qty, "Quantity");
    if (!qty) e.push("Quantity is empty.");
    let costPs = numOf(col.costPs, "Cost per share");
    const costTot = numOf(col.costTot, "Cost basis");
    if (costPs === null && costTot !== null && qty) costPs = costTot / qty;
    let procPs = numOf(col.procPs, "Proceeds per share");
    const procTot = numOf(col.procTot, "Proceeds");
    if (procPs === null && procTot !== null && qty) procPs = procTot / qty;
    const plan = norm(String(cell(r, col.plan) ?? ""));
    const fmvCost = /(espp|exercise|option|iso|nso|nqso)/.test(plan);
    if (costPs === null && !fmvCost) e.push("Cost basis is empty.");
    if (procPs === null) e.push("Proceeds are empty.");
    const fees = numOf(col.fees, "Fees");
    const costInr = numOf(col.costInr, "Cost INR per share");
    const currency = (str(cell(r, col.currency)) ?? "USD").toUpperCase().slice(0, 3);
    if (e.length) {
      errors.push({ rowNumber: r.rowNumber, errors: e });
      continue;
    }
    const acqType: FxTxnType = fmvCost || /(purchase|buy)/.test(plan) ? "BUY" : "VEST";
    const acqDate = (acq as { ok: true; value: Date }).value;
    const soldDate = (sold as { ok: true; value: Date }).value;
    // Each row is its own lot, so the sale is matched to exactly the shares the broker reported.
    const lotRef = `${str(cell(r, col.lot)) ?? "R"}#${r.rowNumber} ${symbol} ${acqDate.toISOString().slice(0, 10)}`.slice(0, 120);
    const base = {
      symbol,
      company: str(cell(r, col.company)),
      broker: str(cell(r, col.broker)) ?? defaults.broker ?? null,
      account: str(cell(r, col.account)),
      quantity: qty as number,
      amountUsd: null,
      currency,
      lotRef,
    };
    // Gains reports state share counts as of the sale, so splits are applied from the sale date.
    valid.push({ ...base, type: acqType, date: acqDate, priceUsd: costPs, feesUsd: null, costInrPerShare: costInr, basisDate: soldDate, fmvCost });
    valid.push({ ...base, type: "SELL", date: soldDate, priceUsd: procPs, feesUsd: fees, costInrPerShare: null, basisDate: soldDate, fmvCost: false });
  }
  return { valid, errors, mapping, gainsReport: true as const, skipped: [...skipped.entries()] };
}

/* ------------------------------------------------------------------ */
/* SBI TT buying rates                                                 */
/* ------------------------------------------------------------------ */

export function parseRates(headers: string[], rows: Row[]) {
  const n = headers.map(norm);
  const dateCol = n.findIndex((h) => h === "date" || h.includes("date"));
  let rateCol = n.findIndex((h) => h === "ttbuy" || h === "ttbr" || h === "ttbuyingrate");
  if (rateCol < 0) rateCol = n.findIndex((h) => h.includes("ttbuy") || h.includes("ttbr"));
  if (rateCol < 0) rateCol = n.findIndex((h, i) => i !== dateCol && (h === "rate" || h.includes("buy")));
  if (dateCol < 0 || rateCol < 0) {
    throw importError(`Need a Date column and a TT BUY (or TTBR) column. Columns found: ${headers.join(", ")}.`);
  }
  const out: { date: Date; ttbr: number }[] = [];
  let skipped = 0;
  for (const r of rows) {
    const d = parseDateValue(r.cells[dateCol]);
    const v = parseNumberValue(r.cells[rateCol]);
    if (!d.ok || !v.ok || v.value <= 0 || v.value > 100000) {
      skipped += 1;
      continue;
    }
    out.push({ date: d.value, ttbr: v.value });
  }
  if (!out.length) throw importError("No usable rate rows found.");
  return { rows: out, skipped };
}

/* ------------------------------------------------------------------ */
/* Daily prices                                                        */
/* ------------------------------------------------------------------ */

export function parsePrices(headers: string[], rows: Row[], order: DateOrder = "MDY") {
  const n = headers.map(norm);
  const dateCol = n.findIndex((h) => h === "date" || h.includes("date"));
  let closeCol = n.findIndex((h) => h === "close" || h === "closeprice" || h === "closelast");
  if (closeCol < 0) closeCol = n.findIndex((h) => h.includes("close") && !h.includes("adj"));
  if (closeCol < 0) closeCol = n.findIndex((h) => h === "price" || h === "last");
  if (dateCol < 0 || closeCol < 0) {
    throw importError(`Need a Date column and a Close column. Columns found: ${headers.join(", ")}.`);
  }
  const out: { date: Date; close: number }[] = [];
  let skipped = 0;
  for (const r of rows) {
    const d = parseDateOrdered(r.cells[dateCol], order);
    const v = money(r.cells[closeCol]);
    if (!d.ok || !v.ok || v.value <= 0) {
      skipped += 1;
      continue;
    }
    out.push({ date: d.value, close: v.value });
  }
  if (!out.length) throw importError("No usable price rows found.");
  return { rows: out, skipped };
}
