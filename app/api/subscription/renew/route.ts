import { NextRequest, NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
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

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Subscription not found.",
        },
        { status: 404 }
      );
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return NextResponse.json({
        success: true,
        message: "Subscription is already active.",
      });
    }

    await prisma.subscription.update({
      where: {
        userId,
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Auto-renew enabled successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to renew subscription.",
      },
      {
        status: 500,
      }
    );
  }
}