import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if guest already exists
    const existingGuest = request.cookies.get("guest_id");

    if (existingGuest) {
      return NextResponse.json({
        success: true,
        guestId: existingGuest.value,
        message: "Guest already exists",
      });
    }

    // Generate new guest id
    const guestId = uuidv4();

    // Save in database
    await prisma.guestSession.create({
      data: {
        guestId,
        usageCount: 0,
      },
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        guestId,
        message: "Guest created successfully",
      },
      {
        status: 201,
      }
    );

    // Store cookie
    response.cookies.set("guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
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