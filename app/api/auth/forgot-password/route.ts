import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-development-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("[FORGOT_PASSWORD] Request received.");

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    /*
     * Do not reveal whether the account exists.
     *
     * This prevents attackers from using the forgot-password
     * endpoint to discover registered email addresses.
     */
    if (!user) {
      console.log(
        "[FORGOT_PASSWORD] No matching user found."
      );

      return NextResponse.json({
        success: true,
        message:
          "If an account exists, a password reset email has been sent.",
      });
    }

    console.log(
      "[FORGOT_PASSWORD] User found:",
      user.id
    );

    /* ======================================================= */
    /* ENVIRONMENT VARIABLE CHECKS                             */
    /* ======================================================= */

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!appUrl) {
      console.error(
        "[FORGOT_PASSWORD] NEXT_PUBLIC_APP_URL is missing."
      );

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

    if (!smtpUser) {
      console.error(
        "[FORGOT_PASSWORD] SMTP_USER is missing."
      );

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

    if (!smtpPass) {
      console.error(
        "[FORGOT_PASSWORD] SMTP_PASS is missing."
      );

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

    /* ======================================================= */
    /* CREATE PASSWORD RESET TOKEN                             */
    /* ======================================================= */

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const resetLink =
      `${appUrl}/reset-password?token=` +
      encodeURIComponent(token);

    /* ======================================================= */
    /* CREATE GMAIL SMTP TRANSPORTER                           */
    /* ======================================================= */

    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    /* ======================================================= */
    /* EMAIL                                                  */
    /* ======================================================= */

    const mailFrom =
      process.env.MAIL_FROM ||
      `ESOP Value Clarity <${smtpUser}>`;

    console.log(
      "[FORGOT_PASSWORD] Sending password reset email..."
    );

    const info = await transporter.sendMail({
      from: mailFrom,

      to: user.email,

      subject: "Reset your ESOP Value Clarity password",

      html: `
        <div
          style="
            margin: 0;
            padding: 40px 20px;
            background: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 40px;
              box-sizing: border-box;
            "
          >
            <h1
              style="
                margin: 0;
                color: #0f172a;
                font-size: 26px;
                line-height: 1.3;
              "
            >
              ESOP Value Clarity
            </h1>

            <p
              style="
                margin-top: 30px;
                margin-bottom: 0;
                color: #0f172a;
                font-size: 18px;
                line-height: 1.6;
              "
            >
              Hi ${escapeHtml(user.name || "there")},
            </p>

            <p
              style="
                margin-top: 18px;
                color: #475569;
                font-size: 15px;
                line-height: 1.7;
              "
            >
              We received a request to reset your password.
              Click the button below to choose a new password.
            </p>

            <div
              style="
                margin: 40px 0;
                text-align: center;
              "
            >
              <a
                href="${resetLink}"
                style="
                  display: inline-block;
                  padding: 16px 30px;
                  background: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 10px;
                  font-size: 15px;
                  font-weight: 700;
                "
              >
                Reset Password
              </a>
            </div>

            <p
              style="
                margin-top: 0;
                color: #64748b;
                font-size: 14px;
                line-height: 1.7;
              "
            >
              This link expires in
              <strong>15 minutes</strong>.
            </p>

            <p
              style="
                color: #64748b;
                font-size: 14px;
                line-height: 1.7;
              "
            >
              If you didn't request this password reset,
              you can safely ignore this email.
            </p>

            <p
              style="
                margin-top: 25px;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.7;
                word-break: break-all;
              "
            >
              If the button does not work, copy and paste this
              link into your browser:
              <br />
              ${resetLink}
            </p>

            <hr
              style="
                margin: 35px 0 25px;
                border: none;
                border-top: 1px solid #e5e7eb;
              "
            />

            <p
              style="
                margin: 0;
                color: #94a3b8;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              © ${new Date().getFullYear()} ESOP Value Clarity
            </p>
          </div>
        </div>
      `,
    });

    console.log(
      "[FORGOT_PASSWORD] Email sent successfully:",
      info.messageId
    );

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error(
      "[FORGOT_PASSWORD] Unexpected error:",
      error
    );

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

/*
 * Basic HTML escaping for values inserted into the
 * HTML email template.
 */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}