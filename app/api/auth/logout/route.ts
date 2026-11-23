import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { recordLogoutActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  // ============================================================
  // GET CURRENT USER FROM TOKEN
  // ============================================================

  const token = request.cookies.get("token")?.value;

  if (token) {
    const userId = await getSessionUserId(token);

    if (userId) {
      await recordLogoutActivity(userId);
    }
  }

  // ============================================================
  // CREATE RESPONSE
  // ============================================================

  const response = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
    },
    {
      status: 200,
    }
  );

  // ============================================================
  // CLEAR JWT COOKIE
  // ============================================================

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}