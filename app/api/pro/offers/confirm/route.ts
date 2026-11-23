/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   CONFIRM + PERSIST OFFER

   Route:
   POST /api/pro/offers/confirm

   Responsibilities:
   - authenticate current user
   - receive user-reviewed ScannedOfferLetter
   - re-run scanner validation SERVER-SIDE
   - reject unresolved blocking issues
   - reject unreviewed critical fields
   - normalize confirmed scanner data into OfferInput
   - persist OfferIntelligence
   - preserve audit snapshots
   - return persisted offer ID

   IMPORTANT:
   The client cannot bypass validation simply by enabling a
   button or manipulating browser state.

   TRUST FLOW:

   Browser reviewed scan
        ↓
   SERVER validation
        ↓
   blocking issues?
        ↓
   critical fields reviewed?
        ↓
   normalizeConfirmedScannedOffer()
        ↓
   OfferInput
        ↓
   OfferIntelligence database record

   NO PDF is persisted in V1.
============================================================ */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import type {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import { getSessionUserId } from "@/lib/session";

import type {
  OfferScannerField,
  OfferScannerIssue,
  ScannedOfferLetter,
} from "@/lib/esop/offers/scanner-types";

import {
  validateScannedOffer,
} from "@/lib/esop/offers/scanner-validation";

import {
  normalizeConfirmedScannedOffer,
} from "@/lib/esop/offers/scanner-normalize";

/* ============================================================
   RUNTIME
============================================================ */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   REQUEST BODY
============================================================ */

type ConfirmOfferRequestBody = {
  scan?: unknown;

  side?: unknown;

  rawScanSnapshot?: unknown;

  source?: unknown;

  fileMetadata?: unknown;
};

type FileMetadataInput = {
  originalFileName?: unknown;

  mimeType?: unknown;

  fileSizeBytes?: unknown;

  pageCount?: unknown;
};

/* ============================================================
   SAFE RESPONSE HELPERS
============================================================ */

function errorResponse(
  message: string,
  status: number,
  code: string,
  details?: Record<
    string,
    unknown
  >
) {
  return NextResponse.json(
    {
      success:
        false,

      message,

      code,

      ...(details
        ? {
            details,
          }
        : {}),
    },
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        Pragma:
          "no-cache",
      },
    }
  );
}

function successResponse(
  body:
    Record<
      string,
      unknown
    >,
  status = 200
) {
  return NextResponse.json(
    {
      success:
        true,

      ...body,
    },
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        Pragma:
          "no-cache",
      },
    }
  );
}

/* ============================================================
   BASIC SAFE HELPERS
============================================================ */

function safeString(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

function safeNumber(
  value: unknown
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function safeInteger(
  value: unknown
): number | null {
  const number =
    safeNumber(value);

  if (
    number === null
  ) {
    return null;
  }

  return Math.round(
    number
  );
}

function safePositiveInteger(
  value: unknown
): number | null {
  const number =
    safeInteger(value);

  if (
    number === null ||
    number < 0
  ) {
    return null;
  }

  return number;
}

/* ============================================================
   SAVEABILITY VS. EQUITY MODELING

   An equity-term problem must not prevent a user from saving a
   reviewed offer that has enough confirmed cash information.
   The scanner keeps those issues in the audit snapshot, and the
   comparison engine withholds the overall winner until resolved.
============================================================ */

function isSaveBlockingIssue(
  issue: OfferScannerIssue
): boolean {
  return !issue.field?.startsWith(
    "equity."
  );
}

/* ============================================================
   DATE PARSING

   Scanner dates may arrive as:

   01 October 2026
   2026-10-01
   October 1, 2026

   Invalid values are stored as null rather than crashing
   persistence.
============================================================ */

function safeDate(
  value: unknown
): Date | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const date =
    new Date(trimmed);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

/* ============================================================
   SCANNER FIELD HELPERS

   Persistence only uses CONFIRMED / EDITED values.

   This repeats the trust boundary at the DB layer rather than
   trusting browser-submitted field values blindly.
============================================================ */

function acceptedScannerFieldValue<T>(
  field:
    OfferScannerField<T>
): T | null {
  if (
    field.reviewStatus !==
      "CONFIRMED" &&
    field.reviewStatus !==
      "EDITED"
  ) {
    return null;
  }

  if (
    field.value ===
      null ||
    field.value ===
      undefined
  ) {
    return null;
  }

  return field.value;
}

function acceptedText(
  field:
    OfferScannerField<string>
): string | null {
  return safeString(
    acceptedScannerFieldValue(
      field
    )
  );
}

function acceptedNumber(
  field:
    OfferScannerField<number>
): number | null {
  return safeNumber(
    acceptedScannerFieldValue(
      field
    )
  );
}

function acceptedInteger(
  field:
    OfferScannerField<number>
): number | null {
  return safeInteger(
    acceptedScannerFieldValue(
      field
    )
  );
}

function acceptedDate(
  field:
    OfferScannerField<string>
): Date | null {
  return safeDate(
    acceptedScannerFieldValue(
      field
    )
  );
}

function acceptedEnum(
  field:
    OfferScannerField<string>
): string | null {
  return safeString(
    acceptedScannerFieldValue(
      field
    )
  );
}

/* ============================================================
   RUNTIME SHAPE CHECK

   TypeScript types disappear at runtime.

   We therefore perform a minimum structural check before passing
   untrusted JSON into scanner-validation.ts.
============================================================ */

function looksLikeScannedOffer(
  value: unknown
): value is ScannedOfferLetter {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof candidate.scanId !==
      "string"
  ) {
    return false;
  }

  if (
    !candidate.metadata ||
    typeof candidate.metadata !==
      "object"
  ) {
    return false;
  }

  if (
    !candidate.employer ||
    typeof candidate.employer !==
      "object"
  ) {
    return false;
  }

  if (
    !candidate.cash ||
    typeof candidate.cash !==
      "object"
  ) {
    return false;
  }

  if (
    !candidate.equity ||
    typeof candidate.equity !==
      "object"
  ) {
    return false;
  }

  if (
    !candidate.benefits ||
    typeof candidate.benefits !==
      "object"
  ) {
    return false;
  }

  if (
    !candidate.specialConditions ||
    typeof candidate.specialConditions !==
      "object"
  ) {
    return false;
  }

  return true;
}

/* ============================================================
   FILE METADATA
============================================================ */

function parseFileMetadata(
  value: unknown
): {
  originalFileName:
    string | null;

  mimeType:
    string | null;

  fileSizeBytes:
    number | null;

  pageCount:
    number | null;
} {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return {
      originalFileName:
        null,

      mimeType:
        null,

      fileSizeBytes:
        null,

      pageCount:
        null,
    };
  }

  const input =
    value as
      FileMetadataInput;

  return {
    originalFileName:
      safeString(
        input.originalFileName
      ),

    mimeType:
      safeString(
        input.mimeType
      ),

    fileSizeBytes:
      safePositiveInteger(
        input.fileSizeBytes
      ),

    pageCount:
      safePositiveInteger(
        input.pageCount
      ),
  };
}

/* ============================================================
   JSON SERIALIZATION

   Prisma Json fields require JSON-compatible values.

   JSON.parse(JSON.stringify(...)) also strips undefined values.
============================================================ */

function toPrismaJson(
  value: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(
      value
    )
  ) as Prisma.InputJsonValue;
}

/* ============================================================
   SOURCE
============================================================ */

function parseSource(
  value: unknown
):
  | "PDF_UPLOAD"
  | "MANUAL" {
  return value ===
    "MANUAL"
    ? "MANUAL"
    : "PDF_UPLOAD";
}

/* ============================================================
   SIDE

   Current persistence model stores an independent offer record.

   Side A/B belongs to a comparison session rather than the
   underlying offer itself, but we accept it now so the API
   response can preserve the user's workflow.
============================================================ */

function parseSide(
  value: unknown
):
  | "A"
  | "B" {
  return value === "B"
    ? "B"
    : "A";
}

/* ============================================================
   POST
============================================================ */

export async function POST(
  request:
    NextRequest
) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION

       Matches existing /api/calculator route exactly:
       cookie name = "token"
    ---------------------------------------------------------- */

    const token =
      request.cookies.get(
        "token"
      )?.value;

    if (!token) {
      return errorResponse(
        "Not authenticated",
        401,
        "NOT_AUTHENTICATED"
      );
    }

    const userId =
      await getSessionUserId(
        token
      );

    if (!userId) {
      return errorResponse(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    /* ----------------------------------------------------------
       REQUEST BODY
    ---------------------------------------------------------- */

    let body:
      ConfirmOfferRequestBody;

    try {
      body =
        (await request.json()) as
          ConfirmOfferRequestBody;
    } catch {
      return errorResponse(
        "The request body is not valid JSON.",
        400,
        "INVALID_JSON"
      );
    }

    if (
      !looksLikeScannedOffer(
        body.scan
      )
    ) {
      return errorResponse(
        "A valid reviewed scanner result is required.",
        400,
        "INVALID_SCAN"
      );
    }

    const scan =
      body.scan;

    const side =
      parseSide(
        body.side
      );

    const source =
      parseSource(
        body.source
      );

    const fileMetadata =
      parseFileMetadata(
        body.fileMetadata
      );

    /* ==========================================================
       SERVER-SIDE REVALIDATION

       This is what fixes the stale-warning problem.

       The browser has changed reviewStatus values to CONFIRMED /
       EDITED. We now rebuild validation from those current values.
    ========================================================== */

    const validation =
      validateScannedOffer(
        scan
      );

    /* ----------------------------------------------------------
       SAVE-BLOCKING ISSUES

       Required cash and document facts must be resolved before
       persistence. Equity-only gaps remain auditable but do not
       stop a cash-ready offer from being saved.
    ---------------------------------------------------------- */

    const saveBlockingIssues =
      validation.blockingIssues.filter(
        isSaveBlockingIssue
      );

    if (
      saveBlockingIssues.length >
        0
    ) {
      return errorResponse(
        "This offer is missing required information that must be resolved before it can be created.",
        422,
        "OFFER_BLOCKED",
        {
          blockingIssues:
            saveBlockingIssues,

          deferredEquityIssues:
            validation.blockingIssues.filter(
              (issue) =>
                !isSaveBlockingIssue(
                  issue
                )
            ),

          warnings:
            validation
              .warnings,

          informationalIssues:
            validation
              .informationalIssues,

          readiness:
            validation
              .readiness,
        }
      );
    }

    /* ----------------------------------------------------------
       CRITICAL REVIEW

       Prevent:
       scan -> skip review -> directly call API
    ---------------------------------------------------------- */

    if (
      !validation
        .criticalFieldsReviewed
    ) {
      return errorResponse(
        "Review and confirm all critical offer fields before creating the offer.",
        422,
        "CRITICAL_REVIEW_REQUIRED",
        {
          readiness:
            validation
              .readiness,

          warnings:
            validation
              .warnings,
        }
      );
    }

    /* ----------------------------------------------------------
       COMPARISON READINESS

       A saved offer must be ready for a guaranteed-cash
       comparison. Equity may be confirmed absent, ready to
       value, unknown, or incomplete; those states are preserved
       for the comparison experience.
    ---------------------------------------------------------- */

    if (
      !validation
        .readiness
        .canCompareGuaranteedCash
    ) {
      return errorResponse(
        "Confirm the required cash information before creating this offer.",
        422,
        "GUARANTEED_CASH_NOT_READY",
        {
          readiness:
            validation
              .readiness,

          warnings:
            validation
              .warnings,

          informationalIssues:
            validation
              .informationalIssues,
        }
      );
    }

    /* ==========================================================
       NORMALIZATION

       This invokes our existing confirmed-only trust bridge.

       UNREVIEWED extracted values do NOT become engine inputs.
    ========================================================== */

    const normalization =
      normalizeConfirmedScannedOffer(
        scan,
        side
      );

    const normalizedOffer =
      normalization.offer;

    /* ----------------------------------------------------------
       REQUIRED CONFIRMED IDENTITY

       Validation already checks these, but this gives DB
       persistence a final explicit guard.
    ---------------------------------------------------------- */

    const companyName =
      acceptedText(
        scan.employer
          .companyName
      );

    const roleTitle =
      acceptedText(
        scan.employer
          .roleTitle
      );

    const fixedSalary =
      acceptedNumber(
        scan.cash
          .fixedSalary
      );

    if (
      !companyName
    ) {
      return errorResponse(
        "Confirm the company name before creating the offer.",
        422,
        "COMPANY_NAME_REQUIRED"
      );
    }

    if (
      !roleTitle
    ) {
      return errorResponse(
        "Confirm the role title before creating the offer.",
        422,
        "ROLE_TITLE_REQUIRED"
      );
    }

    if (
      fixedSalary ===
        null ||
      fixedSalary <= 0
    ) {
      return errorResponse(
        "Confirm a valid fixed salary before creating the offer.",
        422,
        "FIXED_SALARY_REQUIRED"
      );
    }

    /* ==========================================================
       SNAPSHOTS

       rawScanSnapshot:
       Prefer the untouched original scan sent separately by UI.

       confirmedScanSnapshot:
       Current reviewed scanner object.

       normalizedSnapshot:
       Exact normalized OfferInput used by the engines.

       validationSnapshot:
       Fresh server validation AFTER user confirmation.
    ========================================================== */

    const rawSnapshot =
      body.rawScanSnapshot &&
      looksLikeScannedOffer(
        body.rawScanSnapshot
      )
        ? body.rawScanSnapshot
        : scan;

    const validationSnapshot =
      {
        completeness:
          validation
            .completeness,

        readiness:
          validation
            .readiness,

        blockingIssues:
          validation
            .blockingIssues,

        warnings:
          validation
            .warnings,

        informationalIssues:
          validation
            .informationalIssues,

        criticalFieldsReviewed:
          validation
            .criticalFieldsReviewed,

        equityCriticalFieldsReviewed:
          validation
            .equityCriticalFieldsReviewed,

        normalizationWarnings:
          normalization
            .warnings,

        acceptedPaths:
          normalization
            .acceptedPaths,

        ignoredPaths:
          normalization
            .ignoredPaths,

        confirmedAt:
          new Date()
            .toISOString(),
      };

    /* ==========================================================
       PERSIST

       We store only accepted CONFIRMED / EDITED scanner values.

       Missing/unreviewed optional values remain null.
    ========================================================== */

    const confirmedAt =
      new Date();

    const offer =
      await prisma
        .offerIntelligence
        .create({
          data: {
            userId,

            status:
              "CONFIRMED",

            source,

            /* --------------------------------------------------
               IDENTITY
            -------------------------------------------------- */

            companyName,

            roleTitle,

            location:
              acceptedText(
                scan.employer
                  .location
              ),

            employmentType:
              acceptedEnum(
                scan.employer
                  .employmentType
              ),

            workMode:
              acceptedEnum(
                scan.employer
                  .workMode
              ),

            joiningDate:
              acceptedDate(
                scan.employer
                  .joiningDate
              ),

            currency:
              scan.metadata
                .currency ||
              "INR",

            /* --------------------------------------------------
               CASH
            -------------------------------------------------- */

            headlineCTC:
              acceptedNumber(
                scan.cash
                  .headlineCTC
              ),

            fixedSalary,

            basicSalary:
              acceptedNumber(
                scan.cash
                  .basicSalary
              ),

            hra:
              acceptedNumber(
                scan.cash.hra
              ),

            specialAllowance:
              acceptedNumber(
                scan.cash
                  .specialAllowance
              ),

            otherFixedAllowance:
              acceptedNumber(
                scan.cash
                  .otherFixedAllowance
              ),

            targetVariablePay:
              acceptedNumber(
                scan.cash
                  .targetVariablePay
              ),

            maximumVariablePay:
              acceptedNumber(
                scan.cash
                  .maximumVariablePay
              ),

            joiningBonus:
              acceptedNumber(
                scan.cash
                  .joiningBonus
              ),

            retentionBonus:
              acceptedNumber(
                scan.cash
                  .retentionBonus
              ),

            relocationBonus:
              acceptedNumber(
                scan.cash
                  .relocationBonus
              ),

            performanceBonus:
              acceptedNumber(
                scan.cash
                  .performanceBonus
              ),

            employerPF:
              acceptedNumber(
                scan.cash
                  .employerPF
              ),

            gratuity:
              acceptedNumber(
                scan.cash
                  .gratuity
              ),

            insuranceValue:
              acceptedNumber(
                scan.cash
                  .insuranceValue
              ),

            otherEmployerBenefits:
              acceptedNumber(
                scan.cash
                  .otherEmployerBenefits
              ),

            /* --------------------------------------------------
               EQUITY
            -------------------------------------------------- */

            equityType:
              acceptedEnum(
                scan.equity.type
              ),

            companyEquityStatus:
              acceptedEnum(
                scan.equity
                  .companyStatus
              ),

            employerHeadlineEquityValue:
              acceptedNumber(
                scan.equity
                  .employerHeadlineEquityValue
              ),

            totalOptionsOrShares:
              acceptedInteger(
                scan.equity
                  .totalOptionsOrShares
              ),

            exercisePrice:
              acceptedNumber(
                scan.equity
                  .exercisePrice
              ),

            currentFMV:
              acceptedNumber(
                scan.equity
                  .currentFMV
              ),

            listedSharePrice:
              acceptedNumber(
                scan.equity
                  .listedSharePrice
              ),

            companyValuation:
              acceptedNumber(
                scan.equity
                  .companyValuation
              ),

            totalCompanyShares:
              acceptedNumber(
                scan.equity
                  .totalCompanyShares
              ),

            ownershipPercentage:
              acceptedNumber(
                scan.equity
                  .ownershipPercentage
              ),

            vestingDurationMonths:
              acceptedInteger(
                scan.equity
                  .vestingDurationMonths
              ),

            cliffMonths:
              acceptedInteger(
                scan.equity
                  .cliffMonths
              ),

            vestingFrequency:
              acceptedEnum(
                scan.equity
                  .vestingFrequency
              ),

            vestingStartDate:
              acceptedDate(
                scan.equity
                  .vestingStartDate
              ),

            grantDate:
              acceptedDate(
                scan.equity
                  .grantDate
              ),

            expiryDate:
              acceptedDate(
                scan.equity
                  .expiryDate
              ),

            postTerminationExerciseDays:
              acceptedInteger(
                scan.equity
                  .postTerminationExerciseDays
              ),

            expectedDilutionPercentage:
              acceptedNumber(
                scan.equity
                  .expectedDilutionPercentage
              ),

            /* --------------------------------------------------
               FILE METADATA

               Prefer upload metadata supplied by the page.

               Fall back to scanner metadata where possible.
            -------------------------------------------------- */

            originalFileName:
              fileMetadata
                .originalFileName ??
              safeString(
                scan.metadata
                  .fileName
              ),

            mimeType:
              fileMetadata
                .mimeType,

            fileSizeBytes:
              fileMetadata
                .fileSizeBytes,

            pageCount:
              fileMetadata
                .pageCount ??
              safePositiveInteger(
                scan.metadata
                  .pageCount
              ),

            /* --------------------------------------------------
               AUDIT SNAPSHOTS
            -------------------------------------------------- */

            rawScanSnapshot:
              toPrismaJson(
                rawSnapshot
              ),

            confirmedScanSnapshot:
              toPrismaJson(
                scan
              ),

            normalizedSnapshot:
              toPrismaJson(
                normalizedOffer
              ),

            validationSnapshot:
              toPrismaJson(
                validationSnapshot
              ),

            confirmedAt,
          },
          select: {
            id:
              true,

            status:
              true,

            source:
              true,

            companyName:
              true,

            roleTitle:
              true,

            location:
              true,

            currency:
              true,

            headlineCTC:
              true,

            fixedSalary:
              true,

            targetVariablePay:
              true,

            joiningBonus:
              true,

            equityType:
              true,

            totalOptionsOrShares:
              true,

            exercisePrice:
              true,

            currentFMV:
              true,

            vestingDurationMonths:
              true,

            cliffMonths:
              true,

            vestingFrequency:
              true,

            confirmedAt:
              true,

            createdAt:
              true,
          },
        });

    /* ==========================================================
       SUCCESS

       Remaining genuine warnings are returned to the UI.

       Stale UNREVIEWED warnings disappear because validation was
       recalculated from the reviewed scan.
    ========================================================== */

    return successResponse(
      {
        message:
          "Offer created successfully.",

        offerId:
          offer.id,

        side,

        offer,

        readiness:
          validation
            .readiness,

        warnings:
          validation
            .warnings,

        informationalIssues:
          validation
            .informationalIssues,

        normalizationWarnings:
          normalization
            .warnings,

        nextAction: {
          type:
            "ADD_SECOND_OFFER",

          label:
            "Compare with another offer",

          suggestedSide:
            side === "A"
              ? "B"
              : "A",
        },
      },
      201
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "POST /api/pro/offers/confirm error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create the offer.";

    return errorResponse(
      message,
      500,
      "OFFER_CREATE_FAILED"
    );
  }
}
