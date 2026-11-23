import { NextRequest, NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type SortMode = "newest" | "oldest" | "highest" | "lowest";

type ExportCalculation = {
  id: string;
  name: string | null;
  esopsGranted: number;
  vestedPercentage: number;
  vestedShares: number;
  currentValuation: number;
  dilutionPercentage: number;
  exitValuation: number;
  valueToday: number;
  afterDilution: number;
  exitValue: number;
  createdAt: Date;
};

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatDateIST(value: Date) {
  return value.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeIST(value: Date) {
  return value.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function sortCalculations(
  calculations: ExportCalculation[],
  sort: SortMode
) {
  return [...calculations].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "highest":
        return b.exitValue - a.exitValue;
      case "lowest":
        return a.exitValue - b.exitValue;
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
}

function parseSort(value: string | null): SortMode {
  if (
    value === "oldest" ||
    value === "highest" ||
    value === "lowest"
  ) {
    return value;
  }

  return "newest";
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = await getSessionUserId(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const requestedIds = (request.nextUrl.searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const sort = parseSort(request.nextUrl.searchParams.get("sort"));

    const calculations = await prisma.calculation.findMany({
      where: {
        userId,
        ...(requestedIds.length > 0
          ? { id: { in: requestedIds } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        esopsGranted: true,
        vestedPercentage: true,
        vestedShares: true,
        currentValuation: true,
        dilutionPercentage: true,
        exitValuation: true,
        valueToday: true,
        afterDilution: true,
        exitValue: true,
        createdAt: true,
      },
    });

    const byId = new Map(calculations.map((calculation) => [calculation.id, calculation]));
    const orderedCalculations = requestedIds.length
      ? requestedIds
          .map((id) => byId.get(id))
          .filter((calculation): calculation is ExportCalculation => Boolean(calculation))
      : sortCalculations(calculations, sort);

    const totalCurrentValue = orderedCalculations.reduce(
      (total, calculation) => total + calculation.valueToday,
      0
    );
    const highestModeledExit = orderedCalculations.reduce(
      (highest, calculation) => Math.max(highest, calculation.exitValue),
      0
    );
    const averageVestedPercentage = orderedCalculations.length
      ? orderedCalculations.reduce(
          (total, calculation) => total + calculation.vestedPercentage,
          0
        ) / orderedCalculations.length
      : 0;

    const reportRows: Array<Array<string | number>> = [
      ["ESOP VALUE CLARITY — SCENARIO LEDGER"],
      ["Generated on (IST)", formatDateTimeIST(new Date())],
      [
        "Export scope",
        requestedIds.length > 0 ? "Visible filtered scenarios" : "All saved scenarios",
      ],
      ["Currency", "INR"],
      ["Scenarios exported", orderedCalculations.length],
      [],
      ["PORTFOLIO SUMMARY"],
      ["Metric", "Value"],
      ["Total current modeled value (INR)", totalCurrentValue],
      ["Highest modeled exit value (INR)", highestModeledExit],
      ["Average vested percentage", `${averageVestedPercentage.toFixed(1)}%`],
      [],
      ["SCENARIO DETAILS"],
      [
        "Scenario name",
        "Calculation ID",
        "Status",
        "Created date (IST)",
        "Created at (ISO 8601)",
        "ESOPs granted",
        "Vested percentage",
        "Vested shares",
        "Current valuation (INR)",
        "Dilution percentage",
        "Exit valuation (INR)",
        "Value today (INR)",
        "Value after dilution (INR)",
        "Modeled exit value (INR)",
      ],
      ...orderedCalculations.map((calculation) => [
        calculation.name?.trim() || "ESOP scenario",
        calculation.id,
        "Saved",
        formatDateIST(calculation.createdAt),
        calculation.createdAt.toISOString(),
        calculation.esopsGranted,
        `${calculation.vestedPercentage}%`,
        calculation.vestedShares,
        calculation.currentValuation,
        `${calculation.dilutionPercentage}%`,
        calculation.exitValuation,
        calculation.valueToday,
        calculation.afterDilution,
        calculation.exitValue,
      ]),
    ];

    const csv = reportRows
      .map((row) => row.map((value) => csvCell(value)).join(","))
      .join("\r\n");

    const fileDate = new Date().toISOString().slice(0, 10);

    return new NextResponse(`\ufeff${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="esop-value-clarity-scenario-ledger-${fileDate}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/calculator/export error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to export calculation history.",
      },
      { status: 500 }
    );
  }
}