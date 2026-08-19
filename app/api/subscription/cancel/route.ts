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

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      return NextResponse.json({
        success: true,
        message: "Subscription already cancelled.",
      });
    }

    await prisma.subscription.update({
      where: {
        userId,
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Subscription cancelled. Your PRO access will continue until it expires.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to cancel subscription.",
      },
      {
        status: 500,
      }
    );
  }
}