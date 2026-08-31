/**
 * IMPORTANT:
 *
 * pdf-parse uses PDF.js internally. In Next.js/Turbopack the PDF.js
 * worker must be initialized before PDFParse is imported.
 *
 * Keep this import FIRST.
 */
import "pdf-parse/worker";

import { PDFParse } from "pdf-parse";

export type ExtractedPdfPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedPdfResult = {
  text: string;
  pageCount: number;
  pages: ExtractedPdfPage[];
};

function normalizeText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(
  buffer: Buffer
): Promise<ExtractedPdfResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error(
      "Cannot extract text from an empty PDF."
    );
  }

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    /**
     * First obtain document/page information.
     */
    const info = await parser.getInfo({
      parsePageInfo: true,
    });

    const pageCount = info.total ?? 0;

    if (pageCount <= 0) {
      return {
        text: "",
        pageCount: 0,
        pages: [],
      };
    }

    const pages: ExtractedPdfPage[] = [];

    /**
     * Extract each page separately.
     *
     * Keeping page boundaries is important because later our ESOP
     * extraction layer will be able to say things like:
     *
     * "Exercise window — found on page 7"
     */
    for (
      let pageNumber = 1;
      pageNumber <= pageCount;
      pageNumber += 1
    ) {
      const result = await parser.getText({
        partial: [pageNumber],
      });

      pages.push({
        pageNumber,
        text: normalizeText(result.text ?? ""),
      });
    }

    const text = normalizeText(
      pages
        .map(
          (page) =>
            `--- PAGE ${page.pageNumber} ---\n${page.text}`
        )
        .join("\n\n")
    );

    return {
      text,
      pageCount,
      pages,
    };
  } finally {
    await parser.destroy();
  }
}