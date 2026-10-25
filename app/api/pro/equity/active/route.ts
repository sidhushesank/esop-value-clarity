import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

const ACTIVE_GRANT_COOKIE =
  "evc-active-grant-id";

const ACTIVE_GRANT_SELECT = {
  id: true,
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
  confirmedAt: true,
  document: {
    select: {
      id: true,
      originalFileName: true,
      status: true,
    },
  },
} as const;

export async function GET(
  request: Request
) {
  try {
    const { user } = await requireProUser();

    const url = new URL(request.url);

    const queryGrantId =
      url.searchParams.get("grantId")?.trim() ||
      null;

    /*
     * Working-grant cookie.
     *
     * Set by the Equity page ("Open journey") so every Pro page that
     * calls this endpoint without an explicit grantId keeps working on
     * the grant the user chose, instead of silently jumping to the
     * newest confirmed grant.
     *
     * Priority:
     *   1. explicit ?grantId=  (404 if it is not the user's grant)
     *   2. working-grant cookie (silently ignored if stale/invalid)
     *   3. newest confirmed grant
     */
    const cookieStore = await cookies();

    const cookieGrantId =
      cookieStore
        .get(ACTIVE_GRANT_COOKIE)
        ?.value?.trim() || null;

    const baseWhere = {
      userId: user.id,
      status: "CONFIRMED" as const,
      archivedAt: null,
    };

    const newestFirst = [
      { confirmedAt: "desc" as const },
      { createdAt: "desc" as const },
    ];

    let grant = null;

    if (queryGrantId) {
      grant = await prisma.esopGrant.findFirst({
        where: {
          ...baseWhere,
          id: queryGrantId,
        },
        select: ACTIVE_GRANT_SELECT,
      });

      if (!grant) {
        return NextResponse.json(
          {
            success: false,
            code: "CONFIRMED_GRANT_NOT_FOUND",
            message:
              "This confirmed grant could not be found in your equity profile.",
          },
          {
            status: 404,
          }
        );
      }
    } else {
      if (cookieGrantId) {
        grant = await prisma.esopGrant.findFirst({
          where: {
            ...baseWhere,
            id: cookieGrantId,
          },
          select: ACTIVE_GRANT_SELECT,
        });
      }

      if (!grant) {
        grant = await prisma.esopGrant.findFirst({
          where: baseWhere,
          orderBy: newestFirst,
          select: ACTIVE_GRANT_SELECT,
        });
      }
    }

    return NextResponse.json({
      success: true,
      grant,
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
      "[ESOP_ACTIVE_EQUITY_GRANT_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "ACTIVE_GRANT_LOAD_FAILED",
        message:
          "We could not load your confirmed grant. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
