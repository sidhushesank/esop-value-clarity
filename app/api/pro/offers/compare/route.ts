/* ============================================================
   OFFER INTELLIGENCE — AUTHORITATIVE COMPARISON API

   Route:
   GET /api/pro/offers/compare?offerA=<id>&offerB=<id>

   Responsibilities:
   - authenticate the current user
   - load only offers owned by that user
   - use each persisted normalized snapshot as the engine input
   - reject cross-currency comparison without a confirmed FX basis
   - run the shared server comparison engine

   The browser must render this result; it must not manufacture a
   separate winner from copied client-side calculations.
============================================================ */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getUserIdFromToken,
} from "@/lib/auth";

import {
  compareOffers,
} from "@/lib/esop/offers/compare";

import {
  normalizeOfferInput,
} from "@/lib/esop/offers/normalize";

import type {
  OfferInput,
  OfferSide,
} from "@/lib/esop/offers/types";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

type PersistedComparisonOffer = {
  id: string;

  status: string;

  currency: string;

  normalizedSnapshot: unknown;
};

function errorResponse(
  message: string,
  status: number,
  code: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
      ...(details
        ? { details }
        : {}),
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}

function successResponse(
  body: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: true,
      ...body,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}

function readOfferId(
  request: NextRequest,
  key: "offerA" | "offerB"
): string | null {
  const value =
    request.nextUrl.searchParams
      .get(key)
      ?.trim();

  return value || null;
}

function isPlainRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function readNormalizedOffer(
  record: PersistedComparisonOffer,
  side: OfferSide
): OfferInput | null {
  if (
    !isPlainRecord(
      record.normalizedSnapshot
    )
  ) {
    return null;
  }

  /*
   * Normalize again at the server boundary. This keeps legacy
   * snapshots readable and guarantees the engine receives the
   * current normalized contract rather than arbitrary JSON.
   */
  return normalizeOfferInput(
    {
      ...record.normalizedSnapshot,
      id: record.id,
      side,
      currency: record.currency,
    } as OfferInput,
    side
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const token =
      request.cookies.get("token")
        ?.value;

    if (!token) {
      return errorResponse(
        "Not authenticated",
        401,
        "NOT_AUTHENTICATED"
      );
    }

    const userId =
      getUserIdFromToken(token);

    if (!userId) {
      return errorResponse(
        "Invalid token",
        401,
        "INVALID_TOKEN"
      );
    }

    const offerAId =
      readOfferId(
        request,
        "offerA"
      );

    const offerBId =
      readOfferId(
        request,
        "offerB"
      );

    if (!offerAId || !offerBId) {
      return errorResponse(
        "Both Offer A and Offer B IDs are required.",
        400,
        "OFFER_IDS_REQUIRED"
      );
    }

    if (offerAId === offerBId) {
      return errorResponse(
        "Choose two different offers to compare.",
        400,
        "DUPLICATE_OFFER_IDS"
      );
    }

    const records =
      await prisma.offerIntelligence.findMany({
        where: {
          userId,
          id: {
            in: [
              offerAId,
              offerBId,
            ],
          },
        },
        select: {
          id: true,
          status: true,
          currency: true,
          normalizedSnapshot: true,
        },
      });

    if (records.length !== 2) {
      return errorResponse(
        "One or both offers could not be found.",
        404,
        "OFFER_NOT_FOUND"
      );
    }

    const recordA =
      records.find(
        (record) =>
          record.id === offerAId
      );

    const recordB =
      records.find(
        (record) =>
          record.id === offerBId
      );

    if (!recordA || !recordB) {
      return errorResponse(
        "One or both offers could not be found.",
        404,
        "OFFER_NOT_FOUND"
      );
    }

    if (
      recordA.status !== "CONFIRMED" ||
      recordB.status !== "CONFIRMED"
    ) {
      return errorResponse(
        "Only confirmed, non-archived offers can be compared.",
        409,
        "OFFER_NOT_CONFIRMED"
      );
    }

    const currencyA =
      recordA.currency.toUpperCase();

    const currencyB =
      recordB.currency.toUpperCase();

    if (currencyA !== currencyB) {
      return errorResponse(
        "These offers use different currencies. Confirm a single exchange-rate basis before comparing their monetary values.",
        422,
        "CURRENCY_MISMATCH",
        {
          offerACurrency: currencyA,
          offerBCurrency: currencyB,
        }
      );
    }

    /*
     * ESOP Value Clarity is an India-only employee product.
     * We therefore compare only INR-normalized offer economics
     * rather than silently applying an unverified FX conversion.
     */
    if (currencyA !== "INR") {
      return errorResponse(
        "ESOP Value Clarity currently compares Indian employee offers using INR-normalized compensation. Convert and confirm the offer values in INR before comparison.",
        422,
        "INR_NORMALIZATION_REQUIRED",
        {
          offerCurrency: currencyA,
        }
      );
    }

    const offerA =
      readNormalizedOffer(
        recordA,
        "A"
      );

    const offerB =
      readNormalizedOffer(
        recordB,
        "B"
      );

    if (!offerA || !offerB) {
      return errorResponse(
        "One or both saved offers are missing their normalized comparison record.",
        409,
        "NORMALIZED_OFFER_MISSING"
      );
    }

    const comparison =
      compareOffers(
        offerA,
        offerB
      );

    return successResponse({
      offerAId,
      offerBId,
      comparison,
    });
  } catch (error: unknown) {
    console.error(
      "GET /api/pro/offers/compare error:",
      error
    );

    return errorResponse(
      "Unable to compare these offers.",
      500,
      "OFFER_COMPARISON_FAILED"
    );
  }
}