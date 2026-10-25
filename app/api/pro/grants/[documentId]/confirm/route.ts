import { NextResponse } from "next/server";
import {
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

export async function POST(
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
        status: true,
        confirmedAt: true,
        grants: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
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
              },
            },
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
        { status: 404 }
      );
    }

    const grant = document.grants[0] ?? null;

    if (!grant) {
      return NextResponse.json(
        {
          success: false,
          code: "GRANT_NOT_FOUND",
          message:
            "No structured grant is available to confirm for this document.",
        },
        { status: 409 }
      );
    }

    if (
      document.status === EsopDocumentStatus.CONFIRMED ||
      grant.status === EsopGrantStatus.CONFIRMED
    ) {
      return NextResponse.json({
        success: true,
        grant: {
          id: grant.id,
          status: EsopGrantStatus.CONFIRMED,
          confirmedAt: document.confirmedAt,
        },
        document: {
          id: document.id,
          status: EsopDocumentStatus.CONFIRMED,
          confirmedAt: document.confirmedAt,
        },
      });
    }

    if (grant.fields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_REVIEW_FIELDS",
          message:
            "This grant has no structured fields to confirm.",
        },
        { status: 409 }
      );
    }

    const unresolved = grant.fields.filter(
      (field) =>
        field.status === EsopFieldStatus.REVIEW ||
        field.status === EsopFieldStatus.NOT_FOUND
    );

    if (unresolved.length > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "REVIEW_REQUIRED",
          message: `${unresolved.length} field${
            unresolved.length === 1 ? "" : "s"
          } still need review before this grant can be confirmed.`,
          unresolvedFields: unresolved.map((field) => ({
            id: field.id,
            fieldKey: field.fieldKey,
            label: field.label,
            status: field.status,
          })),
        },
        { status: 409 }
      );
    }

    const values = new Map<string, unknown>();

    for (const field of grant.fields) {
      const value =
        field.status === EsopFieldStatus.USER_CONFIRMED
          ? field.confirmedValue
          : field.extractedValue;

      values.set(field.fieldKey, value);
    }

    const confirmedAt = new Date();

    const grantData = {
      companyName: asNullableString(
        values.get("companyName")
      ),
      grantName: asNullableString(
        values.get("grantName")
      ),
      grantDate: asNullableDate(
        values.get("grantDate")
      ),
      optionCount: asNullableInteger(
        values.get("optionCount")
      ),
      strikePrice: asNullableNumber(
        values.get("strikePrice")
      ),
      currency:
        asNullableString(values.get("currency")) ||
        "UNKNOWN",
      vestingStartDate: asNullableDate(
        values.get("vestingStartDate")
      ),
      vestingDurationMonths: asNullableInteger(
        values.get("vestingDurationMonths")
      ),
      cliffMonths: asNullableInteger(
        values.get("cliffMonths")
      ),
      vestingFrequency: asVestingFrequency(
        values.get("vestingFrequency")
      ),
      expiryDate: asNullableDate(
        values.get("expiryDate")
      ),
      postTerminationExerciseDays: asNullableInteger(
        values.get("postTerminationExerciseDays")
      ),
    };

    const result = await prisma.$transaction(
      async (tx) => {
        const confirmedGrant = await tx.esopGrant.update({
          where: {
            id: grant.id,
          },
          data: {
            ...grantData,
            status: EsopGrantStatus.CONFIRMED,
            confirmedAt,
          },
          select: {
            id: true,
            status: true,
            confirmedAt: true,
          },
        });

        const confirmedDocument =
          await tx.esopDocument.update({
            where: {
              id: document.id,
            },
            data: {
              status: EsopDocumentStatus.CONFIRMED,
              confirmedAt,
            },
            select: {
              id: true,
              status: true,
              confirmedAt: true,
            },
          });

        await tx.userActivity.createMany({
          data: [
            {
              userId: user.id,
              type: UserActivityType.ESOP_GRANT_CONFIRMED,
              metadata: {
                documentId: document.id,
                grantId: grant.id,
              },
            },
            {
              userId: user.id,
              type: UserActivityType.ESOP_DOCUMENT_CONFIRMED,
              metadata: {
                documentId: document.id,
                grantId: grant.id,
              },
            },
          ],
        });

        return {
          grant: confirmedGrant,
          document: confirmedDocument,
        };
      }
    );

    const response = NextResponse.json({
      success: true,
      grant: result.grant,
      document: result.document,
    });

    /*
     * A newly confirmed grant becomes the working grant, so the
     * analysis pages follow the grant the user just confirmed.
     * Older grants keep their saved journeys and can be reopened
     * from the Grant Vault.
     */
    response.cookies.set(
      "evc-active-grant-id",
      result.grant.id,
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      }
    );

    return response;
  } catch (error) {
    const accessError = getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        { status: accessError.status }
      );
    }

    console.error(
      "[ESOP_GRANT_CONFIRM_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "GRANT_CONFIRM_FAILED",
        message:
          "We could not confirm this grant. Please try again.",
      },
      { status: 500 }
    );
  }
}

function asNullableString(
  value: unknown
): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function asNullableInteger(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    /^\d+$/.test(value)
  ) {
    return Number.parseInt(value, 10);
  }

  return null;
}

function asNullableNumber(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }

  return null;
}

function asNullableDate(
  value: unknown
): Date | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function asVestingFrequency(
  value: unknown
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
    default:
      return EsopVestingFrequency.UNKNOWN;
  }
}