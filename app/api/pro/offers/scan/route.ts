/* ============================================================
   PHASE 4 — OFFER INTELLIGENCE
   LOCAL OFFER SCANNER API

   Route:
   GET  /api/pro/offers/scan
   POST /api/pro/offers/scan

   Supported POST modes:

   1. application/json
      - accepts extracted/plain offer-letter text
      - preserves our existing QA path

   2. multipart/form-data
      - accepts a real PDF upload
      - extracts PDF text locally with pdf-parse
      - sends extracted text through the SAME parser + validator

   IMPORTANT:
   - NO OpenAI
   - NO Gemini
   - NO Groq
   - NO Anthropic
   - NO AI API key
   - NO credit card
   - NO external AI document processing

   PDF FLOW:

   Browser
      ↓
   multipart/form-data
      ↓
   PDF ArrayBuffer
      ↓
   pdf-parse
      ↓
   extracted text
      ↓
   scanner-parser.ts
      ↓
   scanner-validation.ts
      ↓
   Review & Confirm

   IMAGE-ONLY PDF:
   If insufficient selectable text is found, this endpoint
   explicitly rejects the scan rather than inventing values.
============================================================ */

import { NextResponse } from "next/server";

import { PDFParse } from "pdf-parse";

import {
  canParseOfferText,
  getOfferParserDiagnostics,
  parseOfferLetterText,
} from "@/lib/esop/offers/scanner-parser";

import {
  getScannerReviewQueue,
  validateScannedOffer,
} from "@/lib/esop/offers/scanner-validation";

import type {
  OfferScannerCurrency,
  OfferScannerDocumentType,
  OfferScannerFileType,
  OfferScannerResponse,
} from "@/lib/esop/offers/scanner-types";

/* ============================================================
   NEXT.JS RUNTIME

   pdf-parse requires the Node.js runtime.
============================================================ */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================
   LIMITS

   Keep these conservative for V1.

   10 MB PDF:
   enough for normal offer letters / annexures.

   500,000 characters:
   enough for a multi-page employment package without allowing
   arbitrarily huge parser input.
============================================================ */

const MAX_PDF_SIZE_BYTES =
  10 * 1024 * 1024;

const MAX_TEXT_LENGTH =
  500_000;

const MIN_EXTRACTED_TEXT_LENGTH =
  20;

/* ============================================================
   JSON REQUEST BODY
============================================================ */

type ScanOfferRequestBody = {
  text?: unknown;

  documentId?: unknown;

  fileName?: unknown;

  fileType?: unknown;

  documentTypeHint?: unknown;

  currencyHint?: unknown;

  pageCount?: unknown;

  detectedLanguage?: unknown;
};

/* ============================================================
   INTERNAL SCAN INPUT

   Both JSON mode and PDF mode are converted into this shape.

   That ensures both paths ultimately use the same scanner.
============================================================ */

type NormalizedScanInput = {
  text: string;

  documentId?: string;

  fileName?: string;

  fileType:
    OfferScannerFileType;

  documentTypeHint?:
    OfferScannerDocumentType;

  currencyHint?:
    OfferScannerCurrency;

  pageCount?: number;

  detectedLanguage?: string;
};

/* ============================================================
   SUCCESS RESPONSE
============================================================ */

type ScanOfferSuccessResponse = {
  success: true;

  scan: ReturnType<
    typeof parseOfferLetterText
  >;

  diagnostics: ReturnType<
    typeof getOfferParserDiagnostics
  >;

  reviewQueue: ReturnType<
    typeof getScannerReviewQueue
  >;

  validation: {
    criticalFieldsReviewed:
      boolean;

    equityCriticalFieldsReviewed:
      boolean;

    blockingIssueCount:
      number;

    warningCount:
      number;

    informationCount:
      number;
  };

  extraction: {
    mode:
      | "TEXT"
      | "PDF";

    fileName:
      string | null;

    mimeType:
      string | null;

    fileSizeBytes:
      number | null;

    extractedCharacterCount:
      number;

    pageCount:
      number | null;

    localProcessing:
      true;

    externalAIUsed:
      false;
  };
};

/* ============================================================
   STRING HELPERS
============================================================ */

function optionalString(
  value: unknown
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : undefined;
}

/* ============================================================
   NUMBER HELPER
============================================================ */

function optionalPositiveInteger(
  value: unknown
): number | undefined {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const normalized =
      Math.round(value);

    return normalized > 0
      ? normalized
      : undefined;
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(
        value.trim()
      );

    if (
      Number.isFinite(parsed)
    ) {
      const normalized =
        Math.round(parsed);

      return normalized > 0
        ? normalized
        : undefined;
    }
  }

  return undefined;
}

/* ============================================================
   ENUM HELPERS
============================================================ */

function parseFileType(
  value: unknown
): OfferScannerFileType | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  switch (normalized) {
    case "PDF":
    case "DOCX":
    case "IMAGE":
    case "TEXT":
    case "UNKNOWN":
      return normalized;

    default:
      return undefined;
  }
}

function parseDocumentType(
  value: unknown
): OfferScannerDocumentType | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  switch (normalized) {
    case "OFFER_LETTER":
    case "COMPENSATION_ANNEXURE":
    case "ESOP_GRANT":
    case "RSU_GRANT":
    case "EMPLOYMENT_AGREEMENT":
    case "MULTI_DOCUMENT":
    case "UNKNOWN":
      return normalized;

    default:
      return undefined;
  }
}

function parseCurrency(
  value: unknown
): OfferScannerCurrency | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toUpperCase();

  switch (normalized) {
    case "INR":
    case "USD":
    case "EUR":
    case "GBP":
    case "AED":
    case "SGD":
    case "OTHER":
    case "UNKNOWN":
      return normalized;

    default:
      return undefined;
  }
}

/* ============================================================
   ERROR RESPONSE
============================================================ */

function errorResponse(
  message: string,
  status: number,
  code: string,
  details?: Record<
    string,
    unknown
  >
) {
  const response:
    OfferScannerResponse & {
      details?:
        Record<
          string,
          unknown
        >;
    } = {
    success: false,

    message,

    code,

    ...(details
      ? {
          details,
        }
      : {}),
  };

  return NextResponse.json(
    response,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        Pragma:
          "no-cache",
      },
    }
  );
}

/* ============================================================
   FILE NAME SAFETY
============================================================ */

function safeFileName(
  value: string
): string {
  const cleaned =
    value
      .replace(
        /[^\w.\- ()]/g,
        "_"
      )
      .trim();

  return cleaned ||
    "offer-letter.pdf";
}

/* ============================================================
   PDF TYPE CHECK
============================================================ */

function isPdfFile(
  file: File
): boolean {
  const mime =
    file.type
      .toLowerCase();

  const name =
    file.name
      .toLowerCase();

  return (
    mime ===
      "application/pdf" ||
    name.endsWith(
      ".pdf"
    )
  );
}

/* ============================================================
   PDF TEXT CLEANUP

   We preserve line boundaries because scanner-parser.ts uses
   them as evidence.

   We only normalize obvious extraction artifacts.
============================================================ */

function cleanExtractedPdfText(
  value: string
): string {
  return value
    .replace(
      /\u0000/g,
      ""
    )
    .replace(
      /\r\n/g,
      "\n"
    )
    .replace(
      /\r/g,
      "\n"
    )
    .replace(
      /[ \t]+\n/g,
      "\n"
    )
    .replace(
      /\n{4,}/g,
      "\n\n\n"
    )
    .trim();
}

/* ============================================================
   LOCAL PDF EXTRACTION
============================================================ */

async function extractPdfText(
  file: File
): Promise<{
  text: string;

  pageCount:
    number | null;
}> {
  const arrayBuffer =
    await file.arrayBuffer();

  /*
   * PDFParse accepts binary PDF data.

   * Uint8Array avoids depending on Node Buffer types in the
   * remainder of the scanner pipeline.
   */

  const data =
    new Uint8Array(
      arrayBuffer
    );

  const parser =
    new PDFParse({
      data,
    });

  try {
    const result =
      await parser.getText();

    const text =
      cleanExtractedPdfText(
        typeof result.text ===
          "string"
          ? result.text
          : ""
      );

    /*
     * pdf-parse versions can expose page metadata slightly
     * differently. getText() currently provides total pages via
     * total. We still guard it defensively.
     */

    const possibleTotal =
      (
        result as {
          total?: unknown;
        }
      ).total;

    const pageCount =
      typeof possibleTotal ===
        "number" &&
      Number.isFinite(
        possibleTotal
      )
        ? Math.max(
            Math.round(
              possibleTotal
            ),
            0
          )
        : null;

    return {
      text,

      pageCount:
        pageCount &&
        pageCount > 0
          ? pageCount
          : null,
    };
  } finally {
    /*
     * Explicit cleanup is important in a server environment,
     * particularly when users scan multiple documents.
     */

    await parser.destroy();
  }
}

/* ============================================================
   JSON INPUT
============================================================ */

async function parseJsonRequest(
  request: Request
): Promise<
  | {
      success: true;

      input:
        NormalizedScanInput;

      extraction: {
        mode: "TEXT";

        fileName:
          string | null;

        mimeType:
          string | null;

        fileSizeBytes:
          null;

        pageCount:
          number | null;
      };
    }
  | {
      success: false;

      response:
        ReturnType<
          typeof errorResponse
        >;
    }
> {
  let body:
    ScanOfferRequestBody;

  try {
    body =
      (await request.json()) as
        ScanOfferRequestBody;
  } catch {
    return {
      success: false,

      response:
        errorResponse(
          "The request body is not valid JSON.",
          400,
          "INVALID_JSON"
        ),
    };
  }

  const text =
    typeof body.text ===
      "string"
      ? body.text
      : "";

  if (
    !text.trim()
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "Offer-letter text is required.",
          400,
          "TEXT_REQUIRED"
        ),
    };
  }

  if (
    text.length >
    MAX_TEXT_LENGTH
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "The supplied document text is too large for the local scanner.",
          413,
          "TEXT_TOO_LARGE",
          {
            maximumCharacters:
              MAX_TEXT_LENGTH,

            suppliedCharacters:
              text.length,
          }
        ),
    };
  }

  if (
    !canParseOfferText(
      text
    )
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "The supplied text is too short to scan reliably.",
          400,
          "TEXT_TOO_SHORT"
        ),
    };
  }

  const fileName =
    optionalString(
      body.fileName
    );

  const pageCount =
    optionalPositiveInteger(
      body.pageCount
    );

  return {
    success: true,

    input: {
      text,

      documentId:
        optionalString(
          body.documentId
        ),

      fileName,

      fileType:
        parseFileType(
          body.fileType
        ) ??
        "TEXT",

      documentTypeHint:
        parseDocumentType(
          body.documentTypeHint
        ),

      currencyHint:
        parseCurrency(
          body.currencyHint
        ),

      pageCount,

      detectedLanguage:
        optionalString(
          body.detectedLanguage
        ),
    },

    extraction: {
      mode:
        "TEXT",

      fileName:
        fileName ??
        null,

      mimeType:
        "application/json",

      fileSizeBytes:
        null,

      pageCount:
        pageCount ??
        null,
    },
  };
}

/* ============================================================
   MULTIPART PDF INPUT

   Expected fields:

   file                  required
   documentId            optional
   documentTypeHint      optional
   currencyHint          optional
   detectedLanguage      optional
============================================================ */

async function parseMultipartRequest(
  request: Request
): Promise<
  | {
      success: true;

      input:
        NormalizedScanInput;

      extraction: {
        mode: "PDF";

        fileName:
          string;

        mimeType:
          string;

        fileSizeBytes:
          number;

        pageCount:
          number | null;
      };
    }
  | {
      success: false;

      response:
        ReturnType<
          typeof errorResponse
        >;
    }
> {
  let formData:
    FormData;

  try {
    formData =
      await request.formData();
  } catch {
    return {
      success: false,

      response:
        errorResponse(
          "The uploaded form data could not be read.",
          400,
          "INVALID_FORM_DATA"
        ),
    };
  }

  const fileValue =
    formData.get(
      "file"
    );

  if (
    !(fileValue instanceof File)
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "A PDF file is required.",
          400,
          "PDF_FILE_REQUIRED"
        ),
    };
  }

  const file =
    fileValue;

  if (
    file.size <= 0
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "The uploaded PDF is empty.",
          400,
          "EMPTY_PDF"
        ),
    };
  }

  if (
    file.size >
    MAX_PDF_SIZE_BYTES
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "The PDF is larger than the current 10 MB scanner limit.",
          413,
          "PDF_TOO_LARGE",
          {
            maximumBytes:
              MAX_PDF_SIZE_BYTES,

            suppliedBytes:
              file.size,
          }
        ),
    };
  }

  if (
    !isPdfFile(
      file
    )
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "Only PDF offer letters are supported in the current upload scanner.",
          415,
          "UNSUPPORTED_FILE_TYPE",
          {
            fileName:
              file.name,

            mimeType:
              file.type ||
              null,
          }
        ),
    };
  }

  /* ----------------------------------------------------------
     LOCAL PDF EXTRACTION
  ---------------------------------------------------------- */

  let extracted:
    Awaited<
      ReturnType<
        typeof extractPdfText
      >
    >;

  try {
    extracted =
      await extractPdfText(
        file
      );
  } catch (error) {
    console.error(
      "[OFFER_SCANNER_PDF_EXTRACTION]",
      error
    );

    return {
      success: false,

      response:
        errorResponse(
          "The PDF could not be read. Please confirm that it is a valid, non-password-protected PDF.",
          422,
          "PDF_EXTRACTION_FAILED"
        ),
    };
  }

  const text =
    extracted.text;

  /* ----------------------------------------------------------
     IMAGE-ONLY / SCANNED PDF PROTECTION

     We deliberately do NOT send it to an AI/OCR provider.

     If there is insufficient selectable text, tell the user.
  ---------------------------------------------------------- */

  if (
    text.length <
    MIN_EXTRACTED_TEXT_LENGTH ||
    !canParseOfferText(
      text
    )
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "This PDF contains too little selectable text for reliable local extraction. It may be a scanned/image-only document. Please use manual entry or upload a text-based PDF.",
          422,
          "SCANNED_PDF_TEXT_NOT_FOUND",
          {
            extractedCharacters:
              text.length,

            externalAIUsed:
              false,

            localOCRUsed:
              false,
          }
        ),
    };
  }

  if (
    text.length >
    MAX_TEXT_LENGTH
  ) {
    return {
      success: false,

      response:
        errorResponse(
          "The extracted PDF text is too large for the current scanner.",
          413,
          "EXTRACTED_TEXT_TOO_LARGE",
          {
            maximumCharacters:
              MAX_TEXT_LENGTH,

            extractedCharacters:
              text.length,
          }
        ),
    };
  }

  const documentId =
    optionalString(
      formData.get(
        "documentId"
      )
    );

  const documentTypeHint =
    parseDocumentType(
      formData.get(
        "documentTypeHint"
      )
    );

  const currencyHint =
    parseCurrency(
      formData.get(
        "currencyHint"
      )
    );

  const detectedLanguage =
    optionalString(
      formData.get(
        "detectedLanguage"
      )
    );

  const fileName =
    safeFileName(
      file.name
    );

  return {
    success: true,

    input: {
      text,

      documentId,

      fileName,

      fileType:
        "PDF",

      documentTypeHint,

      currencyHint,

      pageCount:
        extracted.pageCount ??
        undefined,

      detectedLanguage,
    },

    extraction: {
      mode:
        "PDF",

      fileName,

      mimeType:
        file.type ||
        "application/pdf",

      fileSizeBytes:
        file.size,

      pageCount:
        extracted.pageCount,
    },
  };
}

/* ============================================================
   RUN SHARED SCANNER PIPELINE

   This is the important architectural point:

   PDF and TEXT do NOT get different compensation logic.

   They both eventually call parseOfferLetterText().
============================================================ */

function runScannerPipeline(
  input:
    NormalizedScanInput,
  extraction: {
    mode:
      | "TEXT"
      | "PDF";

    fileName:
      string | null;

    mimeType:
      string | null;

    fileSizeBytes:
      number | null;

    pageCount:
      number | null;
  }
): ScanOfferSuccessResponse {
  const scan =
    parseOfferLetterText({
      text:
        input.text,

      documentId:
        input.documentId,

      fileName:
        input.fileName,

      fileType:
        input.fileType,

      documentTypeHint:
        input.documentTypeHint,

      currencyHint:
        input.currencyHint,

      pageCount:
        input.pageCount,

      detectedLanguage:
        input.detectedLanguage,
    });

  const validation =
    validateScannedOffer(
      scan
    );

  const diagnostics =
    getOfferParserDiagnostics(
      scan
    );

  const reviewQueue =
    getScannerReviewQueue(
      scan
    );

  return {
    success:
      true,

    scan,

    diagnostics,

    reviewQueue,

    validation: {
      criticalFieldsReviewed:
        validation
          .criticalFieldsReviewed,

      equityCriticalFieldsReviewed:
        validation
          .equityCriticalFieldsReviewed,

      blockingIssueCount:
        validation
          .blockingIssues
          .length,

      warningCount:
        validation
          .warnings
          .length,

      informationCount:
        validation
          .informationalIssues
          .length,
    },

    extraction: {
      mode:
        extraction.mode,

      fileName:
        extraction.fileName,

      mimeType:
        extraction.mimeType,

      fileSizeBytes:
        extraction
          .fileSizeBytes,

      extractedCharacterCount:
        input.text.length,

      pageCount:
        extraction.pageCount,

      localProcessing:
        true,

      externalAIUsed:
        false,
    },
  };
}

/* ============================================================
   GET — CAPABILITY ENDPOINT
============================================================ */

export async function GET() {
  return NextResponse.json(
    {
      success:
        true,

      service:
        "Offer Intelligence Local Scanner",

      version:
        "phase4-pdf-v1",

      runtime:
        "nodejs",

      mode:
        "LOCAL_DETERMINISTIC",

      aiProvider:
        null,

      requiresApiKey:
        false,

      requiresCreditCard:
        false,

      externalAIUsed:
        false,

      supportedInputs: [
        {
          type:
            "TEXT",

          contentType:
            "application/json",

          status:
            "SUPPORTED",
        },

        {
          type:
            "PDF",

          contentType:
            "multipart/form-data",

          status:
            "SUPPORTED",

          maximumSizeMB:
            MAX_PDF_SIZE_BYTES /
            1024 /
            1024,

          textBasedPdfRequired:
            true,
        },
      ],

      unsupportedInV1: [
        "DOCX upload",
        "Image upload",
        "Image-only PDF OCR",
      ],

      pipeline: [
        "LOCAL_DOCUMENT_INPUT",
        "LOCAL_PDF_TEXT_EXTRACTION",
        "DETERMINISTIC_OFFER_PARSER",
        "SCANNER_VALIDATION",
        "USER_REVIEW_AND_CONFIRMATION",
      ],

      privacy:
        "The V1 scanner does not send offer-letter content to an external AI provider.",

      message:
        "Local text and text-based PDF scanning are available.",
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        Pragma:
          "no-cache",
      },
    }
  );
}

/* ============================================================
   POST
============================================================ */

export async function POST(
  request: Request
) {
  try {
    const contentType =
      (
        request.headers.get(
          "content-type"
        ) ?? ""
      ).toLowerCase();

    /* --------------------------------------------------------
       JSON / TEXT MODE

       Preserves all our existing scanner QA tests.
    -------------------------------------------------------- */

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const parsed =
        await parseJsonRequest(
          request
        );

      if (
        !parsed.success
      ) {
        return parsed.response;
      }

      const response =
        runScannerPipeline(
          parsed.input,
          parsed.extraction
        );

      return NextResponse.json(
        response,
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, max-age=0",

            Pragma:
              "no-cache",
          },
        }
      );
    }

    /* --------------------------------------------------------
       MULTIPART / PDF MODE
    -------------------------------------------------------- */

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const parsed =
        await parseMultipartRequest(
          request
        );

      if (
        !parsed.success
      ) {
        return parsed.response;
      }

      const response =
        runScannerPipeline(
          parsed.input,
          parsed.extraction
        );

      return NextResponse.json(
        response,
        {
          status: 200,

          headers: {
            "Cache-Control":
              "no-store, max-age=0",

            Pragma:
              "no-cache",
          },
        }
      );
    }

    /* --------------------------------------------------------
       UNSUPPORTED REQUEST TYPE
    -------------------------------------------------------- */

    return errorResponse(
      "Unsupported scanner request. Send application/json for text or multipart/form-data for a PDF upload.",
      415,
      "UNSUPPORTED_CONTENT_TYPE"
    );
  } catch (error) {
    console.error(
      "[OFFER_SCANNER]",
      error
    );

    return errorResponse(
      "The offer letter could not be scanned.",
      500,
      "SCAN_FAILED"
    );
  }
}