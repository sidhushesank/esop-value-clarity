import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please login again.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const existingEntry = await prisma.proWaitlist.findUnique({
      where: {
        userId,
      },
    });

    if (existingEntry) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        message: "You're already on the PRO waitlist.",
      });
    }

    await prisma.proWaitlist.create({
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyJoined: false,
      message: "You're on the PRO waitlist!",
    });
  } catch (error) {
    console.error("Waitlist error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}