import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getProAccessErrorResponse,
  requireProUser,
} from "@/lib/pro-access";

/**
 * Saved working model ("journey") for ONE confirmed grant.
 *
 * Every read and write is scoped to the authenticated user's own
 * confirmed grant, so a grant ID taken from the URL can never expose
 * or overwrite another user's journey.
 */

const MAX_STATE_BYTES = 100_000;

type RouteContext = {
  params: Promise<{
    grantId: string;
  }>;
};

async function findOwnGrant(
  userId: string,
  grantId: string
) {
  return prisma.esopGrant.findFirst({
    where: {
      id: grantId,
      userId,
      status: "CONFIRMED",
    },
    select: {
      id: true,
    },
  });
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { user } = await requireProUser();
    const { grantId } = await context.params;

    const grant = await findOwnGrant(
      user.id,
      grantId
    );

    if (!grant) {
      return NextResponse.json(
        {
          success: false,
          code: "CONFIRMED_GRANT_NOT_FOUND",
          message:
            "This confirmed grant could not be found in your equity profile.",
        },
        { status: 404 }
      );
    }

    const journey =
      await prisma.grantJourney.findUnique({
        where: { grantId: grant.id },
        select: {
          state: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      journey: journey
        ? {
            state: journey.state,
            updatedAt:
              journey.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        { status: accessError.status }
      );
    }

    console.error(
      "[ESOP_GRANT_JOURNEY_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "JOURNEY_LOAD_FAILED",
        message:
          "We could not load the saved journey for this grant.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { user } = await requireProUser();
    const { grantId } = await context.params;

    const grant = await findOwnGrant(
      user.id,
      grantId
    );

    if (!grant) {
      return NextResponse.json(
        {
          success: false,
          code: "CONFIRMED_GRANT_NOT_FOUND",
          message:
            "This confirmed grant could not be found in your equity profile.",
        },
        { status: 404 }
      );
    }

    const raw = await request.text();

    if (raw.length > MAX_STATE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          code: "JOURNEY_TOO_LARGE",
          message:
            "The journey data is larger than allowed.",
        },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }

    const state =
      body &&
      typeof body === "object" &&
      "state" in body
        ? (body as { state: unknown }).state
        : null;

    if (
      !state ||
      typeof state !== "object" ||
      Array.isArray(state)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_JOURNEY",
          message:
            "A journey state object is required.",
        },
        { status: 400 }
      );
    }

    // The row is keyed by the grant in the URL, never by a value the
    // client placed inside the state.
    const safeState = {
      ...(state as Record<string, unknown>),
      sourceGrantId: grant.id,
    } as Prisma.InputJsonObject;

    const journey =
      await prisma.grantJourney.upsert({
        where: { grantId: grant.id },
        create: {
          userId: user.id,
          grantId: grant.id,
          state: safeState,
        },
        update: {
          state: safeState,
        },
        select: {
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      updatedAt:
        journey.updatedAt.toISOString(),
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        { status: accessError.status }
      );
    }

    console.error(
      "[ESOP_GRANT_JOURNEY_PUT_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "JOURNEY_SAVE_FAILED",
        message:
          "We could not save the journey for this grant.",
      },
      { status: 500 }
    );
  }
}
