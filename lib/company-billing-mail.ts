import nodemailer from "nodemailer";

/**
 * Emails to a Startup Equity Desk customer about their plan: access granted, extended,
 * purchased, ending soon, or ended.
 *
 * Self-contained on purpose (own transporter, same SMTP_* variables as
 * lib/mail.ts) so billing never depends on changes to the shared mailer.
 * Callers should treat failure as non-fatal: access is already saved.
 */

export type StartupPlanEmailKind =
  | "PURCHASED"
  | "GRANTED"
  | "EXTENDED"
  | "REVOKED"
  | "ENDING_SOON";

export type StartupPlanEmailInput = {
  to: string;
  kind: StartupPlanEmailKind;
  ownerName?: string | null;
  companyName: string;
  expiresAt: Date;
  holderLimit: number;
  /** Razorpay payment id / invoice number, shown to the customer if present. */
  reference?: string | null;
  /** Human wording of what changed, e.g. "12 months" (optional). */
  duration?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    ""
  );
}

export function buildStartupPlanEmail(input: StartupPlanEmailInput) {
  const base = appUrl();
  const consoleUrl = `${base}/company`;
  const renewUrl = `${base}/pricing#startup`;
  const end = formatDate(input.expiresAt);
  const greeting = input.ownerName ? `Hello ${input.ownerName},` : "Hello,";

  let subject: string;
  let headline: string;
  let lines: string[];
  let cta: { label: string; url: string } | null = {
    label: "Open Startup Equity Desk",
    url: consoleUrl,
  };

  switch (input.kind) {
    case "PURCHASED":
      subject = "Your Startup plan is active";
      headline = "Your Startup plan is active";
      lines = [
        `Thank you. Your Startup plan for ${input.companyName} is now active.`,
        `Plan period: ${input.duration ?? "1 year"}, valid until ${end}.`,
        `Option holders included: ${input.holderLimit}.`,
      ];
      break;
    case "GRANTED":
      subject = "Startup Equity Desk access has been enabled for you";
      headline = "Startup Equity Desk access enabled";
      lines = [
        `Access to the Startup Equity Desk has been enabled for ${input.companyName}.`,
        `Access period: ${input.duration ?? "as agreed"}, valid until ${end}.`,
        `Option holders included: ${input.holderLimit}.`,
      ];
      break;
    case "EXTENDED":
      subject = "Your Startup Equity Desk access has been extended";
      headline = "Your access has been extended";
      lines = [
        `Your Startup Equity Desk access for ${input.companyName} has been updated.`,
        input.duration
          ? `Added: ${input.duration}. New end date: ${end}.`
          : `New end date: ${end}.`,
        `Option holders included: ${input.holderLimit}.`,
      ];
      break;
    case "ENDING_SOON":
      subject = `Your Startup plan ends on ${end}`;
      headline = "Your Startup plan ends soon";
      lines = [
        `Your Startup plan for ${input.companyName} ends on ${end}.`,
        "After that date the Startup Equity Desk is locked until the plan is renewed, and your employees' grant links stop opening. Your data is kept safely and everything returns as soon as you renew.",
      ];
      cta = { label: "Renew Startup plan", url: renewUrl };
      break;
    case "REVOKED":
    default:
      subject = "Your Startup Equity Desk access has ended";
      headline = "Your access has ended";
      lines = [
        `Startup Equity Desk access for ${input.companyName} has ended.`,
        "Your employees' grant links stop opening until access is restored. Your data is kept safely. To continue, reply to this email or renew from the pricing page.",
      ];
      cta = { label: "View Startup plan", url: renewUrl };
      break;
  }

  // Without a configured site URL a link would be relative and broken in an inbox.
  if (!base) cta = null;

  if (input.reference && input.kind !== "ENDING_SOON") {
    lines.push(`Reference: ${input.reference}`);
  }

  const text = [greeting, "", ...lines, "", cta ? `${cta.label}: ${cta.url}` : "", "", "ESOP Value Clarity"]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#020617;border-radius:20px 20px 0 0;padding:26px 28px;">
      <div style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;">ESOP VALUE CLARITY</div>
      <h1 style="margin:10px 0 0;color:#ffffff;font-size:22px;line-height:1.3;">${escapeHtml(headline)}</h1>
    </div>
    <div style="background:#ffffff;border-radius:0 0 20px 20px;padding:28px;color:#0f172a;font-size:15px;line-height:1.7;">
      <p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
      ${lines.map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("")}
      ${
        cta
          ? `<p style="margin:22px 0 0;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px;">${escapeHtml(cta.label)}</a></p>`
          : ""
      }
      <p style="margin:26px 0 0;color:#64748b;font-size:12px;">Questions? Just reply to this email.</p>
    </div>
  </div>
</body></html>`;

  return { subject, html, text };
}

export async function sendStartupPlanEmail(
  input: StartupPlanEmailInput
): Promise<boolean> {
  try {
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

    if (!user || !pass) {
      console.error("[COMPANY_MAIL] SMTP is not configured.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const { subject, html, text } = buildStartupPlanEmail(input);

    await transporter.sendMail({
      from: { name: "ESOP Value Clarity", address: user },
      to: input.to,
      replyTo: process.env.CONTACT_EMAIL?.trim() || user,
      subject,
      html,
      text,
    });

    return true;
  } catch (error) {
    console.error("[COMPANY_MAIL] send failed:", error);
    return false;
  }
}
