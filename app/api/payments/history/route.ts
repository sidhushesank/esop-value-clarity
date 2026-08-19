import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // Authenticate user
    // ---------------------------------------------------------

    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // Fetch payment history
    // ---------------------------------------------------------

    const payments = await prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        plan: true,
        billingCycle: true,
        status: true,
        razorpayPaymentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch payment history.",
      },
      {
        status: 500,
      }
    );
  }
}