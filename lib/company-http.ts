import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { getProAccessErrorResponse } from "@/lib/pro-access";

/** Same shape as the Advisor routes: known access errors pass through, the rest is a 500. */
export function companyErrorResponse(error: unknown) {
  const known = getProAccessErrorResponse(error);

  if (known) {
    return NextResponse.json(known.body, { status: known.status });
  }

  console.error("[company] unexpected error:", error);

  return NextResponse.json(
    {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
    { status: 500 }
  );
}

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid input.",
    },
    { status: 400 }
  );
}

export function badRequest(message: string, code = "BAD_REQUEST", status = 400) {
  return NextResponse.json({ success: false, code, message }, { status });
}
