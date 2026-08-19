import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

import {
  calculateAdvancedESOP,
  type AdvancedSimulatorInput,
} from "@/lib/esop/simulator";

/* ============================================================
   GET ONE CALCULATION
============================================================ */

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const token =
      request.cookies.get("token")?.value;

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

    const userId =
      getUserIdFromToken(token);

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

    const { id } = await params;

    const calculation =
      await prisma.calculation.findUnique({
        where: {
          id,
        },
      });

    if (!calculation) {
      return NextResponse.json(
        {
          success: false,
          message: "Calculation not found",
        },
        {
          status: 404,
        }
      );
    }

    /* ----------------------------------------------------------
       OWNERSHIP CHECK
    ---------------------------------------------------------- */

    if (calculation.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        calculation,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "GET /api/calculator/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to fetch calculation.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   UPDATE SAVED PRO CALCULATION
============================================================ */

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const token =
      request.cookies.get("token")?.value;

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

    const userId =
      getUserIdFromToken(token);

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

    const { id } = await params;

    const existing =
      await prisma.calculation.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Calculation not found",
        },
        {
          status: 404,
        }
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    /* ----------------------------------------------------------
       We only support updating advanced PRO calculations.
    ---------------------------------------------------------- */

    const {
      name,
      totalShares,
      esopsGranted,
      vestedPercentage,
      strikePrice,
      currentValuation,
      futureDilutionPercentage,
      exitValuation,
    } = body;

    if (
      totalShares === undefined ||
      esopsGranted === undefined ||
      vestedPercentage === undefined ||
      strikePrice === undefined ||
      currentValuation === undefined ||
      futureDilutionPercentage === undefined ||
      exitValuation === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All PRO simulator fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    const advancedInput: AdvancedSimulatorInput = {
      totalShares: Number(totalShares),

      esopsGranted: Number(esopsGranted),

      vestedPercentage:
        Number(vestedPercentage),

      strikePrice:
        Number(strikePrice),

      currentValuation:
        Number(currentValuation),

      futureDilutionPercentage:
        Number(futureDilutionPercentage),

      exitValuation:
        Number(exitValuation),
    };

    const invalid =
      Object.values(advancedInput).some(
        (value) =>
          !Number.isFinite(value)
      );

    if (invalid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All PRO simulator values must be valid numbers.",
        },
        {
          status: 400,
        }
      );
    }

    /* ----------------------------------------------------------
       RECALCULATE
    ---------------------------------------------------------- */

    const result =
      calculateAdvancedESOP(
        advancedInput
      );

    /* ----------------------------------------------------------
       UPDATE
    ---------------------------------------------------------- */

    const calculation =
      await prisma.calculation.update({
        where: {
          id,
        },

        data: {
          name:
            typeof name === "string" &&
            name.trim().length > 0
              ? name.trim()
              : null,

          /* Existing compatibility fields */
          esopsGranted:
            Math.round(
              advancedInput.esopsGranted
            ),

          vestedPercentage:
            advancedInput.vestedPercentage,

          currentValuation:
            advancedInput.currentValuation,

          dilutionPercentage:
            advancedInput.futureDilutionPercentage,

          exitValuation:
            advancedInput.exitValuation,

          vestedShares:
            result.vestedShares,

          valueToday:
            result.grossValueToday,

          afterDilution:
            result.grossExitValue,

          exitValue:
            result.netExitProceeds,

          /* PRO fields */
          totalShares:
            advancedInput.totalShares,

          strikePrice:
            advancedInput.strikePrice,

          unvestedShares:
            result.unvestedShares,

          ownershipPercentage:
            result.ownershipPercentage,

          currentSharePrice:
            result.currentSharePrice,

          grossValueToday:
            result.grossValueToday,

          exerciseCost:
            result.exerciseCost,

          netValueToday:
            result.netValueToday,

          grossExitValue:
            result.grossExitValue,

          dilutionImpact:
            result.dilutionImpact,

          netExitProceeds:
            result.netExitProceeds,

          returnMultiple:
            result.returnMultiple,

          roiPercentage:
            result.roiPercentage,

          breakEvenExitValuation:
            result.breakEvenExitValuation,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "PRO analysis updated successfully.",
        calculation,
        result,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "PUT /api/calculator/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to update calculation.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE CALCULATION
============================================================ */

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const token =
      request.cookies.get("token")?.value;

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

    const userId =
      getUserIdFromToken(token);

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

    const { id } = await params;

    const calculation =
      await prisma.calculation.findUnique({
        where: {
          id,
        },
      });

    if (!calculation) {
      return NextResponse.json(
        {
          success: false,
          message: "Calculation not found",
        },
        {
          status: 404,
        }
      );
    }

    if (calculation.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.calculation.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Calculation deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "DELETE /api/calculator/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to delete calculation.",
      },
      {
        status: 500,
      }
    );
  }
}