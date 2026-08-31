import { NextResponse } from "next/server";
import {
  EsopFieldStatus,
  EsopVestingFrequency,
  Prisma,
  UserActivityType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

const SUPPORTED_FIELD_KEYS = new Set([
  "companyName",
  "grantName",
  "grantDate",
  "optionCount",
  "strikePrice",
  "currency",
  "vestingStartDate",
  "vestingDurationMonths",
  "cliffMonths",
  "vestingFrequency",
  "expiryDate",
  "postTerminationExerciseDays",
]);

const VESTING_FREQUENCIES = new Set([
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "CUSTOM",
  "UNKNOWN",
]);

type ReviewAction =
  | "ACCEPT"
  | "UPDATE"
  | "CONFIRM_MISSING";

type ReviewBody = {
  fieldId?: unknown;
  action?: unknown;
  value?: unknown;
};

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      documentId: string;
    }>;
  }
) {
  try {
    const { user } = await requireProUser();
    const { documentId } = await context.params;

    const body = (await request.json()) as ReviewBody;

    const fieldId =
      typeof body.fieldId === "string"
        ? body.fieldId.trim()
        : "";

    const action =
      typeof body.action === "string"
        ? (body.action as ReviewAction)
        : null;

    if (!fieldId) {
      return NextResponse.json(
        {
          success: false,
          code: "FIELD_ID_REQUIRED",
          message: "A grant field is required.",
        },
        { status: 400 }
      );
    }

    if (
      !action ||
      !["ACCEPT", "UPDATE", "CONFIRM_MISSING"].includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REVIEW_ACTION",
          message: "This review action is not supported.",
        },
        { status: 400 }
      );
    }

    const document = await prisma.esopDocument.findFirst({
      where: {
        id: documentId,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        grants: {
          select: {
            id: true,
            status: true,
            fields: {
              where: {
                id: fieldId,
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

    if (document.status === "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          code: "GRANT_ALREADY_CONFIRMED",
          message:
            "This grant is already confirmed and can no longer be edited from the review workspace.",
        },
        { status: 409 }
      );
    }

    const grant = document.grants.find(
      (item) => item.fields.length > 0
    );

    const field = grant?.fields[0];

    if (!grant || !field) {
      return NextResponse.json(
        {
          success: false,
          code: "FIELD_NOT_FOUND",
          message:
            "This extracted grant field could not be found.",
        },
        { status: 404 }
      );
    }

    if (!SUPPORTED_FIELD_KEYS.has(field.fieldKey)) {
      return NextResponse.json(
        {
          success: false,
          code: "UNSUPPORTED_FIELD",
          message:
            "This field cannot be edited through the grant review workspace.",
        },
        { status: 400 }
      );
    }

    let confirmedValue:
      | Prisma.InputJsonValue
      | typeof Prisma.JsonNull;

    if (action === "ACCEPT") {
      if (
        field.extractedValue === null ||
        field.extractedValue === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "NO_EXTRACTED_VALUE",
            message:
              "There is no extracted value to accept for this field.",
          },
          { status: 400 }
        );
      }

      confirmedValue =
        field.extractedValue as Prisma.InputJsonValue;
    } else if (action === "CONFIRM_MISSING") {
      if (field.status !== EsopFieldStatus.NOT_FOUND) {
        return NextResponse.json(
          {
            success: false,
            code: "FIELD_IS_NOT_MISSING",
            message:
              "Only fields that were not found can be confirmed as absent from the source document.",
          },
          { status: 400 }
        );
      }

      confirmedValue = Prisma.JsonNull;
    } else {
      const validation = validateReviewedValue(
        field.fieldKey,
        body.value
      );

      if (!validation.ok) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_FIELD_VALUE",
            message: validation.message,
          },
          { status: 400 }
        );
      }

      confirmedValue =
        validation.value === null
          ? Prisma.JsonNull
          : (validation.value as Prisma.InputJsonValue);
    }

    const reviewedAt = new Date();
    const effectiveValue =
      action === "CONFIRM_MISSING"
        ? null
        : action === "ACCEPT"
        ? field.extractedValue
        : body.value;

    const updatedField = await prisma.$transaction(
      async (tx) => {
        const savedField = await tx.esopGrantField.update({
          where: {
            id: field.id,
          },
          data: {
            confirmedValue,
            status: EsopFieldStatus.USER_CONFIRMED,
            reviewedAt,
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
          },
        });

        await tx.esopGrant.update({
          where: {
            id: grant.id,
          },
          data: buildGrantUpdate(
            field.fieldKey,
            effectiveValue
          ),
        });

        await tx.userActivity.createMany({
          data: [
            {
              userId: user.id,
              type: UserActivityType.ESOP_DOCUMENT_REVIEWED,
              metadata: {
                documentId,
                grantId: grant.id,
                fieldId: field.id,
                fieldKey: field.fieldKey,
                action,
              },
            },
            {
              userId: user.id,
              type: UserActivityType.ESOP_GRANT_UPDATED,
              metadata: {
                documentId,
                grantId: grant.id,
                fieldId: field.id,
                fieldKey: field.fieldKey,
              },
            },
          ],
        });

        return savedField;
      }
    );

    return NextResponse.json({
      success: true,
      field: updatedField,
    });
  } catch (error) {
    const accessError = getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        { status: accessError.status }
      );
    }

    console.error(
      "[ESOP_GRANT_FIELD_REVIEW_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "FIELD_REVIEW_FAILED",
        message:
          "We could not save this reviewed field. Please try again.",
      },
      { status: 500 }
    );
  }
}

function buildGrantUpdate(
  fieldKey: string,
  value: unknown
): Prisma.EsopGrantUpdateInput {
  switch (fieldKey) {
    case "companyName":
      return {
        companyName:
          typeof value === "string" && value.trim()
            ? value.trim()
            : null,
      };

    case "grantName":
      return {
        grantName:
          typeof value === "string" && value.trim()
            ? value.trim()
            : null,
      };

    case "grantDate":
      return {
        grantDate: toNullableDate(value),
      };

    case "optionCount":
      return {
        optionCount:
          typeof value === "number" &&
          Number.isInteger(value)
            ? value
            : null,
      };

    case "strikePrice":
      return {
        strikePrice:
          typeof value === "number" &&
          Number.isFinite(value)
            ? value
            : null,
      };

    case "currency":
      return {
        currency:
          typeof value === "string" && value.trim()
            ? value.trim().toUpperCase()
            : "UNKNOWN",
      };

    case "vestingStartDate":
      return {
        vestingStartDate: toNullableDate(value),
      };

    case "vestingDurationMonths":
      return {
        vestingDurationMonths:
          typeof value === "number" &&
          Number.isInteger(value)
            ? value
            : null,
      };

    case "cliffMonths":
      return {
        cliffMonths:
          typeof value === "number" &&
          Number.isInteger(value)
            ? value
            : null,
      };

    case "vestingFrequency":
      return {
        vestingFrequency: toVestingFrequency(value),
      };

    case "expiryDate":
      return {
        expiryDate: toNullableDate(value),
      };

    case "postTerminationExerciseDays":
      return {
        postTerminationExerciseDays:
          typeof value === "number" &&
          Number.isInteger(value)
            ? value
            : null,
      };

    default:
      return {};
  }
}

function toNullableDate(
  value: unknown
): Date | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function toVestingFrequency(
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

function validateReviewedValue(
  fieldKey: string,
  value: unknown
):
  | { ok: true; value: string | number | null }
  | { ok: false; message: string } {
  if (value === null || value === undefined) {
    return {
      ok: false,
      message:
        "Enter a value, or mark the field as not provided in the source document.",
    };
  }

  if (
    [
      "companyName",
      "grantName",
      "currency",
    ].includes(fieldKey)
  ) {
    if (typeof value !== "string" || !value.trim()) {
      return {
        ok: false,
        message: "Enter a valid text value.",
      };
    }

    return {
      ok: true,
      value: value.trim().slice(0, 180),
    };
  }

  if (
    [
      "grantDate",
      "vestingStartDate",
      "expiryDate",
    ].includes(fieldKey)
  ) {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !isValidIsoDate(value)
    ) {
      return {
        ok: false,
        message:
          "Enter a valid date in YYYY-MM-DD format.",
      };
    }

    return { ok: true, value };
  }

  if (fieldKey === "vestingFrequency") {
    if (
      typeof value !== "string" ||
      !VESTING_FREQUENCIES.has(value)
    ) {
      return {
        ok: false,
        message:
          "Select a valid vesting frequency.",
      };
    }

    return { ok: true, value };
  }

  if (fieldKey === "strikePrice") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return {
        ok: false,
        message:
          "Enter a valid exercise price of zero or greater.",
      };
    }

    return { ok: true, value };
  }

  if (
    [
      "optionCount",
      "vestingDurationMonths",
      "cliffMonths",
      "postTerminationExerciseDays",
    ].includes(fieldKey)
  ) {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      return {
        ok: false,
        message:
          "Enter a valid whole number of zero or greater.",
      };
    }

    return { ok: true, value };
  }

  return {
    ok: false,
    message: "This field type is not supported.",
  };
}

function isValidIsoDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
