import ExcelJS from "exceljs";

import type { ExerciseListRow } from "@/lib/company/exercises-data";

function header(ws: ExcelJS.Worksheet) {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12203F" } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 32;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

const STATUS: Record<string, string> = { DONE: "Done", OVERDUE: "OVERDUE", DUE: "Due", TODO: "To do", INFO: "Note" };

export async function buildExercisesWorkbook(companyName: string, jurisdiction: "IN" | "US", rows: ExerciseListRow[]) {
  const us = jurisdiction === "US";
  const money = us ? '"$"#,##0.00' : '"Rs." #,##0.00';
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();

  const ex = wb.addWorksheet(us ? "Exercises & issuance" : "Exercises & allotment");
  ex.columns = [
    { header: "Employee", key: "name", width: 24 },
    { header: "Email", key: "email", width: 26 },
    { header: us ? "Plan" : "Scheme", key: "scheme", width: 18 },
    ...(us ? [{ header: "Option type", key: "type", width: 10 }] : []),
    { header: "Grant date", key: "grantDate", width: 12 },
    { header: "Exercise date", key: "exDate", width: 12 },
    { header: "Options exercised", key: "options", width: 11 },
    { header: us ? "Strike price" : "Exercise price", key: "price", width: 12, style: { numFmt: money } },
    { header: "Amount payable", key: "payable", width: 14, style: { numFmt: money } },
    { header: us ? "FMV per share on exercise" : "Value per share on exercise (FMV)", key: "fmv", width: 14, style: { numFmt: money } },
    { header: us ? "Spread" : "Perquisite", key: "perq", width: 14, style: { numFmt: money } },
    { header: us ? "Issue date" : "Allotment date", key: "allot", width: 12 },
    { header: "Class", key: "class", width: 16 },
    ...(us
      ? [
          { header: "Form 3921 Copy B", key: "f3921b", width: 13 },
          { header: "Form 3921 Copy A", key: "f3921a", width: 13 },
        ]
      : [
          { header: "PAS-3 filed", key: "pas3", width: 12 },
          { header: "PAS-3 SRN", key: "srn", width: 14 },
          { header: "Certificate / demat", key: "cert", width: 12 },
          { header: "TDS deferred", key: "deferred", width: 9 },
          { header: "TDS amount", key: "tds", width: 12, style: { numFmt: money } },
          { header: "TDS deducted", key: "tdsDed", width: 12 },
          { header: "TDS deposited", key: "tdsDep", width: 12 },
          { header: "Challan", key: "challan", width: 14 },
        ]),
    { header: "Open items", key: "open", width: 60 },
  ];
  header(ex);
  for (const r of rows) {
    const open = r.obligations
      .filter((o) => o.status !== "DONE")
      .map((o) => `${STATUS[o.status]}: ${o.label}${o.due ? ` (by ${o.due})` : ""}`)
      .join("; ");
    ex.addRow({
      name: r.employeeName,
      email: r.employeeEmail ?? "",
      scheme: r.schemeName,
      type: r.usOptionType ?? "",
      grantDate: r.grantDate,
      exDate: r.exerciseDate,
      options: r.options,
      price: r.exercisePrice,
      payable: r.amountPayable,
      fmv: r.fmvPerShare,
      perq: r.perquisite,
      allot: r.allotmentDate ?? "",
      class: r.className ?? "",
      f3921b: r.form3921FurnishedOn ?? "",
      f3921a: r.form3921FiledOn ?? "",
      pas3: r.pas3FiledOn ?? "",
      srn: r.pas3Srn ?? "",
      cert: r.shareCertificateOn ?? "",
      deferred: r.tdsDeferred ? "Yes" : "No",
      tds: r.tdsAmount,
      tdsDed: r.tdsDeductedOn ?? "",
      tdsDep: r.tdsDepositedOn ?? "",
      challan: r.tdsChallanRef ?? "",
      open,
    }).alignment = { wrapText: true, vertical: "top" };
  }

  if (us) {
    const f = wb.addWorksheet("Form 3921 data");
    f.columns = [
      { header: "Calendar year of exercise", key: "year", width: 12 },
      { header: "Employee name", key: "name", width: 24 },
      { header: "Employee address and TIN (from payroll records)", key: "tin", width: 30 },
      { header: "Box 1: Date option granted", key: "b1", width: 14 },
      { header: "Box 2: Date option exercised", key: "b2", width: 14 },
      { header: "Box 3: Exercise price per share", key: "b3", width: 14, style: { numFmt: money } },
      { header: "Box 4: FMV per share on exercise date", key: "b4", width: 16, style: { numFmt: money } },
      { header: "Box 5: Number of shares transferred", key: "b5", width: 14 },
      { header: "Box 6: If other than transferor, corporation name, address, EIN", key: "b6", width: 30 },
      { header: "Copy B to employee (due 31 Jan)", key: "cb", width: 14 },
      { header: "Copy A to IRS (due 31 Mar e-file)", key: "ca", width: 14 },
    ];
    header(f);
    for (const r of rows.filter((x) => x.usOptionType === "ISO")) {
      f.addRow({
        year: r.exerciseDate ? Number(r.exerciseDate.slice(0, 4)) : "",
        name: r.employeeName,
        tin: "",
        b1: r.grantDate,
        b2: r.exerciseDate,
        b3: r.exercisePrice,
        b4: r.fmvPerShare,
        b5: r.options,
        b6: "",
        cb: r.form3921FurnishedOn ?? "",
        ca: r.form3921FiledOn ?? "",
      });
    }
    f.addRow([]);
    f.addRow([`${companyName}: one Form 3921 per ISO exercise. Transferor (company) name, address and EIN go on every form. Verify against the IRS instructions for Forms 3921 and 3922.`]).font = { italic: true, color: { argb: "FF64748B" } };
  } else {
    ex.addRow([]);
    ex.addRow([
      `${companyName}: PAS-3 within 30 days of allotment with the list of allottees; perquisite = (value per share on exercise - exercise price) x shares, taxed as salary with TDS deposited by the 7th of the next month (30 April for March) unless the start-up has the IMB certificate and defers it. Verify with your CS / CA.`,
    ]).font = { italic: true, color: { argb: "FF64748B" } };
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}
