import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Gmail uses STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
) {
  console.log("=================================");
  console.log("Sending verification email...");
  console.log("To:", email);
  console.log("SMTP User:", process.env.SMTP_USER);
  console.log("=================================");

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Verify your ESOP Value Clarity account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;">
          <h2>Welcome to ESOP Value Clarity 👋</h2>

          <p>Hi <strong>${name}</strong>,</p>

          <p>
            Thanks for creating your account.
            Please verify your email address before logging in.
          </p>

          <div style="margin:35px 0;">
            <a
              href="${verificationUrl}"
              style="
                background:#0f172a;
                color:white;
                padding:14px 28px;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
                display:inline-block;
              "
            >
              Verify Email
            </a>
          </div>

          <p>This verification link will expire in 24 hours.</p>

          <hr />

          <p style="font-size:13px;color:#666;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("=================================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("=================================");

    return info;
  } catch (error) {
    console.log("=================================");
    console.error("❌ EMAIL FAILED");
    console.error(error);
    console.log("=================================");

    throw error;
  }
}