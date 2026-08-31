import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

export async function GET() {
  try {
    const { user } = await requireProUser();

    const grants = await prisma.esopGrant.findMany({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        archivedAt: null,
      },
      orderBy: [
        {
          confirmedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
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
        createdAt: true,
        updatedAt: true,

        document: {
          select: {
            id: true,
            originalFileName: true,
            status: true,
            confirmedAt: true,

            clauses: {
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
              orderBy: [
                {
                  importance: "desc",
                },
                {
                  createdAt: "asc",
                },
              ],
            },
          },
        },

        fields: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const totalOptions = grants.reduce(
      (sum, grant) => sum + (grant.optionCount ?? 0),
      0
    );

    const totalExerciseCost = grants.reduce(
      (sum, grant) =>
        sum +
        (grant.optionCount ?? 0) *
          (grant.strikePrice ?? 0),
      0
    );

    const clauseCount = grants.reduce(
      (sum, grant) =>
        sum +
        (grant.document?.clauses.length ?? 0),
      0
    );

    const expiringWithin365Days = grants.filter(
      (grant) => {
        if (!grant.expiryDate) {
          return false;
        }

        const today = new Date();
        const expiry = new Date(grant.expiryDate);

        const milliseconds =
          expiry.getTime() - today.getTime();

        const days =
          milliseconds /
          (1000 * 60 * 60 * 24);

        return days >= 0 && days <= 365;
      }
    ).length;

    return NextResponse.json({
      success: true,

      summary: {
        confirmedGrantCount: grants.length,
        totalOptions,
        totalExerciseCost,
        clauseCount,
        expiringWithin365Days,
      },

      grants,
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status: accessError.status,
        }
      );
    }

    console.error(
      "[ESOP_EQUITY_PROFILE_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "EQUITY_PROFILE_LOAD_FAILED",
        message:
          "We could not load your equity profile. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
