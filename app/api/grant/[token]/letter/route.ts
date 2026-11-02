import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireOpenGrantLink } from "@/lib/company/grant-link-guard";
import { letterDownloadUrl } from "@/lib/company/grant-letter-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** GET /api/grant/[token]/letter: employee downloads the company's grant letter. */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const link = await requireOpenGrantLink(token);

  if (!link || !link.grant.letterStorageKey) {
    return NextResponse.json(
      { success: false, code: "UNAVAILABLE", message: "This document is not available." },
      { status: 404 }
    );
  }

  try {
    const url = await letterDownloadUrl(
      link.grant.letterStorageKey,
      link.grant.letterFileName ?? "grant-letter.pdf"
    );

    await prisma.optionGrant.update({
      where: { id: link.grant.id },
      data: {
        letterDownloadCount: { increment: 1 },
        ...(link.grant.letterDownloadedAt ? {} : { letterDownloadedAt: new Date() }),
      },
    });

    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("[grant-letter] employee download failed:", error);
    return NextResponse.json(
      { success: false, code: "ERROR", message: "Could not open the document. Please try again." },
      { status: 500 }
    );
  }
}
