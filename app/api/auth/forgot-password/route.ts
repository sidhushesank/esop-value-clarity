import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-development-key";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists, a password reset email has been sent.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "ESOP Value Clarity <onboarding@resend.dev>",
      to: user.email,
      subject: "Reset your ESOP Value Clarity password",

      html: `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:40px;">
        <div style="max-width:600px;margin:auto;background:white;border-radius:16px;padding:40px;border:1px solid #e5e7eb;">

          <h1 style="margin:0;color:#0f172a;">
            ESOP Value Clarity
          </h1>

          <p style="margin-top:30px;font-size:18px;">
            Hi ${user.name},
          </p>

          <p style="color:#475569;line-height:1.7;">
            We received a request to reset your password.
            Click the button below to choose a new password.
          </p>

          <div style="margin:40px 0;text-align:center;">
            <a
              href="${resetLink}"
              style="
                background:#2563eb;
                color:white;
                padding:16px 30px;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
                display:inline-block;
              "
            >
              Reset Password
            </a>
          </div>

          <p style="color:#64748b;">
            This link expires in <strong>15 minutes</strong>.
          </p>

          <p style="color:#64748b;">
            If you didn't request this password reset,
            you can safely ignore this email.
          </p>

          <hr style="margin:35px 0;border:none;border-top:1px solid #e5e7eb;" />

          <p style="font-size:13px;color:#94a3b8;">
            © ${new Date().getFullYear()} ESOP Value Clarity
          </p>

        </div>
      </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send reset email.",
      },
      {
        status: 500,
      }
    );
  }
}