import nodemailer from "nodemailer";

/**
 * Invitation email for team logins. Same SMTP settings as lib/mail.ts.
 * No secret link: the person signs up or logs in with this email address.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "https://esopvalueclarity.com"
  );
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function sendSeatInviteEmail(input: {
  to: string;
  kind: "COMPANY" | "ADVISOR";
  teamName: string;
  role: "ADMIN" | "VIEWER";
  invitedBy: string;
}) {
  const base = appUrl();
  const place = input.kind === "COMPANY" ? "Startup Equity Desk" : "Advisor Console";
  const path = input.kind === "COMPANY" ? "/company" : "/advisor";
  const roleText =
    input.role === "ADMIN"
      ? "As an admin you can view and change everything, and manage the team."
      : "You have view-only access: you can see and download everything, but not change it.";

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: input.to,
      subject: `${input.invitedBy} added you to ${input.teamName} on ESOP Value Clarity`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;color:#0f172a;">
          <h2 style="margin:0 0 16px;">You've been added to ${esc(input.teamName)}</h2>
          <p>${esc(input.invitedBy)} added <strong>${esc(input.to)}</strong> to the ${place} of
          <strong>${esc(input.teamName)}</strong> on ESOP Value Clarity.</p>
          <p>${roleText}</p>
          <p><strong>How to get in:</strong> sign up (or log in) with <strong>this same email address</strong>,
          verify it from the email we send you, then open the ${place}.</p>
          <div style="margin:30px 0;">
            <a href="${base}/signup" style="background:#0f172a;color:#fff;padding:13px 24px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">Create your login</a>
            &nbsp;
            <a href="${base}${path}" style="color:#0f172a;font-weight:bold;">Already have one? Open the ${place}</a>
          </div>
          <p style="color:#64748b;font-size:13px;">If you didn't expect this, you can ignore this email.</p>
        </div>`,
    });
    return true;
  } catch (error) {
    console.error("[seat-mail] invite email failed:", error);
    return false;
  }
}
