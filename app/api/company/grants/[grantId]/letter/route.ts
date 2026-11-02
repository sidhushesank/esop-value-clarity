import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCompanyWorkspace } from "@/lib/company-access";
import { badRequest, companyErrorResponse } from "@/lib/company-http";
import {
  LETTER_MAX_BYTES,
  PDF_MIME,
  cleanFileName,
  isPdf,
  letterDownloadUrl,
  letterKey,
  removeLetter,
  storeLetter,
} from "@/lib/company/grant-letter-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ grantId: string }> };

async function findGrant(workspaceId: string, grantId: string) {
  return prisma.optionGrant.findFirst({
    where: { id: grantId, workspaceId },
    select: { id: true, status: true, letterStorageKey: true, letterFileName: true },
  });
}

/** POST (multipart, field "file"): upload or replace the signed grant letter PDF. */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (grant.status === "LAPSED") return badRequest("This grant has lapsed.", "BAD_STATUS", 409);

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) return badRequest("Choose the grant letter PDF.", "FILE_REQUIRED");
    if (file.type !== PDF_MIME) return badRequest("Only PDF files can be uploaded.", "INVALID_FILE_TYPE");
    if (file.size <= 0) return badRequest("The file is empty.", "EMPTY_FILE");
    if (file.size > LETTER_MAX_BYTES) return badRequest("The PDF must be 10 MB or smaller.", "FILE_TOO_LARGE", 413);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isPdf(buffer)) return badRequest("This file does not look like a valid PDF.", "INVALID_PDF");

    const key = letterKey(workspace.id, grant.id);
    await storeLetter(key, buffer);

    const fileName = cleanFileName(file.name);
    const updated = await prisma.optionGrant.update({
      where: { id: grant.id },
      data: {
        letterStorageKey: key,
        letterFileName: fileName,
        letterFileSize: file.size,
        letterUploadedAt: new Date(),
        letterDownloadedAt: null,
        letterDownloadCount: 0,
      },
      select: { letterFileName: true, letterFileSize: true, letterUploadedAt: true },
    });

    if (grant.letterStorageKey && grant.letterStorageKey !== key) {
      await removeLetter(grant.letterStorageKey);
    }

    return NextResponse.json({ success: true, letter: updated }, { status: 201 });
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** GET: founder downloads the uploaded letter (redirects to a 60-second link). */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (!grant.letterStorageKey) return badRequest("No grant letter uploaded.", "NO_LETTER", 404);

    const url = await letterDownloadUrl(grant.letterStorageKey, grant.letterFileName ?? "grant-letter.pdf");
    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    return companyErrorResponse(error);
  }
}

/** DELETE: remove the uploaded letter. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireCompanyWorkspace();
    const { grantId } = await params;

    const grant = await findGrant(workspace.id, grantId);
    if (!grant) return badRequest("Grant not found.", "NOT_FOUND", 404);
    if (!grant.letterStorageKey) return NextResponse.json({ success: true });

    await prisma.optionGrant.update({
      where: { id: grant.id },
      data: {
        letterStorageKey: null,
        letterFileName: null,
        letterFileSize: null,
        letterUploadedAt: null,
        letterDownloadedAt: null,
        letterDownloadCount: 0,
      },
    });
    await removeLetter(grant.letterStorageKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    return companyErrorResponse(error);
  }
}
