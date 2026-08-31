"use client";

import { useMemo } from "react";

import {
  createDefaultOffer,
  normalizeOfferInput,
} from "@/lib/esop/offers/normalize";

import {
  analyzeOfferCompensation,
  getCTCRealitySummary,
} from "@/lib/esop/offers/compensation";

import {
  analyzeOfferEquity,
  getEquityRealitySummary,
} from "@/lib/esop/offers/equity";

import {
  compareOffers,
  getComparisonSnapshot,
} from "@/lib/esop/offers/compare";

import {
  analyzeAllOfferBreakEvens,
} from "@/lib/esop/offers/breakeven";

import {
  analyzeOfferNegotiation,
  getNegotiationAlternatives,
} from "@/lib/esop/offers/negotiation";

import type {
  OfferInput,
  OfferScenarioKey,
  OfferWinner,
} from "@/lib/esop/offers/types";

/* ============================================================
   FORMATTERS
============================================================ */

function money(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

function number(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(value)
      ? value
      : 0
  );
}

function percent(
  value: number
): string {
  return `${
    Number.isFinite(value)
      ? value.toFixed(2)
      : "0.00"
  }%`;
}

function winnerLabel(
  winner: OfferWinner
): string {
  if (winner === "A") {
    return "Offer A";
  }

  if (winner === "B") {
    return "Offer B";
  }

  if (winner === "TIE") {
    return "Tie";
  }

  return "Undetermined";
}

/* ============================================================
   FINAL CROSSOVER QA — OFFER A

   Established / listed company

   Headline CTC: ₹32.5L
   Fixed: ₹27L
   Variable: ₹2L
   Joining bonus: ₹1L

   RSUs:
   1,200 shares
   ₹400 current listed share price
   48-month vesting
   12-month cliff
   No exercise price
   No dilution

   Intent:
   - stronger guaranteed cash
   - higher liquidity
   - lower exercise burden
   - should lead early
============================================================ */

function buildOfferA(): OfferInput {
  const base =
    createDefaultOffer("A");

  return normalizeOfferInput(
    {
      ...base,

      id:
        "phase4-crossover-qa-offer-a",

      side:
        "A",

      currency:
        "INR",

      employer: {
        ...base.employer,

        companyName:
          "StableTech India Limited",

        roleTitle:
          "Senior Software Engineer",

        location:
          "Hyderabad",

        employmentType:
          "FULL_TIME",

        workMode:
          "HYBRID",

        joiningDate:
          "2026-10-01",
      },

      cash: {
        ...base.cash,

        headlineCTC:
          3_250_000,

        fixedSalary:
          2_700_000,

        basicSalary:
          1_080_000,

        hra:
          540_000,

        specialAllowance:
          1_080_000,

        targetVariablePay:
          200_000,

        maximumVariablePay:
          300_000,

        joiningBonus:
          100_000,

        employerPF:
          129_600,

        gratuity:
          51_923,

        insuranceValue:
          20_000,
      },

      equity: {
        ...base.equity,

        type:
          "RSU",

        companyStatus:
          "LISTED",

        employerHeadlineEquityValue:
          480_000,

        totalOptionsOrShares:
          1_200,

        exercisePrice:
          0,

        currentFMV:
          400,

        listedSharePrice:
          400,

        vestingDurationMonths:
          48,

        cliffMonths:
          12,

        vestingFrequency:
          "MONTHLY",

        expectedDilutionPercentage:
          0,

        bearEquityMultiplier:
          0.75,

        baseEquityMultiplier:
          1,

        bullEquityMultiplier:
          1.5,
      },

      benefits: {
        ...base.benefits,

        healthInsuranceValue:
          25_000,

        lifeInsuranceValue:
          10_000,

        learningBudgetValue:
          25_000,

        notes:
          "Illustrative crossover QA benefits.",
      },

      notes:
        "Phase 4 final crossover QA Offer A",
    },
    "A"
  );
}

/* ============================================================
   FINAL CROSSOVER QA — OFFER B

   Private startup

   Headline CTC: ₹34L
   Fixed: ₹24L
   Variable: ₹2L
   Joining bonus: ₹1L

   IMPORTANT:
   Joining bonus is intentionally equal to Offer A.

   This removes the artificial early crossover that previously
   happened because Offer B had ₹1L more upfront cash.

   ESOP:
   30,000 options
   ₹25 strike
   ₹100 current FMV
   48-month vesting
   12-month cliff
   25% expected dilution

   Scenario multipliers:
   Bear: 0.50×
   Base: 1.00×
   Bull: 3.00×

   Intent:
   - lower guaranteed cash
   - lower liquidity
   - higher equity risk
   - much larger equity exposure
   - Offer A should lead initially
   - Bull should favor Offer B much earlier
   - Base should test a later equity-driven crossover
   - Bear should be materially less favorable to Offer B
============================================================ */

function buildOfferB(): OfferInput {
  const base =
    createDefaultOffer("B");

  return normalizeOfferInput(
    {
      ...base,

      id:
        "phase4-crossover-qa-offer-b",

      side:
        "B",

      currency:
        "INR",

      employer: {
        ...base.employer,

        companyName:
          "RocketAI Private Limited",

        roleTitle:
          "Senior Software Engineer",

        location:
          "Bengaluru",

        employmentType:
          "FULL_TIME",

        workMode:
          "HYBRID",

        joiningDate:
          "2026-10-01",
      },

      cash: {
        ...base.cash,

        headlineCTC:
          3_400_000,

        fixedSalary:
          2_400_000,

        basicSalary:
          960_000,

        hra:
          480_000,

        specialAllowance:
          960_000,

        targetVariablePay:
          200_000,

        maximumVariablePay:
          300_000,

        /*
         * FINAL CROSSOVER QA:
         * Equal to Offer A so the crossover is not created by
         * an upfront joining-bonus advantage.
         */
        joiningBonus:
          100_000,

        employerPF:
          115_200,

        gratuity:
          46_154,

        insuranceValue:
          20_000,
      },

      equity: {
        ...base.equity,

        type:
          "ESOP",

        companyStatus:
          "UNLISTED",

        /*
         * Display / reality-check value only.
         *
         * The engine continues to model using the independently
         * available ₹100 FMV basis rather than blindly trusting
         * the employer headline value.
         */
        employerHeadlineEquityValue:
          3_000_000,

        /*
         * FINAL CROSSOVER QA:
         * Increased from 10,000 to 30,000.
         */
        totalOptionsOrShares:
          30_000,

        exercisePrice:
          25,

        currentFMV:
          100,

        listedSharePrice:
          0,

        companyValuation:
          1_000_000_000,

        totalCompanyShares:
          10_000_000,

        vestingDurationMonths:
          48,

        cliffMonths:
          12,

        vestingFrequency:
          "MONTHLY",

        expectedDilutionPercentage:
          25,

        bearEquityMultiplier:
          0.5,

        baseEquityMultiplier:
          1,

        bullEquityMultiplier:
          3,
      },

      benefits: {
        ...base.benefits,

        healthInsuranceValue:
          20_000,

        lifeInsuranceValue:
          10_000,

        learningBudgetValue:
          40_000,

        notes:
          "Illustrative crossover QA benefits.",
      },

      notes:
        "Phase 4 final crossover QA Offer B",
    },
    "B"
  );
}

/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

function Card({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>

      {note ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Phase 4 QA
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function OfferIntelligenceQAPage() {
  const qa =
    useMemo(() => {
      const offerA =
        buildOfferA();

      const offerB =
        buildOfferB();

      const compensationA =
        analyzeOfferCompensation(
          offerA
        );

      const compensationB =
        analyzeOfferCompensation(
          offerB
        );

      const ctcA =
        getCTCRealitySummary(
          offerA
        );

      const ctcB =
        getCTCRealitySummary(
          offerB
        );

      const equityA =
        analyzeOfferEquity(
          offerA
        );

      const equityB =
        analyzeOfferEquity(
          offerB
        );

      const equityRealityA =
        getEquityRealitySummary(
          offerA
        );

      const equityRealityB =
        getEquityRealitySummary(
          offerB
        );

      const comparison =
        compareOffers(
          offerA,
          offerB
        );

      const baseSnapshot =
        getComparisonSnapshot(
          comparison,
          "BASE"
        );

      const bearSnapshot =
        getComparisonSnapshot(
          comparison,
          "BEAR"
        );

      const bullSnapshot =
        getComparisonSnapshot(
          comparison,
          "BULL"
        );

      const breakEven =
        analyzeAllOfferBreakEvens(
          offerA,
          offerB
        );

      const negotiation =
        analyzeOfferNegotiation(
          offerA,
          offerB,
          24,
          "BASE"
        );

      const alternatives =
        getNegotiationAlternatives(
          offerA,
          offerB,
          24,
          "BASE"
        );

      return {
        offerA,
        offerB,

        compensationA,
        compensationB,

        ctcA,
        ctcB,

        equityA,
        equityB,

        equityRealityA,
        equityRealityB,

        comparison,

        baseSnapshot,
        bearSnapshot,
        bullSnapshot,

        breakEven,

        negotiation,
        alternatives,
      };
    }, []);

  const snapshots: Array<{
    key: OfferScenarioKey;
    values: typeof qa.baseSnapshot;
  }> = [
    {
      key: "BEAR",
      values:
        qa.bearSnapshot,
    },

    {
      key: "BASE",
      values:
        qa.baseSnapshot,
    },

    {
      key: "BULL",
      values:
        qa.bullSnapshot,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="rounded-[32px] bg-slate-950 p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
            Phase 4 • Final Crossover QA
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Offer Intelligence crossover validation
          </h1>

          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
            This final temporary QA case tests whether cash,
            vesting, equity scenarios and break-even logic can
            produce different outcomes under Bear, Base and Bull
            assumptions before we build the real Offer Letter
            Scanner and comparison interface.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Offer A
              </p>

              <p className="mt-2 text-xl font-black">
                {qa.offerA.employer.companyName}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                Listed company • Higher guaranteed cash • 1,200 RSUs
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                Offer B
              </p>

              <p className="mt-2 text-xl font-black">
                {qa.offerB.employer.companyName}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                Private startup • Lower fixed • 30,000 ESOPs • Larger scenario sensitivity
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-violet-300">
              Final QA objective
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              Offer A should be economically stronger early because
              of higher recurring cash. Offer B should become much
              more competitive as equity vests, especially in Bull.
              Bear, Base and Bull should no longer behave identically
              after the cliff.
            </p>
          </div>
        </div>

        {/* =====================================================
            TEST 1 — CTC REALITY
        ====================================================== */}

        <Section
          title="Test 1 — CTC Reality"
          subtitle="The joining bonuses are now deliberately equal so an early crossover cannot be manufactured by upfront cash."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-black">
                Offer A
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card
                  title="Headline CTC"
                  value={money(
                    qa.ctcA.headlineCTC
                  )}
                />

                <Card
                  title="Guaranteed recurring"
                  value={money(
                    qa.ctcA
                      .guaranteedRecurringCash
                  )}
                />

                <Card
                  title="Target variable"
                  value={money(
                    qa.ctcA
                      .targetVariableCash
                  )}
                />

                <Card
                  title="One-time"
                  value={money(
                    qa.ctcA.oneTimeCash
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black">
                Offer B
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card
                  title="Headline CTC"
                  value={money(
                    qa.ctcB.headlineCTC
                  )}
                />

                <Card
                  title="Guaranteed recurring"
                  value={money(
                    qa.ctcB
                      .guaranteedRecurringCash
                  )}
                />

                <Card
                  title="Target variable"
                  value={money(
                    qa.ctcB
                      .targetVariableCash
                  )}
                />

                <Card
                  title="One-time"
                  value={money(
                    qa.ctcB.oneTimeCash
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-950">
            Expected: both offers should now show ₹1,00,000
            one-time compensation. Offer A should still have
            ₹27,00,000 guaranteed recurring cash versus
            ₹24,00,000 for Offer B.
          </div>
        </Section>

        {/* =====================================================
            TEST 2 — EQUITY REALITY
        ====================================================== */}

        <Section
          title="Test 2 — Equity Reality"
          subtitle="The startup grant is intentionally larger in this dedicated crossover test."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Offer A • RSU
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Card
                  title="Grant"
                  value={number(
                    qa.offerA.equity
                      .totalOptionsOrShares
                  )}
                  note="RSUs"
                />

                <Card
                  title="Unit basis"
                  value={money(
                    qa.equityRealityA
                      .basisUnitValue
                  )}
                  note={
                    qa.equityRealityA
                      .basis
                  }
                />

                <Card
                  title="4Y Base equity"
                  value={money(
                    qa.equityRealityA
                      .baseValueAt48Months
                  )}
                />

                <Card
                  title="Exercise capital"
                  value={money(
                    qa.equityRealityA
                      .exerciseCapitalAt48Months
                  )}
                />

                <Card
                  title="Liquidity"
                  value={
                    qa.equityRealityA
                      .liquidity
                  }
                />

                <Card
                  title="Risk"
                  value={
                    qa.equityRealityA
                      .risk
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-violet-700">
                Offer B • ESOP
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Card
                  title="Grant"
                  value={number(
                    qa.offerB.equity
                      .totalOptionsOrShares
                  )}
                  note="Options"
                />

                <Card
                  title="Unit basis"
                  value={money(
                    qa.equityRealityB
                      .basisUnitValue
                  )}
                  note={
                    qa.equityRealityB
                      .basis
                  }
                />

                <Card
                  title="4Y Base equity"
                  value={money(
                    qa.equityRealityB
                      .baseValueAt48Months
                  )}
                />

                <Card
                  title="Exercise capital"
                  value={money(
                    qa.equityRealityB
                      .exerciseCapitalAt48Months
                  )}
                />

                <Card
                  title="Liquidity"
                  value={
                    qa.equityRealityB
                      .liquidity
                  }
                />

                <Card
                  title="Risk"
                  value={
                    qa.equityRealityB
                      .risk
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            Expected: Offer A remains HIGH liquidity with ₹0
            exercise capital. Offer B should show 30,000 options,
            LOW liquidity, HIGH risk and substantially more
            exercise capital than the original 10,000-option test.
          </div>
        </Section>

        {/* =====================================================
            TEST 3 — VESTING
        ====================================================== */}

        <Section
          title="Test 3 — Vesting"
          subtitle="Both grants still use 48 months with a 12-month cliff. Only the startup grant quantity changed."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3">
                    Horizon
                  </th>

                  <th className="py-3">
                    Offer A vested
                  </th>

                  <th className="py-3">
                    Offer A %
                  </th>

                  <th className="py-3">
                    Offer B vested
                  </th>

                  <th className="py-3">
                    Offer B %
                  </th>
                </tr>
              </thead>

              <tbody>
                {([12, 24, 36, 48] as const).map(
                  (horizon) => {
                    const a =
                      qa.equityA
                        .horizons[
                          horizon
                        ]
                        .vesting;

                    const b =
                      qa.equityB
                        .horizons[
                          horizon
                        ]
                        .vesting;

                    return (
                      <tr
                        key={horizon}
                        className="border-b border-slate-100"
                      >
                        <td className="py-4 font-black">
                          {horizon / 12}Y
                        </td>

                        <td className="py-4">
                          {number(
                            a.vestedOptionsOrShares
                          )}
                        </td>

                        <td className="py-4">
                          {percent(
                            a.vestedPercentage
                          )}
                        </td>

                        <td className="py-4">
                          {number(
                            b.vestedOptionsOrShares
                          )}
                        </td>

                        <td className="py-4">
                          {percent(
                            b.vestedPercentage
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
            Expected Offer B quantities: 7,500 at 1Y,
            15,000 at 2Y, 22,500 at 3Y and 30,000 at 4Y.
            Percentages should remain 25%, 50%, 75% and 100%.
          </div>
        </Section>

        {/* =====================================================
            TEST 4 — BASE COMPARISON
        ====================================================== */}

        <Section
          title="Test 4 — 1Y / 2Y / 3Y / 4Y Base Comparison"
          subtitle="This test checks whether larger startup equity can eventually offset the established company's recurring-cash advantage."
        >
          <div className="grid gap-4 md:grid-cols-4">
            {qa.baseSnapshot.map(
              (item) => (
                <div
                  key={
                    item.horizonMonths
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    {item.horizonMonths /
                      12}
                    -year
                  </p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Offer A
                      </p>

                      <p className="font-black">
                        {money(
                          item.offerAValue
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Offer B
                      </p>

                      <p className="font-black">
                        {money(
                          item.offerBValue
                        )}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500">
                        Winner
                      </p>

                      <p className="font-black text-violet-700">
                        {winnerLabel(
                          item.winner
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Gap{" "}
                        {money(
                          item.difference
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-wider text-violet-300">
              Engine summary
            </p>

            <p className="mt-2 text-lg font-bold leading-7">
              {qa.comparison.summary}
            </p>
          </div>
        </Section>

        {/* =====================================================
            TEST 5 — BEAR / BASE / BULL
        ====================================================== */}

        <Section
          title="Test 5 — Bear / Base / Bull"
          subtitle="This is now a critical crossover test. The three equity scenarios should create materially different relative outcomes."
        >
          <div className="space-y-5">
            {snapshots.map(
              (scenario) => (
                <div
                  key={scenario.key}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="font-black">
                    {scenario.key}
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {scenario.values.map(
                      (item) => (
                        <div
                          key={
                            item.horizonMonths
                          }
                          className="rounded-xl bg-slate-50 p-4"
                        >
                          <p className="text-xs font-bold text-slate-500">
                            {item.horizonMonths /
                              12}
                            Y
                          </p>

                          <p className="mt-2 text-sm">
                            A:{" "}
                            <strong>
                              {money(
                                item.offerAValue
                              )}
                            </strong>
                          </p>

                          <p className="text-sm">
                            B:{" "}
                            <strong>
                              {money(
                                item.offerBValue
                              )}
                            </strong>
                          </p>

                          <p className="mt-2 text-xs font-black text-violet-700">
                            {winnerLabel(
                              item.winner
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm leading-6 text-violet-950">
            Final QA goal: Bear should be the least favorable
            startup outcome, Base should materially improve
            RocketAI's relative position, and Bull should make
            RocketAI substantially stronger. The three scenario
            paths must not collapse into the same result.
          </div>
        </Section>

        {/* =====================================================
            TEST 6 — DECISION MATRIX
        ====================================================== */}

        <Section
          title="Test 6 — Decision Matrix"
          subtitle="Even if startup equity becomes economically stronger, the engine must preserve the non-financial-equivalence trade-offs."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {qa.comparison
              .decisionMatrix
              .map(
                (item) => (
                  <div
                    key={
                      item.category
                    }
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">
                          {item.label}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          A:{" "}
                          {item.offerAValue}
                        </p>

                        <p className="text-sm text-slate-500">
                          B:{" "}
                          {item.offerBValue}
                        </p>
                      </div>

                      <div className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                        {winnerLabel(
                          item.winner
                        )}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {item.explanation}
                    </p>
                  </div>
                )
              )}
          </div>

          <div className="mt-5 rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-950">
            Expected structural behavior: Offer A should still
            win guaranteed recurring cash, liquidity and lower
            exercise burden. Offer B should have the stronger
            modeled equity-upside category.
          </div>
        </Section>

        {/* =====================================================
            TEST 7 — BREAK EVEN
        ====================================================== */}

        <Section
          title="Test 7 — Final Break-even Crossover"
          subtitle="This is the most important final Phase 4 engine test. The joining bonuses are equal, so any later crossover must come from accumulated economics and equity."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                "BEAR",
                "BASE",
                "BULL",
              ] as OfferScenarioKey[]
            ).map(
              (scenario) => {
                const analysis =
                  qa.breakEven[
                    scenario
                  ];

                const result =
                  analysis.result;

                return (
                  <div
                    key={scenario}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-wider text-violet-600">
                      {scenario}
                    </p>

                    <p className="mt-3 text-2xl font-black">
                      {result.found &&
                      result.breakEvenMonth
                        ? `Month ${result.breakEvenMonth}`
                        : "No crossover"}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Initial leader
                        </p>

                        <p className="mt-1 font-black">
                          {winnerLabel(
                            analysis
                              .firstMonthWinner
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Final leader
                        </p>

                        <p className="mt-1 font-black">
                          {winnerLabel(
                            analysis
                              .finalMonthWinner
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {result.explanation}
                    </p>

                    <p className="mt-3 text-xs font-bold text-slate-500">
                      Crossovers detected:{" "}
                      {analysis.crossoverCount}
                    </p>

                    {analysis.crossoverMonths
                      .length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Months:{" "}
                        {analysis.crossoverMonths.join(
                          ", "
                        )}
                      </p>
                    ) : null}
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-black text-emerald-950">
              What constitutes a successful crossover QA?
            </p>

            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Offer A should be the initial leader. Bull should
              make Offer B competitive substantially earlier than
              Base. Bear should be materially less favorable to
              Offer B and may produce no crossover at all. We do
              not require an artificial exact month — we require
              economically coherent scenario-sensitive behavior.
            </p>
          </div>
        </Section>

        {/* =====================================================
            TEST 8 — NEGOTIATION
        ====================================================== */}

        <Section
          title="Test 8 — Negotiation Intelligence"
          subtitle="The QA negotiation target still uses the 2-year Base horizon. Its direction may change because the startup grant is now much larger."
        >
          {qa.negotiation.target ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card
                  title="Economic gap"
                  value={money(
                    qa.negotiation
                      .target
                      .economicGap
                  )}
                />

                <Card
                  title="Annual fixed needed"
                  value={money(
                    qa.negotiation
                      .target
                      .additionalAnnualFixedSalary
                  )}
                />

                <Card
                  title="Joining bonus needed"
                  value={money(
                    qa.negotiation
                      .target
                      .additionalJoiningBonus
                  )}
                />

                <Card
                  title="Additional equity"
                  value={
                    qa.negotiation
                      .canNegotiateWithEquity
                      ? number(
                          qa.negotiation
                            .target
                            .additionalOptionsOrShares
                        )
                      : "Unavailable"
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl bg-violet-50 p-5">
                <p className="font-black text-violet-950">
                  {
                    qa.negotiation
                      .target
                      .explanation
                  }
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {qa.alternatives.map(
                  (alternative) => (
                    <div
                      key={
                        alternative.type
                      }
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                        {
                          alternative.label
                        }
                      </p>

                      <p className="mt-2 text-xl font-black">
                        {!alternative.available
                          ? "Unavailable"
                          : alternative.unit ===
                            "CURRENCY"
                          ? money(
                              alternative.value
                            )
                          : number(
                              alternative.value
                            )}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {
                          alternative.explanation
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-100 p-5">
              <p className="font-bold">
                No negotiation gap at the selected horizon.
              </p>
            </div>
          )}
        </Section>

        {/* =====================================================
            TEST 9 — WARNINGS
        ====================================================== */}

        <Section
          title="Test 9 — Safety / Model Warnings"
          subtitle="Increasing the ESOP grant must not make the engine hide private-company, dilution, exercise-capital or tax limitations."
        >
          <div className="space-y-3">
            {qa.comparison.warnings.map(
              (warning, index) => (
                <div
                  key={`${warning}-${index}`}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
                >
                  {warning}
                </div>
              )
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-black text-red-900">
              QA checkpoint
            </p>

            <p className="mt-2 text-sm leading-6 text-red-800">
              Phase 4 equity values remain pre-tax. The larger
              startup grant must not be presented as guaranteed
              realizable compensation. We will connect the
              existing PRO tax engine later rather than create a
              second independent tax engine.
            </p>
          </div>
        </Section>

        {/* =====================================================
            TEST 10 — RAW CHECK
        ====================================================== */}

        <Section
          title="Test 10 — Raw Engine Status"
          subtitle="Final structural sanity check before Phase 4 engine QA is closed."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="Offer A equity data"
              value={
                qa.equityA
                  .hasSufficientData
                  ? "READY"
                  : "INCOMPLETE"
              }
            />

            <Card
              title="Offer B equity data"
              value={
                qa.equityB
                  .hasSufficientData
                  ? "READY"
                  : "INCOMPLETE"
              }
            />

            <Card
              title="Comparison rows"
              value={String(
                qa.comparison
                  .comparisons
                  .length
              )}
              note="Expected: 12"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Card
              title="Bear crossovers"
              value={String(
                qa.breakEven
                  .BEAR
                  .crossoverCount
              )}
              note={
                qa.breakEven
                  .BEAR
                  .crossoverMonths
                  .length
                  ? `Months: ${qa.breakEven.BEAR.crossoverMonths.join(
                      ", "
                    )}`
                  : "No crossover detected"
              }
            />

            <Card
              title="Base crossovers"
              value={String(
                qa.breakEven
                  .BASE
                  .crossoverCount
              )}
              note={
                qa.breakEven
                  .BASE
                  .crossoverMonths
                  .length
                  ? `Months: ${qa.breakEven.BASE.crossoverMonths.join(
                      ", "
                    )}`
                  : "No crossover detected"
              }
            />

            <Card
              title="Bull crossovers"
              value={String(
                qa.breakEven
                  .BULL
                  .crossoverCount
              )}
              note={
                qa.breakEven
                  .BULL
                  .crossoverMonths
                  .length
                  ? `Months: ${qa.breakEven.BULL.crossoverMonths.join(
                      ", "
                    )}`
                  : "No crossover detected"
              }
            />
          </div>

          <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
            Structural PASS requires both equity models to remain
            READY and comparison rows to remain exactly 12.
            Crossover PASS requires Bear/Base/Bull to respond
            coherently to the different equity multipliers rather
            than producing the same artificial early result.
          </div>
        </Section>
      </div>
    </main>
  );
}