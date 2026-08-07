import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FREE_LIMIT = 3;
const TOTAL_SHARES = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    const guestId = request.cookies.get("guestId")?.value;

    if (!guestId) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest session not found.",
        },
        {
          status: 401,
        }
      );
    }

    const guest = await prisma.guestSession.findUnique({
      where: {
        guestId,
      },
    });

    if (!guest) {
      return NextResponse.json(
        {
          success: false,
          message: "Guest session not found.",
        },
        {
          status: 401,
        }
      );
    }

    if (guest.usageCount >= FREE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          limitReached: true,
          message: "Free guest limit reached.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const {
      esopsGranted,
      vestedPercentage,
      currentValuation,
      dilutionPercentage,
      exitValuation,
    } = body;

    const vestedShares =
      (Number(esopsGranted) * Number(vestedPercentage)) / 100;

    const valueToday =
      (vestedShares / TOTAL_SHARES) * Number(currentValuation);

    const afterDilution =
      valueToday * (1 - Number(dilutionPercentage) / 100);

    const exitValue =
      (vestedShares / TOTAL_SHARES) *
      Number(exitValuation) *
      (1 - Number(dilutionPercentage) / 100);

    await prisma.guestSession.update({
      where: {
        guestId,
      },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      remaining: FREE_LIMIT - (guest.usageCount + 1),
      calculation: {
        vestedShares,
        valueToday,
        afterDilution,
        exitValue,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}