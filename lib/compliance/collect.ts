import { prisma } from "@/lib/prisma";
import { listExercises } from "@/lib/company/exercises-data";
import { vestedOn } from "@/lib/company/grants";
import { termsOf } from "@/lib/company/grants-data";
import { computeClientLedger, dayStart } from "@/lib/advisor/tax/ledger-data";
import { deadlineKey } from "@/lib/advisor/tax/reminders";
import { buildClientReport } from "@/lib/fx/data";
import {
  addDays,
  advanceTaxDates,
  finalise,
  fyBounds,
  fyLabelOf,
  isoDay,
  itrDueDate,
  type CalendarItem,
} from "@/lib/compliance/calendar";

const WINDOW_BACK_DAYS = 180;
const WINDOW_AHEAD_DAYS = 400;

function inWindow(due: Date, today: Date) {
  return due.getTime() >= addDays(today, -WINDOW_BACK_DAYS).getTime() && due.getTime() <= addDays(today, WINDOW_AHEAD_DAYS).getTime();
}

/**
 * What the calendar shows: the next ~13 months, the last 6 months, and any
 * unfinished MCA filing or stale valuation however old (still to be fixed).
 */
function keep(i: CalendarItem, today: Date) {
  const due = new Date(`${i.due}T00:00:00Z`);
  if (due.getTime() > addDays(today, WINDOW_AHEAD_DAYS).getTime()) return false;
  if (!i.done && (i.category === "MCA" || i.category === "VALUATION")) return true;
  return inWindow(due, today);
}

async function manualDone(ownerId: string) {
  const rows = await prisma.complianceDone.findMany({ where: { ownerId }, select: { itemKey: true, doneOn: true } });
  return new Map<string, string>(rows.map((r) => [r.itemKey, isoDay(r.doneOn)] as [string, string]));
}

const nf = (n: number) => n.toLocaleString("en-IN");

/* ------------------------------------------------------------------ */
/* Startup Equity Desk                                                 */
/* ------------------------------------------------------------------ */

export async function collectDesk(
  workspace: { id: string; name: string; jurisdiction: string; fmvValuationDate: Date | null },
  today = new Date()
) {
  const j: "IN" | "US" = workspace.jurisdiction === "US" ? "US" : "IN";
  const us = j === "US";
  const t0 = dayStart(today);
  const items: CalendarItem[] = [];

  // 1. Filings created by exercises (W2a).
  const { exercises } = await listExercises(workspace.id, j);
  for (const e of exercises) {
    for (const o of e.obligations) {
      if (!o.due || o.status === "INFO") continue;
      items.push({
        key: `ex:${e.id}:${o.code}`,
        category: o.code === "TDS" || o.code.startsWith("F3921") ? "TAX" : "MCA",
        subject: `${e.employeeName} · ${nf(e.options)} options exercised ${e.exerciseDate}`,
        title: o.label,
        detail: o.note,
        due: o.due,
        done: o.done,
        href: "/company?tab=EXERCISES",
      });
    }
  }

  // 2. MGT-14 for the special resolution approving the scheme (India).
  if (!us) {
    const schemes = await prisma.esopScheme.findMany({
      where: { workspaceId: workspace.id, archivedAt: null, shareholderApprovedOn: { not: null } },
      select: { id: true, name: true, shareholderApprovedOn: true, mgt14FiledOn: true },
    });
    for (const s of schemes) {
      const passed = s.shareholderApprovedOn as Date;
      items.push({
        key: `scheme:${s.id}:mgt14`,
        category: "MCA",
        subject: `${s.name} (special resolution ${isoDay(passed)})`,
        title: "File MGT-14 for the special resolution",
        detail: "Within 30 days of passing the special resolution approving the ESOP scheme (s.117; verify). Record the filing date on the ESOP pool tab.",
        due: isoDay(addDays(passed, 30)),
        done: s.mgt14FiledOn ? isoDay(s.mgt14FiledOn) : null,
        href: "/company?tab=POOL",
      });
    }
  }

  // 3. Leavers' exercise windows and 4. option expiries.
  const grants = await prisma.optionGrant.findMany({
    where: { workspaceId: workspace.id, status: { in: ["ISSUED", "ACCEPTED", "LEFT"] } },
  });
  let anyVested = false;
  for (const g of grants) {
    const terms = termsOf(g);
    const vestAsOf = g.leftOn && g.leftOn.getTime() < t0.getTime() ? g.leftOn : t0;
    const vestedLeft = Math.max(0, vestedOn(terms, vestAsOf) - g.optionsExercised);
    if (vestedLeft > 0) anyVested = true;
    if (g.status === "LEFT" && g.leftOn) {
      const ends = addDays(g.leftOn, g.postExitDays);
      items.push({
        key: `grant:${g.id}:window`,
        category: "ESOP",
        subject: `${g.employeeName} (left ${isoDay(g.leftOn)})`,
        title: "Exercise window after leaving ends",
        detail:
          vestedLeft > 0
            ? `${nf(vestedLeft)} vested options lapse if not exercised by this date. Afterwards use "Lapse remaining options" on the grant so they return to the pool.`
            : `No vested options left to exercise. Use "Lapse remaining options" on the grant once the window ends.`,
        due: isoDay(ends),
        done: null,
        href: "/company?tab=GRANTS",
      });
    }
    if (g.expiryDate && vestedLeft > 0 && g.status !== "LEFT") {
      items.push({
        key: `grant:${g.id}:expiry`,
        category: "ESOP",
        subject: g.employeeName,
        title: "Options expire",
        detail: `${nf(vestedLeft)} vested, unexercised options expire on this date if not exercised.`,
        due: isoDay(g.expiryDate),
        done: null,
        href: "/company?tab=GRANTS",
      });
    }
  }

  // 5. Valuation freshness for exercises.
  if (workspace.fmvValuationDate && anyVested) {
    const v = workspace.fmvValuationDate;
    items.push({
      key: `fmv:${isoDay(v)}`,
      category: "VALUATION",
      subject: `${workspace.name} (valuation of ${isoDay(v)})`,
      title: us ? "409A valuation is 12 months old" : "Valuation too old for exercises",
      detail: us
        ? "A 409A valuation is generally relied on for up to 12 months or until a material event; refresh it before new grants (verify)."
        : "For an exercise, the perquisite uses a merchant banker valuation dated on, or up to 180 days before, the exercise date (verify). Get a fresh valuation before any exercise after this date.",
      due: isoDay(us ? addDays(v, 365) : addDays(v, 180)),
      done: null,
      href: "/company?tab=DETAILS",
    });
  }

  const done = await manualDone(workspace.id);
  return finalise(
    items.filter((i) => keep(i, t0)),
    done,
    today
  );
}

/* ------------------------------------------------------------------ */
/* Advisor Console                                                     */
/* ------------------------------------------------------------------ */

export async function collectFirm(firm: { id: string }, today = new Date()) {
  const t0 = dayStart(today);
  const items: CalendarItem[] = [];

  const clients = await prisma.clientCompany.findMany({
    where: { firmId: firm.id, archivedAt: null },
    select: {
      id: true,
      name: true,
      resolutions: { where: { kind: "SHAREHOLDER_SCHEME_APPROVAL" }, select: { id: true, vote: true, passedOn: true, mgt14Filed: true } },
      valuations: { orderBy: { valuationDate: "desc" }, take: 1, select: { valuationDate: true } },
      grants: {
        where: { status: { in: ["ACTIVE", "LEFT"] } },
        select: { id: true, employeeName: true, status: true, leftOn: true, postExitExerciseDays: true, expiryDate: true },
      },
      exercises: {
        where: { allotmentDate: { not: null } },
        select: { id: true, allotmentDate: true, pas3FiledOn: true, optionsExercised: true, grant: { select: { employeeName: true } } },
      },
    },
  });

  for (const c of clients) {
    const href = `/advisor/${c.id}`;

    // TDS and other ledger deadlines (already reminded by the tax-event ledger).
    try {
      const ledger = await computeClientLedger(c.id, t0);
      // PAS-3 dates already listed from the exercise register (below) for this client.
      const registerPas3 = new Set(
        c.exercises.map((e) => isoDay(addDays(e.allotmentDate as Date, 30)))
      );
      for (const d of ledger.deadlines) {
        const isPas3 = d.code === "PAS3" || /PAS[\s-]?3/i.test(d.label);
        if (isPas3 && registerPas3.has(isoDay(d.dueDate))) continue;
        items.push({
          key: `tax:${c.id}:${deadlineKey(d)}`,
          category: isPas3 ? "MCA" : "TAX",
          subject: `${c.name} · ${d.employeeName}`,
          title: d.label,
          detail: `Responsibility: ${d.owner}. From the client's tax-event ledger.`,
          due: isoDay(d.dueDate),
          done: null,
          href,
          remindedElsewhere: true,
        });
      }
    } catch (error) {
      console.error("[calendar] ledger failed for client", c.id, error);
    }

    for (const r of c.resolutions) {
      if (r.vote !== "SPECIAL") continue;
      items.push({
        key: `res:${r.id}:mgt14`,
        category: "MCA",
        subject: `${c.name} (scheme special resolution ${isoDay(r.passedOn)})`,
        title: "File MGT-14 for the special resolution",
        detail: "Within 30 days of passing the special resolution approving the ESOP scheme (s.117; verify).",
        due: isoDay(addDays(r.passedOn, 30)),
        done: r.mgt14Filed ? isoDay(r.mgt14Filed) : null,
        href,
      });
    }

    for (const e of c.exercises) {
      const allot = e.allotmentDate as Date;
      items.push({
        key: `rex:${e.id}:pas3`,
        category: "MCA",
        subject: `${c.name} · ${e.grant.employeeName} (${nf(e.optionsExercised)} shares allotted ${isoDay(allot)})`,
        title: "File PAS-3 (return of allotment)",
        detail: "Within 30 days of allotment (verify).",
        due: isoDay(addDays(allot, 30)),
        done: e.pas3FiledOn ? isoDay(e.pas3FiledOn) : null,
        href,
      });
    }

    for (const g of c.grants) {
      if (g.status === "LEFT" && g.leftOn && g.postExitExerciseDays != null) {
        items.push({
          key: `rg:${g.id}:window`,
          category: "ESOP",
          subject: `${c.name} · ${g.employeeName} (left ${isoDay(g.leftOn)})`,
          title: "Exercise window after leaving ends",
          detail: "Vested options not exercised by this date lapse under the scheme (check the scheme terms).",
          due: isoDay(addDays(g.leftOn, g.postExitExerciseDays)),
          done: null,
          href,
        });
      }
      if (g.status === "ACTIVE" && g.expiryDate) {
        items.push({
          key: `rg:${g.id}:expiry`,
          category: "ESOP",
          subject: `${c.name} · ${g.employeeName}`,
          title: "Options expire",
          detail: "Unexercised options expire on this date.",
          due: isoDay(g.expiryDate),
          done: null,
          href,
        });
      }
    }

    const latest = c.valuations[0];
    if (latest && c.grants.length) {
      items.push({
        key: `cv:${c.id}:${isoDay(latest.valuationDate)}`,
        category: "VALUATION",
        subject: `${c.name} (valuation of ${isoDay(latest.valuationDate)})`,
        title: "Valuation too old for exercises",
        detail: "For an exercise, the perquisite uses a merchant banker valuation dated on, or up to 180 days before, the exercise date (verify).",
        due: isoDay(addDays(latest.valuationDate, 180)),
        done: null,
        href,
      });
    }
  }

  // Individuals with foreign shares (Foreign Equity Tax Pack).
  const fxClients = await prisma.fxClient.findMany({ where: { firmId: firm.id, archivedAt: null } });
  const currentFy = fyLabelOf(t0);
  const prevFy = fyLabelOf(addDays(fyBounds(currentFy).start, -1));
  for (const fc of fxClients) {
    try {
      const { txns, report } = await buildClientReport(firm.id, fc);
      if (txns.length === 0) continue;
      const href = `/advisor/foreign/${fc.id}`;
      for (const fy of [prevFy, currentFy]) {
        const { start, end } = fyBounds(fy);
        const incomeDates = [
          ...report.pieces.filter((p) => p.fy === fy).map((p) => p.soldOn),
          ...report.dividends.filter((d) => d.fy === fy && d.kind === "DIVIDEND").map((d) => d.date),
        ].sort((a, b) => a.getTime() - b.getTime());
        const gains = report.gainsByFy.find((g) => g.fy === fy);
        const divs = report.dividendsByFy.find((d) => d.fy === fy);

        if (incomeDates.length) {
          for (const a of advanceTaxDates(fy, incomeDates[0])) {
            items.push({
              key: `fx:${fc.id}:adv:${fy}:${isoDay(a.date)}`,
              category: "TAX",
              subject: `${fc.name} (FY ${fy})`,
              title: `Advance tax instalment (${a.share} of the year's tax)`,
              detail: `Capital gains${divs && divs.grossInr > 0 ? " and foreign dividends" : ""} in FY ${fy}${
                gains ? ` (estimated tax on gains ${nf(Math.round(gains.estimatedTax.shortTerm + gains.estimatedTax.longTerm))})` : ""
              }. Gains arising after an instalment date are covered by the later instalments (verify).`,
              due: isoDay(a.date),
              done: null,
              href,
            });
          }
        }

        const hadAnything = txns.some((t) => t.date.getTime() <= end.getTime());
        if (hadAnything && start.getTime() <= t0.getTime()) {
          items.push({
            key: `fx:${fc.id}:itr:${fy}`,
            category: "TAX",
            subject: `${fc.name} (FY ${fy})`,
            title: "File ITR with foreign assets and income",
            detail: `Schedule FA (foreign shares held at any time in calendar year ${end.getUTCFullYear() - 1})${incomeDates.length ? ", Schedule CG / OS" : ""}${
              divs && divs.taxWithheldInr > 0 ? ", FSI and TR" : ""
            }. Due date for individuals without a tax audit (verify extensions).`,
            due: isoDay(itrDueDate(fy)),
            done: null,
            href,
          });
        }

        if (divs && divs.taxWithheldInr > 0) {
          items.push({
            key: `fx:${fc.id}:f67:${fy}`,
            category: "TAX",
            subject: `${fc.name} (FY ${fy})`,
            title: "File Form 67 for foreign tax credit",
            detail: `Foreign tax withheld of ${nf(Math.round(divs.taxWithheldInr))} in FY ${fy}. File Form 67 on or before filing the return to claim the credit (verify).`,
            due: isoDay(itrDueDate(fy)),
            done: null,
            href,
          });
        }
      }
    } catch (error) {
      console.error("[calendar] fx client failed", fc.id, error);
    }
  }

  const done = await manualDone(firm.id);
  return finalise(
    items.filter((i) => keep(i, t0)),
    done,
    today
  );
}
