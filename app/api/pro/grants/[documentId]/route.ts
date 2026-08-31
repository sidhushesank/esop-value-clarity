import { NextResponse } from "next/server";
import { EsopFieldStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      documentId: string;
    }>;
  }
) {
  try {
    const { user } = await requireProUser();

    const { documentId } = await context.params;

    const document = await prisma.esopDocument.findFirst({
      where: {
        id: documentId,
        userId: user.id,
        deletedAt: null,
      },

      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        fileSizeBytes: true,
        status: true,
        storageKey: true,
        extractionError: true,
        processingStartedAt: true,
        processedAt: true,
        confirmedAt: true,
        createdAt: true,
        updatedAt: true,

        grants: {
          select: {
            id: true,
            status: true,
            companyName: true,
            grantName: true,
            grantDate: true,
            optionCount: true,
            strikePrice: true,
            currency: true,
            vestingStartDate: true,
            vestingDurationMonths: true,
            cliffMonths: true,
            vestingFrequency: true,
            expiryDate: true,
            postTerminationExerciseDays: true,
            notes: true,
            confirmedAt: true,

            fields: {
              orderBy: {
                createdAt: "asc",
              },

              select: {
                id: true,
                fieldKey: true,
                label: true,
                extractedValue: true,
                confirmedValue: true,
                status: true,
                sourceText: true,
                sourcePage: true,
                reviewedAt: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },

        clauses: {
          orderBy: [
            {
              importance: "desc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            type: true,
            importance: true,
            title: true,
            summary: true,
            extractedText: true,
            fieldStatus: true,
            sourcePage: true,
          },
        },
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

    const grant =
      document.grants.length > 0
        ? document.grants[0]
        : null;

    const fields =
      grant?.fields ?? [];

    const totalFields =
      fields.length;

    const verifiedFields =
  fields.filter(
    (field) =>
      field.status ===
      EsopFieldStatus.VERIFIED
  ).length;

    const userConfirmedFields =
  fields.filter(
    (field) =>
      field.status ===
      EsopFieldStatus.USER_CONFIRMED
  ).length;

    const reviewFields =
      fields.filter(
        (field) =>
          field.status === "REVIEW"
      ).length;

    const notFoundFields =
      fields.filter(
        (field) =>
          field.status === "NOT_FOUND"
      ).length;

    const unresolvedFields =
      fields.filter(
        (field) =>
          field.status === "REVIEW" ||
          field.status === "NOT_FOUND"
      ).length;

    const canConfirm =
      Boolean(grant) &&
      totalFields > 0 &&
      unresolvedFields === 0 &&
      grant?.status !== "CONFIRMED" &&
      document.status !== "CONFIRMED";

    const reviewSummary = {
      totalFields,
      verifiedFields,
      userConfirmedFields,
      reviewFields,
      notFoundFields,
      unresolvedFields,
      clauseCount:
        document.clauses.length,
      canConfirm,
      isConfirmed:
        document.status ===
          "CONFIRMED" ||
        grant?.status ===
          "CONFIRMED",
    };

    return NextResponse.json({
      success: true,

      document: {
        ...document,

        reviewSummary,
      },
    });
  } catch (error) {
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
      "[ESOP_GRANT_DOCUMENT_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "DOCUMENT_LOAD_FAILED",
        message:
          "We could not load this grant document. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}