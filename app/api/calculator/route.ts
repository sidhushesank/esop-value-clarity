import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

/* ===========================
   GET ALL CALCULATIONS
=========================== */

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
        }
      );
    }

    const calculations = await prisma.calculation.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        calculations,
      },
      {
        status: 200,
      }
    );
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

/* ===========================
   CREATE CALCULATION
=========================== */

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        {
          status: 401,
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

    if (
      esopsGranted === undefined ||
      vestedPercentage === undefined ||
      currentValuation === undefined ||
      dilutionPercentage === undefined ||
      exitValuation === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       ESOP CALCULATIONS
    =========================== */

    const TOTAL_SHARES = 1_000_000;

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

    /* ===========================
       SAVE TO DATABASE
    =========================== */

    const calculation = await prisma.calculation.create({
      data: {
        userId,

        esopsGranted: Number(esopsGranted),
        vestedPercentage: Number(vestedPercentage),
        currentValuation: Number(currentValuation),
        dilutionPercentage: Number(dilutionPercentage),
        exitValuation: Number(exitValuation),

        vestedShares,
        valueToday,
        afterDilution,
        exitValue,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Calculation saved successfully",
        calculation,
      },
      {
        status: 201,
      }
    );
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