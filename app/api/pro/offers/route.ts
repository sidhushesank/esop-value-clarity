/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   SAVED OFFERS LIST

   Route:
   GET /api/pro/offers

   Responsibilities:
   - authenticate current user
   - retrieve only that user's Offer Intelligence records
   - return customer-safe saved-offer summaries
   - expose lightweight comparison readiness
   - expose aggregate dashboard statistics
   - newest offers first
   - do NOT expose raw scanner/audit snapshots
============================================================ */

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/* ============================================================
   RUNTIME
============================================================ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   RESPONSE HELPERS
============================================================ */

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}

function successResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...body,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}

/* ============================================================
   SMALL HELPERS
============================================================ */

function isPresent(
  value: unknown
): boolean {
  return value !== null && value !== undefined;
}

function isPositiveAmount(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

/* ============================================================
   GET
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION

       Matches the existing application convention:
       cookie = "token"
    ---------------------------------------------------------- */

    const token =
      request.cookies.get("token")?.value;

    if (!token) {
      return errorResponse(
        "Not authenticated",
        401,
        "NOT_AUTHENTICATED"
      );
    }

    const userId =
      await getSessionUserId(token);

    if (!userId) {
      return errorResponse(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    /* ==========================================================
       FETCH SAVED OFFERS

       IMPORTANT:
       - records are scoped to the authenticated user
       - archived offers remain available
       - newest records appear first
       - rawScanSnapshot is deliberately NOT selected
       - confirmedScanSnapshot is deliberately NOT selected
    ========================================================== */

    const records =
      await prisma.offerIntelligence.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          /* ------------------------------------------------------
             IDENTITY / LIFECYCLE
          ------------------------------------------------------ */

          id: true,
          status: true,
          source: true,

          companyName: true,
          roleTitle: true,
          location: true,

          employmentType: true,
          workMode: true,

          joiningDate: true,
          currency: true,

          /* ------------------------------------------------------
             CASH
          ------------------------------------------------------ */

          headlineCTC: true,
          fixedSalary: true,

          basicSalary: true,
          hra: true,
          specialAllowance: true,
          otherFixedAllowance: true,

          targetVariablePay: true,
          maximumVariablePay: true,

          joiningBonus: true,
          retentionBonus: true,
          relocationBonus: true,
          performanceBonus: true,

          employerPF: true,
          gratuity: true,

          insuranceValue: true,
          otherEmployerBenefits: true,

          /* ------------------------------------------------------
             EQUITY
          ------------------------------------------------------ */

          equityType: true,
          companyEquityStatus: true,

          employerHeadlineEquityValue: true,

          totalOptionsOrShares: true,

          exercisePrice: true,
          currentFMV: true,
          listedSharePrice: true,

          companyValuation: true,
          totalCompanyShares: true,
          ownershipPercentage: true,

          vestingDurationMonths: true,
          cliffMonths: true,
          vestingFrequency: true,

          vestingStartDate: true,
          grantDate: true,
          expiryDate: true,

          postTerminationExerciseDays: true,
          expectedDilutionPercentage: true,

          /* ------------------------------------------------------
             SOURCE DOCUMENT METADATA

             The uploaded PDF itself is not persisted here.
             These fields are safe/useful customer metadata.
          ------------------------------------------------------ */

          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
          pageCount: true,

          /* ------------------------------------------------------
             ENGINE / VALIDATION

             normalizedSnapshot:
             clean confirmed engine representation

             validationSnapshot:
             remaining warnings / limitations

             Intentionally NOT selected:
             - rawScanSnapshot
             - confirmedScanSnapshot
          ------------------------------------------------------ */

          normalizedSnapshot: true,
          validationSnapshot: true,

          /* ------------------------------------------------------
             TIMESTAMPS
          ------------------------------------------------------ */

          confirmedAt: true,
          archivedAt: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    /* ==========================================================
       CUSTOMER-SAFE DERIVED DATA

       Keep this deliberately lightweight.

       The dedicated comparison engine remains responsible for
       actual economic scoring and offer-vs-offer decisions.
    ========================================================== */

    const offers = records.map(
      (offer) => {
        /* --------------------------------------------------------
           EQUITY PRESENCE
        -------------------------------------------------------- */

        const equityType =
          offer.equityType ??
          "UNKNOWN";

        const equityUnknown =
          equityType ===
          "UNKNOWN";

        const hasEquity =
          equityType !== "NONE" &&
          !equityUnknown;

        /* --------------------------------------------------------
           ESOP MODEL READINESS
        -------------------------------------------------------- */

        const hasCompleteEsopBasis =
          equityType === "ESOP" &&
          isPresent(
            offer.totalOptionsOrShares
          ) &&
          isPresent(
            offer.exercisePrice
          ) &&
          isPresent(
            offer.currentFMV
          ) &&
          isPresent(
            offer.vestingDurationMonths
          );

        /* --------------------------------------------------------
           RSU MODEL READINESS
        -------------------------------------------------------- */

        const hasCompleteRsuBasis =
          equityType === "RSU" &&
          isPresent(
            offer.totalOptionsOrShares
          ) &&
          (
            isPresent(
              offer.listedSharePrice
            ) ||
            isPresent(
              offer.currentFMV
            )
          ) &&
          isPresent(
            offer.vestingDurationMonths
          );

        /* --------------------------------------------------------
           GENERIC EQUITY READINESS

           For non-equity offers there is no equity blocker.

           For ESOP / RSU we require enough confirmed information
           for meaningful current-reference economics.

           Other equity instruments remain conservative because
           we do not want to invent valuation logic.
        -------------------------------------------------------- */

        const equityModelReady =
          equityType === "NONE" ||
          hasCompleteEsopBasis ||
          hasCompleteRsuBasis;

        /* --------------------------------------------------------
           CONFIRMATION / ARCHIVE STATE
        -------------------------------------------------------- */

        const confirmed =
          offer.status === "CONFIRMED";

        const archived =
          offer.status === "ARCHIVED";

        /* --------------------------------------------------------
           COMPARISON READINESS

           Fixed compensation is the minimum recurring cash basis.

           Equity, when present, must have enough confirmed
           information for the current comparison model.
        -------------------------------------------------------- */

        const cashComparisonReady =
          confirmed &&
          Boolean(offer.companyName?.trim()) &&
          Boolean(offer.roleTitle?.trim()) &&
          isPositiveAmount(
            offer.fixedSalary
          );

        /*
         * Comparison entry is deliberately cash-first. The
         * comparison screen will withhold its overall winner if
         * equity is unknown or incomplete.
         */
        const readyForComparison =
          cashComparisonReady;

        const overallDecisionReady =
          cashComparisonReady &&
          equityModelReady;

        /* --------------------------------------------------------
           DATA COMPLETENESS

           This is NOT the comparison score.

           It is only a lightweight list/dashboard indicator
           showing how many useful comparison fields are present.
        -------------------------------------------------------- */

        const completenessFields = [
          offer.companyName,
          offer.roleTitle,
          offer.fixedSalary,

          ...(equityType === "NONE"
            ? []
            : [
                equityUnknown
                  ? null
                  : equityType,
              ]),

          ...(hasEquity
            ? [
                offer.totalOptionsOrShares,
                offer.exercisePrice,
                (
                  offer.listedSharePrice ??
                  offer.currentFMV
                ),
                offer.vestingDurationMonths,
                offer.cliffMonths,
                offer.postTerminationExerciseDays,
                offer.expectedDilutionPercentage,
              ]
            : []),
        ];

        const completedFields =
          completenessFields.filter(
            isPresent
          ).length;

        const dataCompletenessPercentage =
          completenessFields.length > 0
            ? Math.round(
                (
                  completedFields /
                  completenessFields.length
                ) * 100
              )
            : 0;

        /* --------------------------------------------------------
           RETURN CUSTOMER-SAFE OFFER
        -------------------------------------------------------- */

        return {
          id: offer.id,

          status: offer.status,
          source: offer.source,

          companyName:
            offer.companyName,
          roleTitle:
            offer.roleTitle,
          location:
            offer.location,

          employmentType:
            offer.employmentType,
          workMode:
            offer.workMode,

          joiningDate:
            offer.joiningDate,
          currency:
            offer.currency,

          cash: {
            headlineCTC:
              offer.headlineCTC,

            fixedSalary:
              offer.fixedSalary,

            basicSalary:
              offer.basicSalary,

            hra:
              offer.hra,

            specialAllowance:
              offer.specialAllowance,

            otherFixedAllowance:
              offer.otherFixedAllowance,

            targetVariablePay:
              offer.targetVariablePay,

            maximumVariablePay:
              offer.maximumVariablePay,

            joiningBonus:
              offer.joiningBonus,

            retentionBonus:
              offer.retentionBonus,

            relocationBonus:
              offer.relocationBonus,

            performanceBonus:
              offer.performanceBonus,

            employerPF:
              offer.employerPF,

            gratuity:
              offer.gratuity,

            insuranceValue:
              offer.insuranceValue,

            otherEmployerBenefits:
              offer.otherEmployerBenefits,
          },

          equity: {
            type:
              offer.equityType,

            companyEquityStatus:
              offer.companyEquityStatus,

            employerHeadlineEquityValue:
              offer.employerHeadlineEquityValue,

            totalOptionsOrShares:
              offer.totalOptionsOrShares,

            exercisePrice:
              offer.exercisePrice,

            currentFMV:
              offer.currentFMV,

            listedSharePrice:
              offer.listedSharePrice,

            companyValuation:
              offer.companyValuation,

            totalCompanyShares:
              offer.totalCompanyShares,

            ownershipPercentage:
              offer.ownershipPercentage,

            vestingDurationMonths:
              offer.vestingDurationMonths,

            cliffMonths:
              offer.cliffMonths,

            vestingFrequency:
              offer.vestingFrequency,

            vestingStartDate:
              offer.vestingStartDate,

            grantDate:
              offer.grantDate,

            expiryDate:
              offer.expiryDate,

            postTerminationExerciseDays:
              offer.postTerminationExerciseDays,

            expectedDilutionPercentage:
              offer.expectedDilutionPercentage,
          },

          document: {
            originalFileName:
              offer.originalFileName,

            mimeType:
              offer.mimeType,

            fileSizeBytes:
              offer.fileSizeBytes,

            pageCount:
              offer.pageCount,
          },

          engine: {
            normalizedSnapshot:
              offer.normalizedSnapshot,

            validationSnapshot:
              offer.validationSnapshot,
          },

          readiness: {
            confirmed,
            archived,
            hasEquity,
            equityUnknown,
            equityModelReady,
            cashComparisonReady,
            overallDecisionReady,
            readyForComparison,
            dataCompletenessPercentage,
          },

          timestamps: {
            confirmedAt:
              offer.confirmedAt,

            archivedAt:
              offer.archivedAt,

            createdAt:
              offer.createdAt,

            updatedAt:
              offer.updatedAt,
          },

          actions: {
            viewHref:
              `/pro/offers/${encodeURIComponent(
                offer.id
              )}`,

            compareHref:
              readyForComparison
                ? `/pro/offers/new?side=B&compareWith=${encodeURIComponent(
                    offer.id
                  )}`
                : null,
          },
        };
      }
    );

    /* ==========================================================
       DASHBOARD STATISTICS
    ========================================================== */

    const total =
      offers.length;

    const confirmed =
      offers.filter(
        (offer) =>
          offer.readiness.confirmed
      ).length;

    const archived =
      offers.filter(
        (offer) =>
          offer.readiness.archived
      ).length;

    const readyForComparison =
      offers.filter(
        (offer) =>
          offer.readiness
            .readyForComparison
      ).length;

    const withEquity =
      offers.filter(
        (offer) =>
          offer.readiness.hasEquity
      ).length;

    const esopOffers =
      offers.filter(
        (offer) =>
          offer.equity.type === "ESOP"
      ).length;

    const rsuOffers =
      offers.filter(
        (offer) =>
          offer.equity.type === "RSU"
      ).length;

    /* ==========================================================
       RECENT CONFIRMED OFFERS

       Useful for quickly creating a comparison pair on the UI.

       Keep this small so the landing page can use it without
       additional client-side processing.
    ========================================================== */

    const comparisonCandidates =
      offers
        .filter(
          (offer) =>
            offer.readiness
              .readyForComparison
        )
        .slice(0, 6)
        .map((offer) => ({
          id: offer.id,

          companyName:
            offer.companyName,

          roleTitle:
            offer.roleTitle,

          fixedSalary:
            offer.cash.fixedSalary,

          headlineCTC:
            offer.cash.headlineCTC,

          equityType:
            offer.equity.type,

          totalOptionsOrShares:
            offer.equity
              .totalOptionsOrShares,

          createdAt:
            offer.timestamps.createdAt,

          viewHref:
            offer.actions.viewHref,

          compareHref:
            offer.actions.compareHref,
        }));

    /* ==========================================================
       SUCCESS
    ========================================================== */

    return successResponse({
      stats: {
        total,
        confirmed,
        readyForComparison,
        archived,
        withEquity,
        esopOffers,
        rsuOffers,
      },

      offers,

      comparisonCandidates,

      actions: {
        createOfferHref:
          "/pro/offers/new",

        qaHref:
          "/pro/offers/qa",
      },
    });
  } catch (error: unknown) {
    console.error(
      "GET /api/pro/offers error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve saved offers.";

    return errorResponse(
      message,
      500,
      "OFFERS_FETCH_FAILED"
    );
  }
}
