import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validators";
import { recordProfileUpdatedActivity } from "@/lib/activity";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // ============================================================
    // GET JWT FROM COOKIE
    // ============================================================

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

    // ============================================================
    // GET USER ID FROM TOKEN
    // ============================================================

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

    // ============================================================
    // READ + VALIDATE REQUEST BODY
    // ============================================================

    const body = await request.json();

    const data = updateProfileSchema.parse(body);

    // ============================================================
    // UPDATE USER PROFILE
    // ============================================================

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name,
      },
    });

    // ============================================================
    // RECORD PROFILE ACTIVITY
    // ============================================================

    await recordProfileUpdatedActivity(user.id);

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0].message,
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "========== PROFILE UPDATE ERROR =========="
    );
    console.error(error);
    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}