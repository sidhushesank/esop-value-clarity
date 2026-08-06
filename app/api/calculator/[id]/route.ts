import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const calculation = await prisma.calculation.findUnique({
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const calculation = await prisma.calculation.findUnique({
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
        message: "Calculation deleted successfully",
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