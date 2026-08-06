import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validators";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Read request body
    const body = await request.json();

    // Validate request
    const data = signupSchema.parse(body);

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered",
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
    });

    // Generate JWT
    const token = generateToken(user.id);

const response = NextResponse.json(
  {
    success: true,
    message: "Account created successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  },
  { status: 201 }
);

response.cookies.set("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
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
        status: 400,
      }
    );

  }
}