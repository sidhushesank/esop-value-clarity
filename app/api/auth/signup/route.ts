import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { randomBytes, createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    // Read request body
    const body = await request.json();

    // Validate request
    const data = signupSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      // Already verified
      if (existingUser.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already registered.",
          },
          {
            status: 400,
          }
        );
      }

      // User exists but is NOT verified
      // Remove old verification tokens
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: existingUser.id,
        },
      });

      // Generate new token
      const rawToken = randomBytes(32).toString("hex");

      const tokenHash = createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await prisma.emailVerificationToken.create({
        data: {
          userId: existingUser.id,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl = new URL(request.url).origin;

      const verificationUrl =
        `${baseUrl}/verify-email?token=${rawToken}`;

      await sendVerificationEmail(
        existingUser.email,
        existingUser.name,
        verificationUrl
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "Verification email sent again. Please check your inbox.",
        },
        {
          status: 200,
        }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        emailVerified: false,
      },
    });

    // Generate verification token
    const rawToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = new URL(request.url).origin;

    const verificationUrl =
      `${baseUrl}/verify-email?token=${rawToken}`;

    await sendVerificationEmail(
      user.email,
      user.name,
      verificationUrl
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account before logging in.",
      },
      {
        status: 201,
      }
    );
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

    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating your account.",
      },
      {
        status: 500,
      }
    );
  }
}