import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

export async function GET(
  request: Request
) {
  try {
    const { user } = await requireProUser();

    const url = new URL(request.url);
    const requestedGrantId =
      url.searchParams.get("grantId")?.trim() ||
      null;

    const grant = await prisma.esopGrant.findFirst({
      where: {
        userId: user.id,
        status: "CONFIRMED",
        archivedAt: null,
        ...(requestedGrantId
          ? {
              id: requestedGrantId,
            }
          : {}),
      },
      orderBy: requestedGrantId
        ? undefined
        : [
            {
              confirmedAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
      select: {
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
      },
    });

    if (
      requestedGrantId &&
      !grant
    ) {
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