import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;

/* ============================================================
   HELPERS
============================================================ */

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ============================================================
   POST /api/contact
============================================================ */

export async function POST(request: NextRequest) {
  try {
    /* ========================================================
       SMTP CONFIGURATION

       Uses the SMTP variables already configured in .env.
    ======================================================== */

    const smtpHost =
      process.env.SMTP_HOST?.trim() ||
      "smtp.gmail.com";

    const smtpPort = Number(
      process.env.SMTP_PORT || "587"
    );

    const smtpUser =
      process.env.SMTP_USER?.trim() ||
      process.env.CONTACT_EMAIL?.trim();

    const smtpPass =
      process.env.SMTP_PASS?.replace(/\s/g, "");

    /*
     * Optional separate inbox.
     *
     * If CONTACT_EMAIL exists:
     * enquiries go there.
     *
     * Otherwise:
     * enquiries go to SMTP_USER.
     */

    const contactEmail =
      process.env.CONTACT_EMAIL?.trim() ||
      smtpUser;

    if (
      !smtpUser ||
      !smtpPass ||
      !contactEmail
    ) {
      console.error(
        "[CONTACT] SMTP configuration is incomplete.",
        {
          hasHost: Boolean(smtpHost),
          hasPort: Boolean(smtpPort),
          hasUser: Boolean(smtpUser),
          hasPassword: Boolean(smtpPass),
          hasContactEmail: Boolean(contactEmail),
        }
      );

      return errorResponse(
        "Contact service is temporarily unavailable.",
        500,
        "CONTACT_NOT_CONFIGURED"
      );
    }

    /* ========================================================
       REQUEST BODY
    ======================================================== */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Invalid request.",
        400,
        "INVALID_REQUEST"
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Invalid request.",
        400,
        "INVALID_REQUEST"
      );
    }

    const payload =
      body as Record<string, unknown>;

    const name =
      cleanText(payload.name);

    const email =
      cleanText(payload.email)
        .toLowerCase();

    const message =
      cleanText(payload.message);

    /*
     * Honeypot field.
     *
     * Normal users never see this field.
     * Bots often fill every input.
     */

    const website =
      cleanText(payload.website);

    if (website) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Message received.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (!name) {
      return errorResponse(
        "Please enter your name.",
        400,
        "NAME_REQUIRED"
      );
    }

    if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      return errorResponse(
        "Name is too long.",
        400,
        "NAME_TOO_LONG"
      );
    }

    if (!email) {
      return errorResponse(
        "Please enter your email address.",
        400,
        "EMAIL_REQUIRED"
      );
    }

    if (
      email.length >
        MAX_EMAIL_LENGTH ||
      !isValidEmail(email)
    ) {
      return errorResponse(
        "Please enter a valid email address.",
        400,
        "INVALID_EMAIL"
      );
    }

    if (!message) {
      return errorResponse(
        "Please enter a message.",
        400,
        "MESSAGE_REQUIRED"
      );
    }

    if (message.length < 10) {
      return errorResponse(
        "Please provide a little more detail.",
        400,
        "MESSAGE_TOO_SHORT"
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return errorResponse(
        "Message is too long.",
        400,
        "MESSAGE_TOO_LONG"
      );
    }

    /* ========================================================
       NODEMAILER TRANSPORT
    ======================================================== */

    const transporter =
      nodemailer.createTransport({
        host: smtpHost,

        port: smtpPort,

        /*
         * Gmail:
         *
         * 465 -> secure true
         * 587 -> secure false + STARTTLS
         */

        secure:
          smtpPort === 465,

        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

    /* ========================================================
       SAFE HTML VALUES
    ======================================================== */

    const safeName =
      escapeHtml(name);

    const safeEmail =
      escapeHtml(email);

    const safeMessage =
      escapeHtml(message).replace(
        /\n/g,
        "<br />"
      );

    /* ========================================================
       SEND EMAIL

       FROM:
       Authenticated SMTP Gmail account

       TO:
       ESOP Value Clarity inbox

       REPLY-TO:
       Visitor who submitted the form
    ======================================================== */

    const info =
      await transporter.sendMail({
        from: {
          name:
            "ESOP Value Clarity",
          address: smtpUser,
        },

        to: contactEmail,

        replyTo: {
          name,
          address: email,
        },

        subject:
          `ESOP Value Clarity — New enquiry from ${name}`,

        text: [
          "NEW ESOP VALUE CLARITY ENQUIRY",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          "",
          "Message:",
          message,
          "",
          "----------------------------------------",
          "Submitted through ESOP Value Clarity",
          "",
          "Reply to this email to respond directly to the visitor.",
        ].join("\n"),

        html: `
          <!doctype html>

          <html>
            <body
              style="
                margin:0;
                padding:0;
                background:#f1f5f9;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              "
            >
              <div
                style="
                  max-width:640px;
                  margin:0 auto;
                  padding:32px 16px;
                "
              >

                <!-- HEADER -->

                <div
                  style="
                    background:#020617;
                    border-radius:20px 20px 0 0;
                    padding:28px;
                  "
                >
                  <div
                    style="
                      color:#93c5fd;
                      font-size:11px;
                      font-weight:700;
                      letter-spacing:2px;
                    "
                  >
                    ESOP VALUE CLARITY
                  </div>

                  <h1
                    style="
                      margin:10px 0 0;
                      color:#ffffff;
                      font-size:24px;
                      line-height:1.3;
                    "
                  >
                    New product enquiry
                  </h1>
                </div>

                <!-- CONTENT -->

                <div
                  style="
                    background:#ffffff;
                    padding:28px;
                    border-radius:0 0 20px 20px;
                  "
                >

                  <!-- VISITOR -->

                  <div
                    style="
                      margin-bottom:22px;
                      padding-bottom:22px;
                      border-bottom:1px solid #e2e8f0;
                    "
                  >
                    <div
                      style="
                        color:#64748b;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1px;
                        text-transform:uppercase;
                      "
                    >
                      From
                    </div>

                    <div
                      style="
                        margin-top:7px;
                        color:#0f172a;
                        font-size:18px;
                        font-weight:700;
                      "
                    >
                      ${safeName}
                    </div>

                    <div
                      style="
                        margin-top:4px;
                        color:#2563eb;
                        font-size:14px;
                      "
                    >
                      ${safeEmail}
                    </div>
                  </div>

                  <!-- MESSAGE -->

                  <div>
                    <div
                      style="
                        color:#64748b;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1px;
                        text-transform:uppercase;
                      "
                    >
                      Message
                    </div>

                    <div
                      style="
                        margin-top:10px;
                        color:#334155;
                        font-size:15px;
                        line-height:1.8;
                      "
                    >
                      ${safeMessage}
                    </div>
                  </div>

                  <!-- REPLY INFORMATION -->

                  <div
                    style="
                      margin-top:28px;
                      padding:16px;
                      background:#eff6ff;
                      border:1px solid #dbeafe;
                      border-radius:12px;
                      color:#475569;
                      font-size:12px;
                      line-height:1.7;
                    "
                  >
                    <strong
                      style="
                        color:#0f172a;
                      "
                    >
                      Reply directly
                    </strong>

                    <br />

                    Reply to this email and your
                    response will be addressed to

                    <strong>
                      ${safeEmail}
                    </strong>.
                  </div>

                  <!-- FOOTER -->

                  <div
                    style="
                      margin-top:24px;
                      padding-top:20px;
                      border-top:1px solid #e2e8f0;
                      color:#94a3b8;
                      font-size:11px;
                      line-height:1.6;
                    "
                  >
                    Submitted through the
                    ESOP Value Clarity website
                    contact form.
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      });

    /* ========================================================
       SUCCESS LOG

       Never log SMTP credentials.
    ======================================================== */

    console.log(
      "[CONTACT] Message delivered successfully.",
      {
        fromVisitor: email,
        recipient: contactEmail,
        messageId: info.messageId,
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Thanks for contacting ESOP Value Clarity. Your message has been received.",
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error: unknown) {
    /*
     * Keep detailed SMTP errors
     * server-side only.
     */

    console.error(
      "[CONTACT] Failed to send contact email:",
      error
    );

    return errorResponse(
      "We couldn't send your message right now. Please try again or email esopvalueclarity@gmail.com directly.",
      500,
      "CONTACT_SEND_FAILED"
    );
  }
}