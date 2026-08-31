import { NextResponse } from "next/server";

import {
  EsopClauseImportance,
  EsopClauseType,
  EsopDocumentStatus,
  EsopFieldStatus,
  EsopGrantStatus,
  EsopVestingFrequency,
  UserActivityType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

import {
  downloadEsopDocument,
} from "@/lib/supabase-storage";

import {
  extractPdfText,
} from "@/lib/esop/grants/pdf-extract";

import {
  ruleExtractGrant,
  type LocalFieldStatus,
  type LocalGrantExtraction,
} from "@/lib/esop/grants/rule-extract";

export const runtime = "nodejs";

/* ============================================================================
 * FIELD DEFINITIONS
 * ========================================================================== */

const FIELD_DEFINITIONS = [
  {
    key: "companyName",
    label: "Company",
  },
  {
    key: "grantName",
    label: "Grant name",
  },
  {
    key: "grantDate",
    label: "Grant date",
  },
  {
    key: "optionCount",
    label: "Options granted",
  },
  {
    key: "strikePrice",
    label: "Exercise price",
  },
  {
    key: "currency",
    label: "Currency",
  },
  {
    key: "vestingStartDate",
    label: "Vesting start date",
  },
  {
    key: "vestingDurationMonths",
    label: "Vesting duration",
  },
  {
    key: "cliffMonths",
    label: "Cliff period",
  },
  {
    key: "vestingFrequency",
    label: "Vesting frequency",
  },
  {
    key: "expiryDate",
    label: "Option expiry date",
  },
  {
    key: "postTerminationExerciseDays",
    label: "Post-termination exercise window",
  },
] as const;

/* ============================================================================
 * ROUTE
 * ========================================================================== */

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      documentId: string;
    }>;
  }
) {
  let currentDocumentId: string | null = null;
  let currentUserId: string | null = null;

  try {
    /* ======================================================================
     * AUTH
     * ==================================================================== */

    const { user } =
      await requireProUser();

    currentUserId = user.id;

    const { documentId } =
      await context.params;

    currentDocumentId =
      documentId;

    /* ======================================================================
     * LOAD DOCUMENT
     * ==================================================================== */

    const document =
      await prisma.esopDocument.findFirst({
        where: {
          id: documentId,
          userId: user.id,
          deletedAt: null,
        },

        select: {
          id: true,
          status: true,
          storageKey: true,
          originalFileName: true,
          mimeType: true,
          fileSizeBytes: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          code: "DOCUMENT_NOT_FOUND",
          message:
            "This grant document could not be found in your workspace.",
        },
        {
          status: 404,
        }
      );
    }

    if (!document.storageKey) {
      return NextResponse.json(
        {
          success: false,
          code: "DOCUMENT_NOT_STORED",
          message:
            "This document is not available in secure storage.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      document.mimeType !==
      "application/pdf"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "UNSUPPORTED_DOCUMENT",
          message:
            "Only PDF grant documents can be processed right now.",
        },
        {
          status: 400,
        }
      );
    }

    /* ======================================================================
     * MARK PROCESSING
     * ==================================================================== */

    await prisma.esopDocument.update({
      where: {
        id: document.id,
      },

      data: {
        status:
          EsopDocumentStatus.PROCESSING,

        processingStartedAt:
          new Date(),

        processedAt: null,

        extractionError: null,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: user.id,

        type:
          UserActivityType
            .ESOP_DOCUMENT_PROCESSING_STARTED,

        metadata: {
          documentId:
            document.id,

          originalFileName:
            document.originalFileName,
        },
      },
    });

    /* ======================================================================
     * DOWNLOAD PRIVATE PDF
     * ==================================================================== */

    const storedFile =
      await downloadEsopDocument(
        document.storageKey
      );

    const arrayBuffer =
      await storedFile.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    /* ======================================================================
     * PDF TEXT EXTRACTION
     * ==================================================================== */

    const extracted =
      await extractPdfText(buffer);

    const readableCharacterCount =
      extracted.text
        .replace(/\s/g, "")
        .length;

    if (
      readableCharacterCount < 25
    ) {
      return await failDocument({
        documentId:
          document.id,

        userId:
          user.id,

        message:
          "No readable text could be extracted from this PDF. It may be scanned or image-only.",

        reason:
          "NO_READABLE_TEXT",

        extractedText: {
          text:
            extracted.text,

          pageCount:
            extracted.pageCount,

          pages:
            extracted.pages,
        },

        statusCode: 422,
      });
    }

    /* ======================================================================
     * FREE LOCAL GRANT INTELLIGENCE
     * ==================================================================== */

    const intelligence =
      ruleExtractGrant(
        extracted.text
      );

    console.log(
      "[GRANT_INTELLIGENCE]",
      {
        documentId:
          document.id,

        type:
          intelligence.documentType,

        confidence:
          intelligence.documentConfidence,

        warnings:
          intelligence.warnings,
      }
    );

    /* ======================================================================
     * NON-ESOP DOCUMENT
     * ==================================================================== */

    if (
      intelligence.documentType ===
      "NON_ESOP"
    ) {
      await prisma.$transaction(
        async (tx) => {
          /*
           * Remove structured records from an earlier run,
           * if this document has been reprocessed.
           */

          await tx.esopDocumentClause.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          await tx.esopGrant.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          await tx.esopDocument.update({
            where: {
              id:
                document.id,
            },

            data: {
              status:
                EsopDocumentStatus.REVIEW_REQUIRED,

              processedAt:
                new Date(),

              extractionError:
                null,

              extractedText: {
                text:
                  extracted.text,

                pageCount:
                  extracted.pageCount,

                pages:
                  extracted.pages,
              },

              extractionData: {
                ...intelligence,

                result:
                  "NON_ESOP",
              },
            },
          });
        }
      );

      await prisma.userActivity.create({
        data: {
          userId:
            user.id,

          type:
            UserActivityType
              .ESOP_DOCUMENT_PROCESSED,

          metadata: {
            documentId:
              document.id,

            pageCount:
              extracted.pageCount,

            documentType:
              intelligence.documentType,

            documentConfidence:
              intelligence.documentConfidence,

            structuredGrantCreated:
              false,
          },
        },
      });

      return NextResponse.json({
        success: true,

        document: {
          id:
            document.id,

          status:
            EsopDocumentStatus.REVIEW_REQUIRED,

          originalFileName:
            document.originalFileName,
        },

        extraction: {
          pageCount:
            extracted.pageCount,

          characterCount:
            extracted.text.length,
        },

        intelligence: {
          documentType:
            intelligence.documentType,

          documentTypeReason:
            intelligence.documentTypeReason,

          documentConfidence:
            intelligence.documentConfidence,

          isGrantDocument:
            false,

          grantCreated:
            false,

          fieldCount: 0,

          clauseCount: 0,

          warnings:
            intelligence.warnings,
        },
      });
    }

    /* ======================================================================
     * UNKNOWN DOCUMENT
     *
     * We retain the analysis but do NOT create a trusted grant automatically.
     * ==================================================================== */

    if (
      intelligence.documentType ===
      "UNKNOWN"
    ) {
      await prisma.$transaction(
        async (tx) => {
          await tx.esopDocumentClause.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          await tx.esopGrant.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          await tx.esopDocument.update({
            where: {
              id:
                document.id,
            },

            data: {
              status:
                EsopDocumentStatus.REVIEW_REQUIRED,

              processedAt:
                new Date(),

              extractionError:
                null,

              extractedText: {
                text:
                  extracted.text,

                pageCount:
                  extracted.pageCount,

                pages:
                  extracted.pages,
              },

              extractionData: {
                ...intelligence,

                result:
                  "UNKNOWN_DOCUMENT",
              },
            },
          });
        }
      );

      await prisma.userActivity.create({
        data: {
          userId:
            user.id,

          type:
            UserActivityType
              .ESOP_DOCUMENT_PROCESSED,

          metadata: {
            documentId:
              document.id,

            documentType:
              intelligence.documentType,

            documentConfidence:
              intelligence.documentConfidence,

            structuredGrantCreated:
              false,
          },
        },
      });

      return NextResponse.json({
        success: true,

        document: {
          id:
            document.id,

          status:
            EsopDocumentStatus.REVIEW_REQUIRED,

          originalFileName:
            document.originalFileName,
        },

        extraction: {
          pageCount:
            extracted.pageCount,

          characterCount:
            extracted.text.length,
        },

        intelligence: {
          documentType:
            intelligence.documentType,

          documentTypeReason:
            intelligence.documentTypeReason,

          documentConfidence:
            intelligence.documentConfidence,

          isGrantDocument:
            false,

          grantCreated:
            false,

          fieldCount: 0,

          clauseCount: 0,

          warnings:
            intelligence.warnings,
        },
      });
    }

    /* ======================================================================
     * CREATE STRUCTURED GRANT
     * ==================================================================== */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-analysis should rebuild the extracted structure
           * rather than creating duplicates.
           */

          await tx.esopDocumentClause.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          await tx.esopGrant.deleteMany({
            where: {
              documentId:
                document.id,
            },
          });

          /* ==================================================================
           * GRANT
           * ================================================================ */

          const grant =
            await tx.esopGrant.create({
              data: {
                userId:
                  user.id,

                documentId:
                  document.id,

                status:
                  EsopGrantStatus.REVIEW_REQUIRED,

                companyName:
                  intelligence
                    .companyName
                    .value,

                grantName:
                  intelligence
                    .grantName
                    .value,

                grantDate:
                  parseExtractionDate(
                    intelligence
                      .grantDate
                      .value
                  ),

                optionCount:
                  intelligence
                    .optionCount
                    .value,

                strikePrice:
                  intelligence
                    .strikePrice
                    .value,

                /*
                 * Never silently assume INR.
                 */
                currency:
                  intelligence
                    .currency
                    .value ??
                  "UNKNOWN",

                vestingStartDate:
                  parseExtractionDate(
                    intelligence
                      .vestingStartDate
                      .value
                  ),

                vestingDurationMonths:
                  intelligence
                    .vestingDurationMonths
                    .value,

                cliffMonths:
                  intelligence
                    .cliffMonths
                    .value,

                vestingFrequency:
                  mapVestingFrequency(
                    intelligence
                      .vestingFrequency
                      .value
                  ),

                expiryDate:
                  parseExtractionDate(
                    intelligence
                      .expiryDate
                      .value
                  ),

                postTerminationExerciseDays:
                  intelligence
                    .postTerminationExerciseDays
                    .value,
              },
            });

          /* ==================================================================
           * FIELD EVIDENCE
           * ================================================================ */

          for (
            const definition of
            FIELD_DEFINITIONS
          ) {
            const field =
              intelligence[
                definition.key
              ];

            await tx.esopGrantField.create({
              data: {
                grantId:
                  grant.id,

                fieldKey:
                  definition.key,

                label:
                  definition.label,

                status:
                  mapFieldStatus(
                    field.status
                  ),

                sourceText:
                  field.evidence,

                sourcePage:
                  field.sourcePage,

                /*
                 * Prisma Json cannot receive undefined.
                 *
                 * Null/missing values are represented by the field status,
                 * so we only write extractedValue when we have a value.
                 */
                ...(field.value !==
                null
                  ? {
                      extractedValue:
                        field.value,
                    }
                  : {}),
              },
            });
          }

          /* ==================================================================
           * CLAUSE INTELLIGENCE
           * ================================================================ */

          if (
            intelligence.clauses
              .length > 0
          ) {
            await tx.esopDocumentClause.createMany({
              data:
                intelligence.clauses.map(
                  (clause) => ({
                    documentId:
                      document.id,

                    type:
                      mapClauseType(
                        clause.type
                      ),

                    importance:
                      mapClauseImportance(
                        clause.importance
                      ),

                    title:
                      clause.title,

                    summary:
                      clause.summary,

                    extractedText:
                      clause.extractedText,

                    fieldStatus:
                      mapFieldStatus(
                        clause.fieldStatus
                      ),

                    sourcePage:
                      clause.sourcePage,
                  })
                ),
            });
          }

          /* ==================================================================
           * DOCUMENT INTELLIGENCE
           * ================================================================ */

          await tx.esopDocument.update({
            where: {
              id:
                document.id,
            },

            data: {
              status:
                EsopDocumentStatus.REVIEW_REQUIRED,

              processedAt:
                new Date(),

              extractionError:
                null,

              extractedText: {
                text:
                  extracted.text,

                pageCount:
                  extracted.pageCount,

                pages:
                  extracted.pages,
              },

              extractionData: {
                ...intelligence,

                result:
                  "GRANT_EXTRACTED",
              },
            },
          });

          return {
            grant,

            fieldCount:
              FIELD_DEFINITIONS.length,

            clauseCount:
              intelligence.clauses
                .length,
          };
        }
      );

    /* ======================================================================
     * ACTIVITY
     * ==================================================================== */

    await prisma.userActivity.create({
      data: {
        userId:
          user.id,

        type:
          UserActivityType
            .ESOP_DOCUMENT_PROCESSED,

        metadata: {
          documentId:
            document.id,

          grantId:
            result.grant.id,

          pageCount:
            extracted.pageCount,

          documentType:
            intelligence.documentType,

          documentConfidence:
            intelligence.documentConfidence,

          fieldCount:
            result.fieldCount,

          clauseCount:
            result.clauseCount,

          warnings:
            intelligence.warnings,
        },
      },
    });

    /* ======================================================================
     * SUCCESS
     * ==================================================================== */

    return NextResponse.json({
      success: true,

      document: {
        id:
          document.id,

        status:
          EsopDocumentStatus.REVIEW_REQUIRED,

        originalFileName:
          document.originalFileName,
      },

      extraction: {
        pageCount:
          extracted.pageCount,

        characterCount:
          extracted.text.length,
      },

      intelligence: {
        documentType:
          intelligence.documentType,

        documentTypeReason:
          intelligence.documentTypeReason,

        documentConfidence:
          intelligence.documentConfidence,

        isGrantDocument:
          true,

        grantCreated:
          true,

        grantId:
          result.grant.id,

        fieldCount:
          result.fieldCount,

        clauseCount:
          result.clauseCount,

        warnings:
          intelligence.warnings,
      },
    });
  } catch (error) {
    /* ======================================================================
     * AUTH ERRORS
     * ==================================================================== */

    const accessError =
      getProAccessErrorResponse(
        error
      );

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status:
            accessError.status,
        }
      );
    }

    console.error(
      "[ESOP_DOCUMENT_PROCESS_ERROR]",
      error
    );

    /* ======================================================================
     * NEVER LEAVE PROCESSING STUCK
     * ==================================================================== */

    if (
      currentDocumentId &&
      currentUserId
    ) {
      try {
        await prisma.esopDocument.updateMany({
          where: {
            id:
              currentDocumentId,

            userId:
              currentUserId,

            deletedAt:
              null,
          },

          data: {
            status:
              EsopDocumentStatus.FAILED,

            processedAt:
              new Date(),

            extractionError:
              error instanceof Error
                ? error.message.slice(
                    0,
                    1000
                  )
                : "Unexpected document processing error.",
          },
        });

        await prisma.userActivity.create({
          data: {
            userId:
              currentUserId,

            type:
              UserActivityType
                .ESOP_DOCUMENT_FAILED,

            metadata: {
              documentId:
                currentDocumentId,

              reason:
                "PROCESSING_EXCEPTION",
            },
          },
        });
      } catch (
        cleanupError
      ) {
        console.error(
          "[ESOP_DOCUMENT_PROCESS_FAILURE_CLEANUP_ERROR]",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        code:
          "PROCESSING_FAILED",

        message:
          "We could not interpret this grant document. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================================
 * FAILURE HELPER
 * ========================================================================== */

async function failDocument({
  documentId,
  userId,
  message,
  reason,
  extractedText,
  statusCode,
}: {
  documentId: string;
  userId: string;
  message: string;
  reason: string;
  extractedText?: unknown;
  statusCode: number;
}) {
  await prisma.esopDocument.update({
    where: {
      id: documentId,
    },

    data: {
      status:
        EsopDocumentStatus.FAILED,

      processedAt:
        new Date(),

      extractionError:
        message,

      ...(extractedText
        ? {
            extractedText:
              extractedText as never,
          }
        : {}),
    },
  });

  await prisma.userActivity.create({
    data: {
      userId,

      type:
        UserActivityType
          .ESOP_DOCUMENT_FAILED,

      metadata: {
        documentId,
        reason,
      },
    },
  });

  return NextResponse.json(
    {
      success: false,
      code: reason,
      message,
    },
    {
      status:
        statusCode,
    }
  );
}

/* ============================================================================
 * FIELD STATUS
 * ========================================================================== */

function mapFieldStatus(
  status: LocalFieldStatus
): EsopFieldStatus {
  switch (status) {
    case "VERIFIED":
      return EsopFieldStatus.VERIFIED;

    case "NOT_FOUND":
      return EsopFieldStatus.NOT_FOUND;

    case "REVIEW":
    default:
      return EsopFieldStatus.REVIEW;
  }
}

/* ============================================================================
 * VESTING FREQUENCY
 * ========================================================================== */

function mapVestingFrequency(
  value:
    LocalGrantExtraction[
      "vestingFrequency"
    ]["value"]
): EsopVestingFrequency {
  switch (value) {
    case "MONTHLY":
      return EsopVestingFrequency.MONTHLY;

    case "QUARTERLY":
      return EsopVestingFrequency.QUARTERLY;

    case "SEMI_ANNUAL":
      return EsopVestingFrequency.SEMI_ANNUAL;

    case "ANNUAL":
      return EsopVestingFrequency.ANNUAL;

    case "CUSTOM":
      return EsopVestingFrequency.CUSTOM;

    case "UNKNOWN":
    case null:
    default:
      return EsopVestingFrequency.UNKNOWN;
  }
}

/* ============================================================================
 * CLAUSE TYPE
 * ========================================================================== */

function mapClauseType(
  value:
    LocalGrantExtraction[
      "clauses"
    ][number]["type"]
): EsopClauseType {
  switch (value) {
    case "TERMINATION":
      return EsopClauseType.TERMINATION;

    case "EXERCISE_WINDOW":
      return EsopClauseType.EXERCISE_WINDOW;

    case "FORFEITURE":
      return EsopClauseType.FORFEITURE;

    case "CHANGE_OF_CONTROL":
      return EsopClauseType.CHANGE_OF_CONTROL;

    case "ACCELERATION":
      return EsopClauseType.ACCELERATION;

    case "EXPIRY":
      return EsopClauseType.EXPIRY;

    case "VESTING":
      return EsopClauseType.VESTING;

    case "TRANSFER_RESTRICTION":
      return EsopClauseType.TRANSFER_RESTRICTION;

    case "REPURCHASE":
      return EsopClauseType.REPURCHASE;

    case "LIQUIDITY":
      return EsopClauseType.LIQUIDITY;

    case "TAX":
      return EsopClauseType.TAX;

    case "OTHER":
    default:
      return EsopClauseType.OTHER;
  }
}

/* ============================================================================
 * CLAUSE IMPORTANCE
 * ========================================================================== */

function mapClauseImportance(
  value:
    LocalGrantExtraction[
      "clauses"
    ][number]["importance"]
): EsopClauseImportance {
  switch (value) {
    case "CRITICAL":
      return EsopClauseImportance.CRITICAL;

    case "HIGH":
      return EsopClauseImportance.HIGH;

    case "MEDIUM":
      return EsopClauseImportance.MEDIUM;

    case "LOW":
    default:
      return EsopClauseImportance.LOW;
  }
}

/* ============================================================================
 * DATE NORMALIZATION
 * ========================================================================== */

function parseExtractionDate(
  value: string | null
): Date | null {
  if (!value) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}