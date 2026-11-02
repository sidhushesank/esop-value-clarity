import ExcelJS from "exceljs";

import type { listGrants } from "@/lib/company/grants-data";
import { firstVestDate, fullyVestedDate } from "@/lib/company/grants";

type GrantRows = Awaited<ReturnType<typeof listGrants>>;

const HEADER_FILL = "FF12203F";
const DATE_FMT = "dd-mmm-yyyy";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft (not issued)",
  ISSUED: "Issued",
  ACCEPTED: "Accepted",
  LEFT: "Left company",
  LAPSED: "Lapsed",
  EXERCISED: "Exercised",
};

/**
 * Register of options, with the fields usually kept in the register of
 * employee stock options (Form SH-6). Column set is an aid; check the
 * statutory format with your CS (verify).
 */
export async function buildRegisterWorkbook(
  companyName: string,
  grants: GrantRows
): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESOP Value Clarity";
  wb.created = new Date();

  const ws = wb.addWorksheet("Options register");
  ws.columns = [
    { header: "Sr.", key: "sr", width: 6 },
    { header: "Employee", key: "name", width: 26 },
    { header: "Employee ref", key: "ref", width: 14 },
    { header: "Scheme", key: "scheme", width: 20 },
    { header: "Status", key: "status", width: 16 },
    { header: "Date of grant", key: "grantDate", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Options granted", key: "options", width: 14, style: { numFmt: "#,##0" } },
    { header: "Exercise price (Rs.)", key: "price", width: 16, style: { numFmt: "#,##0.00" } },
    { header: "Vesting start", key: "vestStart", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Vesting (months)", key: "vestMonths", width: 12 },
    { header: "Cliff (months)", key: "cliff", width: 12 },
    { header: "First vesting date", key: "firstVest", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Fully vested on", key: "fullVest", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Vested today", key: "vested", width: 12, style: { numFmt: "#,##0" } },
    { header: "Options exercised", key: "exercised", width: 12, style: { numFmt: "#,##0" } },
    { header: "Options lapsed", key: "lapsed", width: 12, style: { numFmt: "#,##0" } },
    { header: "Options outstanding", key: "outstanding", width: 14, style: { numFmt: "#,##0" } },
    { header: "Expiry date", key: "expiry", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Date of leaving", key: "left", width: 14, style: { numFmt: DATE_FMT } },
    { header: "Exercise window ends", key: "windowEnds", width: 16, style: { numFmt: DATE_FMT } },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 30;
  ws.views = [{ state: "frozen", ySplit: 1, xSplit: 2 }];

  const ordered = [...grants].sort((a, b) => a.grantDate.getTime() - b.grantDate.getTime());

  ordered.forEach((g, i) => {
    const terms = {
      grantDate: g.grantDate,
      options: g.options,
      exercisePrice: g.exercisePrice,
      vestingStart: g.vestingStart,
      vestingMonths: g.vestingMonths,
      cliffMonths: g.cliffMonths,
      expiryDate: g.expiryDate,
      postExitDays: g.postExitDays,
    };
    ws.addRow({
      sr: i + 1,
      name: g.employeeName,
      ref: g.employeeRef ?? "",
      scheme: g.scheme.name,
      status: STATUS_LABEL[g.status] ?? g.status,
      grantDate: g.grantDate,
      options: g.options,
      price: g.exercisePrice,
      vestStart: g.vestingStart,
      vestMonths: g.vestingMonths,
      cliff: g.cliffMonths,
      firstVest: firstVestDate(terms),
      fullVest: fullyVestedDate(terms),
      vested: g.position.vested,
      exercised: g.position.exercised,
      lapsed: g.position.lapsed,
      outstanding: g.position.outstanding,
      expiry: g.expiryDate ?? null,
      left: g.leftOn ?? null,
      windowEnds: g.position.exerciseWindowEnds ?? null,
    });
  });

  ws.addRow([]);
  ws.addRow([`${companyName}: register of options, generated ${new Date().toISOString().slice(0, 10)}.`]);
  ws.addRow([
    "Columns follow the fields usually kept in Form SH-6. Check the statutory format with your CS (verify). A record-keeping aid, not legal advice.",
  ]).font = { italic: true, color: { argb: "FF64748B" } };

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

export function registerFileName(companyName: string) {
  const safe = companyName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "company";
  return `${safe}-options-register-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
