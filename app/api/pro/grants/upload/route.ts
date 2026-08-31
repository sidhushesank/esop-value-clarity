import { NextResponse } from "next/server";
import {
  EsopDocumentSource,
  EsopDocumentStatus,
  UserActivityType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";
import { uploadEsopDocument } from "@/lib/supabase-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

function isPdfSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

function sanitizeOriginalFileName(fileName: string): string {
  return fileName
    .replace(/[^\w.\-() ]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export async function POST(request: Request) {
  let documentId: string | null = null;
  let storageKey: string | null = null;

  try {
    const { user } = await requireProUser();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          code: "FILE_REQUIRED",
          message: "Please select an ESOP grant PDF to upload.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.type !== PDF_MIME_TYPE) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_FILE_TYPE",
          message: "Only PDF documents are supported right now.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          code: "EMPTY_FILE",
          message: "The selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          code: "FILE_TOO_LARGE",
          message: "The PDF must be 10 MB or smaller.",
        },
        {
          status: 413,
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isPdfSignature(buffer)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PDF",
          message:
            "The uploaded file does not appear to be a valid PDF document.",
        },
        {
          status: 400,
        }
      );
    }

    const originalFileName =
      sanitizeOriginalFileName(file.name) || "esop-grant.pdf";

    const document = await prisma.esopDocument.create({
      data: {
        userId: user.id,
        source: EsopDocumentSource.UPLOAD,
        status: EsopDocumentStatus.UPLOADED,
        originalFileName,
        mimeType: PDF_MIME_TYPE,
        fileSizeBytes: file.size,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    documentId = document.id;

    storageKey = [
      "users",
      user.id,
      "grants",
      document.id,
      "original.pdf",
    ].join("/");

    await uploadEsopDocument({
      storageKey,
      file: buffer,
      contentType: PDF_MIME_TYPE,
    });

    const updatedDocument = await prisma.esopDocument.update({
      where: {
        id: document.id,
      },
      data: {
        storageKey,
      },
      select: {
        id: true,
        originalFileName: true,
        mimeType: true,
        fileSizeBytes: true,
        status: true,
        storageKey: true,
        createdAt: true,
      },
    });

    await prisma.userActivity.create({
      data: {
        userId: user.id,
        type: UserActivityType.ESOP_DOCUMENT_UPLOADED,
        metadata: {
          documentId: updatedDocument.id,
          originalFileName: updatedDocument.originalFileName,
          fileSizeBytes: updatedDocument.fileSizeBytes,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        document: {
          id: updatedDocument.id,
          originalFileName: updatedDocument.originalFileName,
          mimeType: updatedDocument.mimeType,
          fileSizeBytes: updatedDocument.fileSizeBytes,
          status: updatedDocument.status,
          createdAt: updatedDocument.createdAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const accessError = getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status: accessError.status,
        }
      );
    }

    console.error(
      "[ESOP_GRANT_UPLOAD_ERROR]",
      error
    );

    if (documentId) {
      try {
        await prisma.esopDocument.update({
          where: {
            id: documentId,
          },
          data: {
            status: EsopDocumentStatus.FAILED,
            extractionError:
              "The document could not be stored successfully.",
          },
        });
      } catch (cleanupError) {
        console.error(
          "[ESOP_GRANT_UPLOAD_DB_CLEANUP_ERROR]",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        code: "UPLOAD_FAILED",
        message:
          "We could not securely upload your ESOP document. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}