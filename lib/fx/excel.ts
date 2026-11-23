import ExcelJS from "exceljs";

import { CG_BUCKETS, iso, type FxReport, type FxTxn } from "@/lib/fx/engine";

const INR = '"Rs." #,##0';
const NUM = "#,##0.####";
const USD = '"$"#,##0.00##';

function header(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12203F" } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 30;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

function note(ws: ExcelJS.Worksheet, text: string) {
  ws.addRow([]);
  ws.addRow([text]).font = { italic: true, color: { argb: "FF64748B" } };
}

const r0 = (n: number | null) => (n === null ? null : Math.round(n));

export async function buildFxWorkbook(input: {
  firmName: string;
  clientName: string;
  settings: { costRateRule: string; saleRateRule: string; dividendRateRule: string; slabRate: number };
  txns: FxTxn[];
  report: FxReport;
}): Promise<Uint8Array> {
  const { report: r } = input;
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();

  /* Summary */
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 46 }, { width: 22 }, { width: 22 }, { width: 22 }];
  sum.addRow([`${input.clientName}: foreign equity tax workings`]).font = { bold: true, size: 14 };
  sum.addRow([`Prepared by ${input.firmName} with ESOP Value Clarity on ${new Date().toISOString().slice(0, 10)}`]);
  sum.addRow([
    `Rate rules: cost ${input.settings.costRateRule}, sale ${input.settings.saleRateRule}, dividend ${input.settings.dividendRateRule}. Slab rate used for estimates: ${Math.round(input.settings.slabRate * 100)}%.`,
  ]);
  sum.addRow([]);
  sum.addRow(["Capital gains by financial year", "Short-term gain", "Long-term gain", "Estimated tax"]).font = { bold: true };
  for (const g of r.gainsByFy) {
    const row = sum.addRow([
      `FY ${g.fy}${g.incomplete ? " (incomplete: see Warnings)" : ""}`,
      r0(g.shortTerm.gain),
      r0(g.longTerm.gain),
      r0(g.estimatedTax.shortTerm + g.estimatedTax.longTerm),
    ]);
    [2, 3, 4].forEach((c) => (row.getCell(c).numFmt = INR));
  }
  sum.addRow([]);
  sum.addRow(["Dividends by financial year", "Gross dividend", "Foreign tax withheld", "FTC estimate"]).font = { bold: true };
  for (const d of r.dividendsByFy) {
    const row = sum.addRow([`FY ${d.fy}${d.incomplete ? " (incomplete)" : ""}`, r0(d.grossInr), r0(d.taxWithheldInr), r0(d.ftcEstimateInr)]);
    [2, 3, 4].forEach((c) => (row.getCell(c).numFmt = INR));
  }
  sum.addRow([]);
  sum.addRow(["Shares still held", "Shares"]).font = { bold: true };
  for (const h of r.holdings) sum.addRow([`${h.symbol} (${h.company})`, h.shares]).getCell(2).numFmt = NUM;
  note(
    sum,
    "Estimates for a CA to review, not tax advice. Long-term = held more than 24 months (foreign shares count as unlisted in India), taxed at 12.5% + 4% cess; short-term at the slab rate shown; surcharge, set-off of losses and other income are ignored (verify)."
  );
  sum.addRow([
    "Data: SBI TT buying rates from the public SBI FX RateKeeper archive (github.com/sahilgupta/sbi-fx-ratekeeper) unless your firm uploaded its own; share prices and splits from Yahoo Finance (split-adjusted closes). Share counts are shown in today's shares after any split.",
  ]).font = { italic: true, color: { argb: "FF64748B" } };

  /* Capital gains (Schedule CG) */
  const cg = wb.addWorksheet("Capital gains (CG)");
  cg.columns = [
    { header: "FY", key: "fy", width: 10 },
    { header: "Term", key: "term", width: 12 },
    { header: "CG date bucket", key: "bucket", width: 18 },
    { header: "Symbol", key: "symbol", width: 10 },
    { header: "Company", key: "company", width: 24 },
    { header: "Broker", key: "broker", width: 16 },
    { header: "Lot", key: "lot", width: 22 },
    { header: "Acquired on", key: "acq", width: 13 },
    { header: "Sold on", key: "sold", width: 13 },
    { header: "Months held", key: "months", width: 10 },
    { header: "Shares", key: "qty", width: 10, style: { numFmt: NUM } },
    { header: "Sale price (USD)", key: "price", width: 14, style: { numFmt: USD } },
    { header: "TTBR used", key: "rate", width: 11 },
    { header: "Rate date", key: "rateDate", width: 12 },
    { header: "Full value of consideration (INR)", key: "proceeds", width: 18, style: { numFmt: INR } },
    { header: "Transfer expenses (INR)", key: "fees", width: 14, style: { numFmt: INR } },
    { header: "Cost of acquisition (INR)", key: "cost", width: 16, style: { numFmt: INR } },
    { header: "Gain (INR)", key: "gain", width: 15, style: { numFmt: INR } },
  ];
  header(cg);
  for (const p of r.pieces) {
    cg.addRow({
      fy: p.fy,
      term: p.longTerm ? "Long-term" : "Short-term",
      bucket: p.bucket,
      symbol: p.symbol,
      company: p.company,
      broker: p.broker,
      lot: p.lotRef,
      acq: iso(p.acquiredOn),
      sold: iso(p.soldOn),
      months: p.holdingMonths,
      qty: p.quantity,
      price: p.salePriceUsd,
      rate: p.saleRate?.ttbr ?? "missing",
      rateDate: p.saleRate?.rateDate ?? "",
      proceeds: r0(p.proceedsInr),
      fees: r0(p.feesInr),
      cost: r0(p.costInr),
      gain: r0(p.gainInr),
    });
  }
  cg.addRow([]);
  cg.addRow(["FY", "Term", ...CG_BUCKETS]).font = { bold: true };
  for (const g of r.gainsByFy) {
    for (const term of ["shortTerm", "longTerm"] as const) {
      const row = cg.addRow([g.fy, term === "shortTerm" ? "Short-term" : "Long-term", ...CG_BUCKETS.map((b) => r0(g.byBucket[b][term]))]);
      for (let c = 3; c <= 7; c++) row.getCell(c).numFmt = INR;
    }
  }
  note(cg, "One row per lot sold (sales matched to the named lot, else oldest first). Bucket table = gains by date of transfer as asked in Schedule CG.");

  /* Schedule FA A3 */
  const a3 = wb.addWorksheet("Schedule FA - A3");
  a3.columns = [
    { header: "Calendar year", key: "year", width: 10 },
    { header: "Country", key: "country", width: 10 },
    { header: "Name of entity", key: "company", width: 26 },
    { header: "Nature of entity", key: "nature", width: 14 },
    { header: "Symbol", key: "symbol", width: 9 },
    { header: "Lot", key: "lot", width: 22 },
    { header: "Date of acquiring interest", key: "acq", width: 14 },
    { header: "Initial value of investment (INR)", key: "initial", width: 18, style: { numFmt: INR } },
    { header: "Peak value during the period (INR)", key: "peak", width: 18, style: { numFmt: INR } },
    { header: "Peak date", key: "peakDate", width: 12 },
    { header: "Closing balance (INR)", key: "closing", width: 16, style: { numFmt: INR } },
    { header: "Shares at 31 Dec", key: "shares", width: 11, style: { numFmt: NUM } },
    { header: "Gross proceeds from sale (INR)", key: "proceeds", width: 18, style: { numFmt: INR } },
    { header: "Missing data", key: "missing", width: 40 },
  ];
  header(a3);
  for (const l of r.faLots) {
    a3.addRow({
      year: l.year,
      country: "United States (verify)",
      company: l.company,
      nature: "Company",
      symbol: l.symbol,
      lot: l.lotRef,
      acq: iso(l.acquiredOn),
      initial: r0(l.initialValueInr),
      peak: r0(l.peakValueInr),
      peakDate: l.peakDate ?? "",
      closing: r0(l.closingValueInr),
      shares: l.sharesAtYearEnd,
      proceeds: r0(l.saleProceedsInr),
      missing: l.missing.join("; "),
    });
  }
  note(a3, "Calendar year (Jan-Dec), each value at SBI TTBR on its own date: acquisition date, peak date, 31 Dec, sale date. Peak uses daily closing prices you uploaded. Country and address: fill from the company's records (verify).");

  /* Schedule FA A2 */
  const a2 = wb.addWorksheet("Schedule FA - A2");
  a2.columns = [
    { header: "Calendar year", key: "year", width: 10 },
    { header: "Broker / custodian", key: "broker", width: 22 },
    { header: "Account", key: "account", width: 14 },
    { header: "Peak value of shares (INR)", key: "peak", width: 18, style: { numFmt: INR } },
    { header: "Peak date", key: "peakDate", width: 12 },
    { header: "Closing value of shares (INR)", key: "closing", width: 18, style: { numFmt: INR } },
    { header: "Gross amount credited: dividends + sale proceeds (INR)", key: "credited", width: 22, style: { numFmt: INR } },
    { header: "Missing data", key: "missing", width: 40 },
  ];
  header(a2);
  for (const a of r.faAccounts) {
    a2.addRow({
      year: a.year,
      broker: a.broker,
      account: a.account,
      peak: r0(a.peakValueInr),
      peakDate: a.peakDate ?? "",
      closing: r0(a.closingValueInr),
      credited: r0(a.grossCreditedInr),
      missing: a.missing.join("; "),
    });
  }
  note(a2, "Share value only: add any cash balance held in the account from the broker statement.");

  /* Dividends & FTC */
  const dv = wb.addWorksheet("Dividends & FTC");
  dv.columns = [
    { header: "FY", key: "fy", width: 10 },
    { header: "Date", key: "date", width: 12 },
    { header: "Kind", key: "kind", width: 14 },
    { header: "Symbol", key: "symbol", width: 10 },
    { header: "Broker", key: "broker", width: 16 },
    { header: "Amount", key: "amt", width: 12, style: { numFmt: USD } },
    { header: "Currency", key: "cur", width: 9 },
    { header: "TTBR used", key: "rate", width: 11 },
    { header: "Rate date", key: "rateDate", width: 12 },
    { header: "Amount (INR)", key: "inr", width: 14, style: { numFmt: INR } },
  ];
  header(dv);
  for (const d of r.dividends) {
    dv.addRow({
      fy: d.fy,
      date: iso(d.date),
      kind: d.kind === "DIVIDEND" ? "Dividend" : "Tax withheld",
      symbol: d.symbol,
      broker: d.broker,
      amt: d.amountUsd,
      cur: d.currency,
      rate: d.rate?.ttbr ?? "missing",
      rateDate: d.rate?.rateDate ?? "",
      inr: r0(d.amountInr),
    });
  }
  dv.addRow([]);
  dv.addRow(["FY", "", "Gross dividend (INR)", "", "", "Tax withheld (INR)", "", "Indian tax on it (est.)", "", "FTC estimate (INR)"]).font = { bold: true };
  for (const f of r.dividendsByFy) {
    const row = dv.addRow([f.fy, "", r0(f.grossInr), "", "", r0(f.taxWithheldInr), "", r0(f.indianTaxOnDividendInr), "", r0(f.ftcEstimateInr)]);
    [3, 6, 8, 10].forEach((c) => (row.getCell(c).numFmt = INR));
  }
  note(dv, "Dividends: Schedule OS / FSI. Tax withheld: Schedule TR and Form 67 (file Form 67 before the return). FTC = lower of foreign tax and Indian tax on that income (verify DTAA article and rate).");

  /* Lots */
  const lt = wb.addWorksheet("Lots");
  lt.columns = [
    { header: "Lot", key: "ref", width: 22 },
    { header: "Type", key: "type", width: 8 },
    { header: "Date", key: "date", width: 12 },
    { header: "Symbol", key: "symbol", width: 9 },
    { header: "Broker", key: "broker", width: 16 },
    { header: "Shares", key: "qty", width: 10, style: { numFmt: NUM } },
    { header: "Value / price per share (USD)", key: "price", width: 14, style: { numFmt: USD } },
    { header: "Value from", key: "vsrc", width: 16 },
    { header: "Cost per share (INR)", key: "cps", width: 14, style: { numFmt: '"Rs." #,##0.00' } },
    { header: "Cost basis", key: "src", width: 14 },
    { header: "TTBR", key: "rate", width: 10 },
    { header: "Shares left", key: "left", width: 10, style: { numFmt: NUM } },
  ];
  header(lt);
  for (const l of r.lots) {
    lt.addRow({
      ref: l.ref,
      type: l.type,
      date: iso(l.date),
      symbol: l.symbol,
      broker: l.broker,
      qty: l.quantity,
      price: l.priceUsd,
      vsrc: l.valueSource === "STATEMENT" ? "Statement" : l.valueSource === "MARKET_CLOSE" ? "Market close" : "Missing",
      cps: l.costInrPerShare,
      src:
        l.costSource === "FORM16"
          ? "Form 16 value"
          : l.costSource === "TTBR"
            ? "Value x TTBR"
            : l.costSource === "AT_SALE"
              ? "At each sale's rate"
              : l.costSource === "MISSING_VALUE"
                ? "Value missing"
                : "Rate missing",
      rate: l.rateUsed?.ttbr ?? "",
      left: l.remaining,
    });
  }

  /* Transactions */
  const tx = wb.addWorksheet("Transactions");
  tx.columns = [
    { header: "Type", key: "type", width: 13 },
    { header: "Date", key: "date", width: 12 },
    { header: "Symbol", key: "symbol", width: 9 },
    { header: "Company", key: "company", width: 22 },
    { header: "Broker", key: "broker", width: 16 },
    { header: "Account", key: "account", width: 12 },
    { header: "Quantity", key: "qty", width: 10, style: { numFmt: NUM } },
    { header: "Price (USD)", key: "price", width: 12, style: { numFmt: USD } },
    { header: "Amount (USD)", key: "amount", width: 12, style: { numFmt: USD } },
    { header: "Fees (USD)", key: "fees", width: 10, style: { numFmt: USD } },
    { header: "Currency", key: "cur", width: 9 },
    { header: "Lot ref", key: "lot", width: 18 },
    { header: "Cost INR per share (Form 16)", key: "cost", width: 16 },
  ];
  header(tx);
  for (const t of input.txns) {
    tx.addRow({
      type: t.type,
      date: iso(t.date),
      symbol: t.symbol,
      company: t.company ?? "",
      broker: t.broker ?? "",
      account: t.account ?? "",
      qty: t.quantity,
      price: t.priceUsd,
      amount: t.amountUsd,
      fees: t.feesUsd,
      cur: t.currency,
      lot: t.lotRef ?? "",
      cost: t.costInrPerShare,
    });
  }

  /* Rates used + warnings */
  const rt = wb.addWorksheet("Rates used");
  rt.columns = [
    { header: "Currency", key: "c", width: 10 },
    { header: "Date", key: "d", width: 12 },
    { header: "SBI TT buying rate", key: "r", width: 16 },
  ];
  header(rt);
  for (const x of r.ratesUsed) rt.addRow({ c: x.currency, d: x.date, r: x.ttbr });

  const wn = wb.addWorksheet("Warnings");
  wn.columns = [
    { header: "Level", key: "l", width: 10 },
    { header: "What to check", key: "m", width: 120 },
  ];
  header(wn);
  for (const w of r.warnings) wn.addRow({ l: w.level, m: w.message }).alignment = { wrapText: true };
  if (!r.warnings.length) wn.addRow({ l: "OK", m: "No problems found." });

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

/** Blank template for the transactions import. */
export async function buildFxTemplate(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Transactions");
  ws.columns = [
    { header: "Type", key: "type", width: 13 },
    { header: "Date", key: "date", width: 12 },
    { header: "Symbol", key: "symbol", width: 9 },
    { header: "Company", key: "company", width: 20 },
    { header: "Broker", key: "broker", width: 14 },
    { header: "Account", key: "account", width: 12 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Price per share (USD)", key: "price", width: 18 },
    { header: "Amount (USD)", key: "amount", width: 13 },
    { header: "Fees (USD)", key: "fees", width: 11 },
    { header: "Currency", key: "currency", width: 9 },
    { header: "Lot ref", key: "lot", width: 14 },
    { header: "Cost INR per share (Form 16)", key: "cost", width: 24 },
  ];
  header(ws);
  ws.addRow(["Vest", "15-03-2024", "GOOGL", "Alphabet Inc", "Schwab", "1234", 50, 142.5, "", "", "USD", "", ""]);
  ws.addRow(["Vest", "15-06-2024", "GOOGL", "Alphabet Inc", "Schwab", "1234", 50, "", "", "", "USD", "", ""]);
  ws.addRow(["ESPP", "30-06-2024", "MSFT", "Microsoft Corp", "Fidelity", "5678", 10, 380, "", "", "USD", "", ""]);
  ws.addRow(["Buy", "05-08-2024", "MSFT", "Microsoft Corp", "Fidelity", "5678", 4, 402.1, "", "", "USD", "", ""]);
  ws.addRow(["Sell", "10-06-2025", "GOOGL", "Alphabet Inc", "Schwab", "1234", 20, 175.25, "", 4.95, "USD", "", ""]);
  ws.addRow(["Dividend", "16-06-2025", "GOOGL", "Alphabet Inc", "Schwab", "1234", "", "", 6, "", "USD", "", ""]);
  ws.addRow(["Tax withheld", "16-06-2025", "GOOGL", "Alphabet Inc", "Schwab", "1234", "", "", 1.5, "", "USD", "", ""]);
  ws.addRow([]);
  ws.addRow(["Type: Vest (RSU release), ESPP or Exercise (cost = market value that day, the amount taxed as perquisite), Buy (market purchase, cost = price paid), Sell, Dividend, Tax withheld."]);
  ws.addRow(["Vest price = value per share at vest; leave blank to use that day's market close. A same-day 'sell to cover' is a Vest row plus a Sell row. Rows with other actions (wires, interest, journals) are skipped."]);
  ws.addRow(["Lot ref (optional): on a Sell row, the lot it came from if the broker shows it; otherwise oldest lots are used first. Cost INR per share (optional): the Form 16 perquisite value per share."]);
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}
