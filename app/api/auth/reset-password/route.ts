import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-development-key";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const payload = jwt.verify(
      token,
      JWT_SECRET
    ) as {
      userId: string;
    };

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: {
        id: payload.userId,
      },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Reset link expired or invalid.",
      },
      {
        status: 400,
      }
    );
  }
}