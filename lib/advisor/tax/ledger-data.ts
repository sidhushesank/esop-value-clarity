/**
 * Database layer for the Tax-Event Ledger.
 *
 * Loads employees, events and valuations for one client, runs the pure
 * engine, and (when asked) stores each event's result in the append-only
 * audit table. Callers must already have confirmed the client belongs to
 * the signed-in firm (requireClientInFirm) before calling anything here.
 */

import { prisma } from "@/lib/prisma";

import {
  buildLedger,
  type CompanyInput,
  type Deadline,
  type EmployeeInput,
  type EventInput,
  type EventResult,
  type Ledger,
  type RuleVerification,
  type ValuationInput,
} from "./engine";
import { TAX_RULE_SEEDS, TAX_RULE_SET_VERSION } from "./rules";

/* ------------------------------------------------------------------ */
/* Rule verification                                                   */
/* ------------------------------------------------------------------ */

/**
 * Insert any missing rules and refresh descriptive text. Never touches
 * `verified`, so a founder's decision survives deploys.
 */
export async function syncTaxRules() {
  for (const seed of TAX_RULE_SEEDS) {
    await prisma.taxRule.upsert({
      where: { code: seed.code },
      create: {
        code: seed.code,
        title: seed.title,
        source: seed.source,
        notes: seed.note,
        verified: false,
      },
      update: {
        title: seed.title,
        source: seed.source,
        notes: seed.note,
      },
    });
  }

  return prisma.taxRule.findMany({ orderBy: { code: "asc" } });
}

export async function loadVerification(): Promise<RuleVerification> {
  const rows = await prisma.taxRule.findMany({
    select: { code: true, verified: true },
  });

  const map: RuleVerification = {};
  for (const r of rows) map[r.code] = r.verified;
  return map;
}

/* ------------------------------------------------------------------ */
/* Ledger for a whole client                                           */
/* ------------------------------------------------------------------ */

export type EmployeeLedger = {
  employee: {
    id: string;
    name: string;
    employeeRef: string | null;
    pan: string | null;
    regime: "NEW" | "OLD";
    estimatedIncomeExclPerq: number;
    monthlyNetPay: number | null;
    isPromoter: boolean;
  };
  ledger: Ledger;
};

export type ClientDeadline = Deadline & {
  employeeId: string;
  employeeName: string;
};

export type ClientLedger = {
  clientId: string;
  asOf: Date;
  ruleSetVersion: string;
  deferralEligible: boolean;
  employees: EmployeeLedger[];
  deadlines: ClientDeadline[];
  /** Rule codes used anywhere in the ledger that are not yet verified. */
  unverifiedRules: string[];
};

export function dayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function computeClientLedger(
  clientId: string,
  asOf: Date,
  options: { persist?: boolean } = {}
): Promise<ClientLedger> {
  const [client, employees, events, valuations, verification] =
    await Promise.all([
      prisma.clientCompany.findUnique({
        where: { id: clientId },
        select: { dpiitRecognised: true, imbCertificate: true },
      }),
      prisma.taxEmployee.findMany({
        where: { clientId, archivedAt: null },
        orderBy: { name: "asc" },
      }),
      prisma.taxEvent.findMany({
        where: { clientId },
        orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.clientValuation.findMany({
        where: { clientId },
        select: { id: true, valuationDate: true, fmvPerShare: true },
      }),
      loadVerification(),
    ]);

  const company: CompanyInput = {
    deferralEligible:
      client?.dpiitRecognised === true && client?.imbCertificate === true,
    listed: false,
  };

  const valuationInputs: ValuationInput[] = valuations.map((v) => ({
    id: v.id,
    valuationDate: v.valuationDate,
    fmvPerShare: v.fmvPerShare,
  }));

  const out: EmployeeLedger[] = [];
  const deadlines: ClientDeadline[] = [];
  const used = new Set<string>();

  for (const emp of employees) {
    const input: EmployeeInput = {
      id: emp.id,
      name: emp.name,
      regime: emp.regime,
      estimatedIncomeExclPerq: emp.estimatedIncomeExclPerq,
      monthlyNetPay: emp.monthlyNetPay,
      isPromoter: emp.isPromoter,
    };

    const evInputs: EventInput[] = events
      .filter((e) => e.employeeId === emp.id)
      .map((e) => ({
        id: e.id,
        type: e.type,
        eventDate: e.eventDate,
        shares: e.shares,
        exercisePrice: e.exercisePrice ?? undefined,
        valuationId: e.valuationId,
        pricePerShare: e.pricePerShare ?? undefined,
        lotId: e.lotEventId,
      }));

    const ledger = buildLedger(
      input,
      company,
      valuationInputs,
      evInputs,
      verification,
      asOf
    );

    for (const r of ledger.results) {
      for (const rule of r.audit.rules) {
        if (!rule.verified) used.add(rule.code);
      }
    }

    for (const d of ledger.deadlines) {
      deadlines.push({ ...d, employeeId: emp.id, employeeName: emp.name });
    }

    out.push({
      employee: {
        id: emp.id,
        name: emp.name,
        employeeRef: emp.employeeRef,
        pan: emp.pan,
        regime: emp.regime,
        estimatedIncomeExclPerq: emp.estimatedIncomeExclPerq,
        monthlyNetPay: emp.monthlyNetPay,
        isPromoter: emp.isPromoter,
      },
      ledger,
    });
  }

  deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  if (options.persist) {
    await persistComputations(clientId, out);
  }

  return {
    clientId,
    asOf,
    ruleSetVersion: TAX_RULE_SET_VERSION,
    deferralEligible: company.deferralEligible,
    employees: out,
    deadlines,
    unverifiedRules: Array.from(used).sort(),
  };
}

/* ------------------------------------------------------------------ */
/* Audit trail                                                         */
/* ------------------------------------------------------------------ */

/** Stores each event's result unless it is identical to the latest stored one. */
async function persistComputations(
  clientId: string,
  employees: EmployeeLedger[]
): Promise<void> {
  for (const e of employees) {
    for (const r of e.ledger.results) {
      const json = JSON.parse(JSON.stringify(r)) as EventResult;

      const last = await prisma.taxComputation.findFirst({
        where: { eventId: r.eventId },
        orderBy: { createdAt: "desc" },
        select: { result: true, ruleSetVersion: true },
      });

      if (
        last &&
        last.ruleSetVersion === TAX_RULE_SET_VERSION &&
        JSON.stringify(last.result) === JSON.stringify(json)
      ) {
        continue;
      }

      await prisma.taxComputation.create({
        data: {
          clientId,
          eventId: r.eventId,
          ruleSetVersion: TAX_RULE_SET_VERSION,
          result: json as unknown as object,
        },
      });
    }
  }
}