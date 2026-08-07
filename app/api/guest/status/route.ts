import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const FREE_LIMIT = 3;

export async function GET(request: NextRequest) {
  try {
    let guestId = request.cookies.get("guestId")?.value;

    if (!guestId) {
      guestId = randomUUID();

      await prisma.guestSession.create({
        data: {
          guestId,
        },
      });

      const response = NextResponse.json({
        success: true,
        used: 0,
        remaining: FREE_LIMIT,
        limit: FREE_LIMIT,
        limitReached: false,
      });

      response.cookies.set("guestId", guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });

      return response;
    }

    let guest = await prisma.guestSession.findUnique({
      where: {
        guestId,
      },
    });

    if (!guest) {
      guest = await prisma.guestSession.create({
        data: {
          guestId,
        },
      });
    }

    const used = guest.usageCount;

    return NextResponse.json({
      success: true,
      used,
      remaining: Math.max(0, FREE_LIMIT - used),
      limit: FREE_LIMIT,
      limitReached: used >= FREE_LIMIT,
    });

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