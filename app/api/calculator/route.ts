import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

import {
  calculateAdvancedESOP,
  type AdvancedSimulatorInput,
} from "@/lib/esop/simulator";

/* ============================================================
   GET ALL CALCULATIONS
============================================================ */

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
    console.error("GET /api/calculator error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to fetch calculations.",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   CREATE CALCULATION
   Supports:
   1. Existing FREE calculator
   2. New PRO advanced simulator
============================================================ */

export async function POST(request: NextRequest) {
  try {
    /* ----------------------------------------------------------
       AUTHENTICATION
    ---------------------------------------------------------- */

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

    /* ----------------------------------------------------------
       REQUEST BODY
    ---------------------------------------------------------- */

    const body = await request.json();

    const {
      name,

      esopsGranted,
      vestedPercentage,
      currentValuation,
      dilutionPercentage,
      exitValuation,

      // PRO fields
      totalShares,
      strikePrice,
      futureDilutionPercentage,
    } = body;

    /* ----------------------------------------------------------
       BASIC REQUIRED FIELDS
       These are shared by FREE + PRO.
    ---------------------------------------------------------- */

    if (
      esopsGranted === undefined ||
      vestedPercentage === undefined ||
      currentValuation === undefined ||
      exitValuation === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required calculation fields are missing.",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================================================
       PRO SIMULATOR
    ========================================================== */

    const isProCalculation =
      totalShares !== undefined ||
      strikePrice !== undefined ||
      futureDilutionPercentage !== undefined;

    if (isProCalculation) {
      /* --------------------------------------------------------
         PRO REQUIRED FIELDS
      -------------------------------------------------------- */

      if (
        totalShares === undefined ||
        strikePrice === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Total shares and strike price are required for PRO simulations.",
          },
          {
            status: 400,
          }
        );
      }

      const advancedInput: AdvancedSimulatorInput = {
        totalShares: Number(totalShares),

        esopsGranted: Number(esopsGranted),

        vestedPercentage: Number(vestedPercentage),

        strikePrice: Number(strikePrice),

        currentValuation: Number(currentValuation),

        futureDilutionPercentage: Number(
          futureDilutionPercentage ??
            dilutionPercentage ??
            0
        ),

        exitValuation: Number(exitValuation),
      };

      /* --------------------------------------------------------
         VALIDATE NUMBERS
      -------------------------------------------------------- */

      const numericValues = Object.values(
        advancedInput
      );

      const containsInvalidNumber =
        numericValues.some(
          (value) => !Number.isFinite(value)
        );

      if (containsInvalidNumber) {
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

      /* --------------------------------------------------------
         CALCULATE USING THE SAME ENGINE AS THE UI
      -------------------------------------------------------- */

      const result =
        calculateAdvancedESOP(advancedInput);

      /* --------------------------------------------------------
         SAVE PRO CALCULATION
      --------------------------------------------------------

         The old fields are still populated for compatibility
         with existing FREE history/dashboard functionality.

         New PRO fields contain the actual advanced model.
      -------------------------------------------------------- */

      const calculation =
        await prisma.calculation.create({
          data: {
            userId,

            /* Existing fields */
            esopsGranted:
              Math.round(advancedInput.esopsGranted),

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

            name:
              typeof name === "string" &&
              name.trim().length > 0
                ? name.trim()
                : null,
          },
        });

      return NextResponse.json(
        {
          success: true,
          message:
            "PRO analysis saved successfully.",
          calculation,
          result,
        },
        {
          status: 201,
        }
      );
    }

    /* ==========================================================
       EXISTING FREE SIMULATOR
       DO NOT CHANGE ITS CALCULATION LOGIC
    ========================================================== */

    if (dilutionPercentage === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    const TOTAL_SHARES = 1_000_000;

    const vestedShares =
      (Number(esopsGranted) *
        Number(vestedPercentage)) /
      100;

    const valueToday =
      (vestedShares / TOTAL_SHARES) *
      Number(currentValuation);

    const afterDilution =
      valueToday *
      (1 -
        Number(dilutionPercentage) / 100);

    const exitValue =
      (vestedShares / TOTAL_SHARES) *
      Number(exitValuation) *
      (1 -
        Number(dilutionPercentage) / 100);

    /* ----------------------------------------------------------
       SAVE FREE CALCULATION
    ---------------------------------------------------------- */

    const calculation =
      await prisma.calculation.create({
        data: {
          userId,

          esopsGranted:
            Number(esopsGranted),

          vestedPercentage:
            Number(vestedPercentage),

          currentValuation:
            Number(currentValuation),

          dilutionPercentage:
            Number(dilutionPercentage),

          exitValuation:
            Number(exitValuation),

          vestedShares,

          valueToday,

          afterDilution,

          exitValue,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Calculation saved successfully",
        calculation,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "POST /api/calculator error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to save calculation.",
      },
      {
        status: 500,
      }
    );
  }
}