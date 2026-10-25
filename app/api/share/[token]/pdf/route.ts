import { NextResponse } from "next/server";

import {
  resolveShareLink,
  shareCookieName,
  verifyShareCookie,
} from "@/lib/advisor/share";
import { loadReportData, reportFileName } from "@/lib/advisor/report-data";
import { buildReportPdf } from "@/lib/advisor/report-pdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params;
    const link = await resolveShareLink(token);

    if (!link) {
      return NextResponse.json(
        { success: false, code: "UNAVAILABLE", message: "This link is not available." },
        { status: 404 }
      );
    }

    if (link.passcodeHash) {
      const cookieHeader = request.headers.get("cookie") ?? "";
      const name = shareCookieName(link.id);
      const value = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`))
        ?.slice(name.length + 1);

      if (!verifyShareCookie(value, link.id)) {
        return NextResponse.json(
          { success: false, code: "PASSCODE_REQUIRED", message: "Enter the passcode first." },
          { status: 401 }
        );
      }
    }

    const data = await loadReportData(link.clientId, link.runId);

    if (!data) {
      return NextResponse.json(
        { success: false, code: "UNAVAILABLE", message: "This link is not available." },
        { status: 404 }
      );
    }

    const bytes = await buildReportPdf(data);

    return new NextResponse(new Uint8Array(bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFileName(data, "pdf")}"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("[share] pdf error:", error);
    return NextResponse.json(
      { success: false, code: "INTERNAL_ERROR", message: "Something went wrong." },
      { status: 500 }
    );
  }
}