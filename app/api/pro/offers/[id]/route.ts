/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   SAVED OFFER API

   Route:
   /api/pro/offers/:id

   Supported operations:

   GET
   - authenticate current user
   - retrieve one Offer Intelligence record
   - enforce record ownership
   - return customer-safe persisted data
   - expose normalized engine snapshot for later comparison
   - do NOT expose raw scanner snapshot by default

   PATCH
   - archive a saved offer
   - restore an archived offer
   - enforce record ownership
   - prevent invalid lifecycle transitions

   DELETE
   - permanently delete a saved offer
   - enforce record ownership
   - require the offer to already be archived

   Security:
   - every operation is scoped to authenticated userId
   - another user's record is never exposed
   - missing and unauthorized records both return 404
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
   ROUTE PARAMS

   Next.js 16 App Router provides dynamic params as a Promise.
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   AUTHENTICATION HELPER
============================================================ */

async function getAuthenticatedUserId(
  request: NextRequest
): Promise<
  | {
      success: true;
      userId: string;
    }
  | {
      success: false;
      response: NextResponse;
    }
> {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return {
      success: false,
      response: errorResponse(
        "Not authenticated",
        401,
        "NOT_AUTHENTICATED"
      ),
    };
  }

  const userId = await getSessionUserId(token);

  if (!userId) {
    return {
      success: false,
      response: errorResponse(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      ),
    };
  }

  return {
    success: true,
    userId,
  };
}

/* ============================================================
   OFFER ID HELPER
============================================================ */

async function getOfferId(
  context: RouteContext
): Promise<string | null> {
  const { id } = await context.params;

  const offerId = id?.trim();

  if (!offerId) {
    return null;
  }

  return offerId;
}

/* ============================================================
   GET
============================================================ */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION
    ---------------------------------------------------------- */

    const auth = await getAuthenticatedUserId(request);

    if (!auth.success) {
      return auth.response;
    }

    const { userId } = auth;

    /* ----------------------------------------------------------
       OFFER ID
    ---------------------------------------------------------- */

    const offerId = await getOfferId(context);

    if (!offerId) {
      return errorResponse(
        "Offer ID is required.",
        400,
        "OFFER_ID_REQUIRED"
      );
    }

    /* ==========================================================
       FETCH OFFER

       IMPORTANT:

       We query by BOTH:

       - id
       - authenticated userId

       This prevents another logged-in user from accessing an
       offer merely by knowing or guessing its ID.

       We intentionally use findFirst because the ownership check
       is part of the query itself.
    ========================================================== */

    const offer =
      await prisma.offerIntelligence.findFirst({
        where: {
          id: offerId,
          userId,
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

             Metadata is safe/useful to show to the customer.

             The PDF itself is not stored.
          ------------------------------------------------------ */

          originalFileName: true,

          mimeType: true,

          fileSizeBytes: true,

          pageCount: true,

          /* ------------------------------------------------------
             ENGINE / VALIDATION

             normalizedSnapshot:
             clean engine-ready representation

             validationSnapshot:
             remaining warnings/limitations after confirmation

             We intentionally DO NOT return:

             rawScanSnapshot
             confirmedScanSnapshot

             Those are internal audit records and unnecessary for
             the normal saved-offer UI.
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

    /* ----------------------------------------------------------
       NOT FOUND

       We deliberately return the same 404 whether:

       - the offer does not exist
       - the offer belongs to another user

       This avoids leaking record existence.
    ---------------------------------------------------------- */

    if (!offer) {
      return errorResponse(
        "Offer not found.",
        404,
        "OFFER_NOT_FOUND"
      );
    }

    /* ==========================================================
       DERIVED CUSTOMER SUMMARY

       This is deliberately lightweight.

       The comparison engine remains the authority for modeled
       economics. We do not duplicate those calculations here.
    ========================================================== */

    const equityType =
      offer.equityType ??
      "UNKNOWN";

    const equityUnknown =
      equityType ===
      "UNKNOWN";

    const hasEquity =
      equityType !== "NONE" &&
      !equityUnknown;

    const hasCompleteEsopBasis =
      equityType === "ESOP" &&
      offer.totalOptionsOrShares !== null &&
      offer.exercisePrice !== null &&
      offer.currentFMV !== null &&
      offer.vestingDurationMonths !== null;

    const hasCompleteRsuBasis =
      equityType === "RSU" &&
      offer.totalOptionsOrShares !== null &&
      (offer.listedSharePrice !== null ||
        offer.currentFMV !== null) &&
      offer.vestingDurationMonths !== null;

    const equityModelReady =
      equityType === "NONE" ||
      hasCompleteEsopBasis ||
      hasCompleteRsuBasis;

    const cashComparisonReady =
      offer.status === "CONFIRMED" &&
      Boolean(offer.companyName?.trim()) &&
      Boolean(offer.roleTitle?.trim()) &&
      offer.fixedSalary !== null &&
      offer.fixedSalary > 0;

    const summary = {
      companyName: offer.companyName,

      roleTitle: offer.roleTitle,

      headlineCTC: offer.headlineCTC,

      fixedSalary: offer.fixedSalary,

      targetVariablePay:
        offer.targetVariablePay,

      joiningBonus: offer.joiningBonus,

      equityType: offer.equityType,

      totalOptionsOrShares:
        offer.totalOptionsOrShares,

      hasEquity,

      equityUnknown,

      equityModelReady,

      cashComparisonReady,

      overallDecisionReady:
        cashComparisonReady &&
        equityModelReady,

      confirmed:
        offer.status === "CONFIRMED",

      archived:
        offer.status === "ARCHIVED",

      readyForComparison:
        cashComparisonReady,
    };

    /* ==========================================================
       CUSTOMER ACTIONS

       Archived offers cannot be compared until restored.
    ========================================================== */

    const actions = {
      canCompare:
        summary.readyForComparison,

      compareLabel:
        "Compare with another offer",

      compareHref:
        summary.readyForComparison
          ? `/pro/offers/new?side=B&compareWith=${encodeURIComponent(
              offer.id
            )}`
          : null,

      canArchive:
        offer.status === "CONFIRMED",

      canRestore:
        offer.status === "ARCHIVED" &&
        offer.confirmedAt !== null,

      canDelete:
        offer.status === "ARCHIVED",
    };

    /* ==========================================================
       SUCCESS
    ========================================================== */

    return successResponse({
      offer,
      summary,
      actions,
    });
  } catch (error: unknown) {
    console.error(
      "GET /api/pro/offers/[id] error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve the offer.";

    return errorResponse(
      message,
      500,
      "OFFER_FETCH_FAILED"
    );
  }
}

/* ============================================================
   PATCH ACTIONS
============================================================ */

type PatchAction =
  | "archive"
  | "restore";

type PatchRequestBody = {
  action?: unknown;
};

/* ============================================================
   PATCH

   Request examples:

   Archive:
   PATCH /api/pro/offers/:id

   {
     "action": "archive"
   }

   Restore:
   PATCH /api/pro/offers/:id

   {
     "action": "restore"
   }
============================================================ */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION
    ---------------------------------------------------------- */

    const auth = await getAuthenticatedUserId(request);

    if (!auth.success) {
      return auth.response;
    }

    const { userId } = auth;

    /* ----------------------------------------------------------
       OFFER ID
    ---------------------------------------------------------- */

    const offerId = await getOfferId(context);

    if (!offerId) {
      return errorResponse(
        "Offer ID is required.",
        400,
        "OFFER_ID_REQUIRED"
      );
    }

    /* ----------------------------------------------------------
       REQUEST BODY
    ---------------------------------------------------------- */

    let body: PatchRequestBody;

    try {
      body =
        (await request.json()) as PatchRequestBody;
    } catch {
      return errorResponse(
        "A valid JSON request body is required.",
        400,
        "INVALID_REQUEST_BODY"
      );
    }

    const rawAction = body.action;

    if (typeof rawAction !== "string") {
      return errorResponse(
        "Action is required.",
        400,
        "ACTION_REQUIRED"
      );
    }

    const action =
      rawAction.trim().toLowerCase();

    if (
      action !== "archive" &&
      action !== "restore"
    ) {
      return errorResponse(
        "Unsupported offer action.",
        400,
        "INVALID_OFFER_ACTION"
      );
    }

    const typedAction =
      action as PatchAction;

    /* ==========================================================
       FETCH OWNED OFFER

       We need lifecycle information before deciding whether the
       requested transition is valid.

       Ownership remains part of the query.
    ========================================================== */

    const existingOffer =
      await prisma.offerIntelligence.findFirst({
        where: {
          id: offerId,
          userId,
        },

        select: {
          id: true,

          status: true,

          companyName: true,

          roleTitle: true,

          confirmedAt: true,

          archivedAt: true,
        },
      });

    if (!existingOffer) {
      return errorResponse(
        "Offer not found.",
        404,
        "OFFER_NOT_FOUND"
      );
    }

    /* ==========================================================
       ARCHIVE
    ========================================================== */

    if (typedAction === "archive") {
      /* --------------------------------------------------------
         ALREADY ARCHIVED

         Make this operation effectively idempotent.

         Repeating "archive" does not need to create an error.
      -------------------------------------------------------- */

      if (
        existingOffer.status === "ARCHIVED"
      ) {
        return successResponse({
          message:
            "Offer is already archived.",

          action: "archive",

          offer: existingOffer,
        });
      }

      /* --------------------------------------------------------
         ONLY CONFIRMED OFFERS MAY BE ARCHIVED

         DRAFT and REVIEW_REQUIRED offers are still part of the
         creation/review workflow and should not silently enter
         the saved-offer archive.
      -------------------------------------------------------- */

      if (
        existingOffer.status !==
        "CONFIRMED"
      ) {
        return errorResponse(
          "Only confirmed offers can be archived.",
          409,
          "OFFER_NOT_ARCHIVABLE"
        );
      }

      const archivedOffer =
        await prisma.offerIntelligence.updateMany({
          where: {
            id: offerId,

            userId,

            status: "CONFIRMED",
          },

          data: {
            status: "ARCHIVED",

            archivedAt: new Date(),
          },
        });

      /* --------------------------------------------------------
         DEFENSIVE CONCURRENCY CHECK

         If another request changed the record between our read
         and update, do not claim success incorrectly.
      -------------------------------------------------------- */

      if (archivedOffer.count !== 1) {
        return errorResponse(
          "The offer changed before it could be archived. Please refresh and try again.",
          409,
          "OFFER_STATE_CHANGED"
        );
      }

      const updatedOffer =
        await prisma.offerIntelligence.findFirst({
          where: {
            id: offerId,
            userId,
          },

          select: {
            id: true,

            status: true,

            companyName: true,

            roleTitle: true,

            confirmedAt: true,

            archivedAt: true,

            updatedAt: true,
          },
        });

      return successResponse({
        message:
          "Offer archived successfully.",

        action: "archive",

        offer: updatedOffer,

        actions: {
          canArchive: false,

          canRestore: true,

          canDelete: true,

          canCompare: false,
        },
      });
    }

    /* ==========================================================
       RESTORE
    ========================================================== */

    if (typedAction === "restore") {
      /* --------------------------------------------------------
         ALREADY CONFIRMED

         A repeated restore request is harmless.
      -------------------------------------------------------- */

      if (
        existingOffer.status ===
        "CONFIRMED"
      ) {
        return successResponse({
          message:
            "Offer is already active.",

          action: "restore",

          offer: existingOffer,
        });
      }

      /* --------------------------------------------------------
         ONLY ARCHIVED OFFERS CAN BE RESTORED
      -------------------------------------------------------- */

      if (
        existingOffer.status !==
        "ARCHIVED"
      ) {
        return errorResponse(
          "Only archived offers can be restored.",
          409,
          "OFFER_NOT_RESTORABLE"
        );
      }

      /* --------------------------------------------------------
         IMPORTANT SAFEGUARD

         Restore means:

         ARCHIVED -> CONFIRMED

         We therefore require evidence that this record was
         previously confirmed.

         This prevents an abnormal or manually altered archived
         draft from being promoted into CONFIRMED.
      -------------------------------------------------------- */

      if (
        existingOffer.confirmedAt === null
      ) {
        return errorResponse(
          "This archived offer cannot be restored because it was never confirmed.",
          409,
          "OFFER_WAS_NEVER_CONFIRMED"
        );
      }

      const restoredOffer =
        await prisma.offerIntelligence.updateMany({
          where: {
            id: offerId,

            userId,

            status: "ARCHIVED",

            confirmedAt: {
              not: null,
            },
          },

          data: {
            status: "CONFIRMED",

            archivedAt: null,
          },
        });

      if (restoredOffer.count !== 1) {
        return errorResponse(
          "The offer changed before it could be restored. Please refresh and try again.",
          409,
          "OFFER_STATE_CHANGED"
        );
      }

      const updatedOffer =
        await prisma.offerIntelligence.findFirst({
          where: {
            id: offerId,
            userId,
          },

          select: {
            id: true,

            status: true,

            companyName: true,

            roleTitle: true,

            confirmedAt: true,

            archivedAt: true,

            updatedAt: true,
          },
        });

      return successResponse({
        message:
          "Offer restored successfully.",

        action: "restore",

        offer: updatedOffer,

        actions: {
          canArchive: true,

          canRestore: false,

          canDelete: false,

          canCompare: true,
        },
      });
    }

    /* ----------------------------------------------------------
       DEFENSIVE FALLBACK
    ---------------------------------------------------------- */

    return errorResponse(
      "Unsupported offer action.",
      400,
      "INVALID_OFFER_ACTION"
    );
  } catch (error: unknown) {
    console.error(
      "PATCH /api/pro/offers/[id] error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the offer.";

    return errorResponse(
      message,
      500,
      "OFFER_UPDATE_FAILED"
    );
  }
}

/* ============================================================
   DELETE

   Permanent deletion is deliberately stricter than archive.

   Rules:

   - authenticated user only
   - ownership enforced
   - offer must already be ARCHIVED
   - active CONFIRMED offers cannot be permanently deleted
     directly

   This creates the safer workflow:

   CONFIRMED
       ↓ archive

   ARCHIVED
       ↓ delete

   permanently removed
============================================================ */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION
    ---------------------------------------------------------- */

    const auth = await getAuthenticatedUserId(request);

    if (!auth.success) {
      return auth.response;
    }

    const { userId } = auth;

    /* ----------------------------------------------------------
       OFFER ID
    ---------------------------------------------------------- */

    const offerId = await getOfferId(context);

    if (!offerId) {
      return errorResponse(
        "Offer ID is required.",
        400,
        "OFFER_ID_REQUIRED"
      );
    }

    /* ==========================================================
       FETCH OWNED OFFER
    ========================================================== */

    const existingOffer =
      await prisma.offerIntelligence.findFirst({
        where: {
          id: offerId,

          userId,
        },

        select: {
          id: true,

          status: true,

          companyName: true,

          roleTitle: true,

          originalFileName: true,

          confirmedAt: true,

          archivedAt: true,
        },
      });

    if (!existingOffer) {
      return errorResponse(
        "Offer not found.",
        404,
        "OFFER_NOT_FOUND"
      );
    }

    /* ==========================================================
       SAFETY RULE

       Permanent deletion requires archival first.

       This prevents a user interface bug or accidental request
       from immediately destroying an active confirmed offer.
    ========================================================== */

    if (
      existingOffer.status !==
      "ARCHIVED"
    ) {
      return errorResponse(
        "Archive the offer before deleting it permanently.",
        409,
        "OFFER_MUST_BE_ARCHIVED"
      );
    }

    /* ==========================================================
       DELETE

       deleteMany allows ownership and lifecycle state to remain
       part of the actual mutation query.

       This provides a second protection against concurrent state
       changes.
    ========================================================== */

    const deleted =
      await prisma.offerIntelligence.deleteMany({
        where: {
          id: offerId,

          userId,

          status: "ARCHIVED",
        },
      });

    if (deleted.count !== 1) {
      return errorResponse(
        "The offer changed before it could be deleted. Please refresh and try again.",
        409,
        "OFFER_STATE_CHANGED"
      );
    }

    /* ==========================================================
       SUCCESS

       Return only lightweight information about the record that
       was removed.

       We do not return scanner or normalized snapshots.
    ========================================================== */

    return successResponse({
      message:
        "Offer permanently deleted.",

      deleted: true,

      deletedOffer: {
        id: existingOffer.id,

        companyName:
          existingOffer.companyName,

        roleTitle:
          existingOffer.roleTitle,

        originalFileName:
          existingOffer.originalFileName,
      },
    });
  } catch (error: unknown) {
    console.error(
      "DELETE /api/pro/offers/[id] error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete the offer.";

    return errorResponse(
      message,
      500,
      "OFFER_DELETE_FAILED"
    );
  }
}
