import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const userId = getUserIdFromToken(token);

  if (!userId) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
    },
  });

  if (!admin) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (admin.accountStatus !== "ACTIVE") {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Account is not active",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (admin.role !== "ADMIN") {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    success: true as const,
    admin,
  };
}