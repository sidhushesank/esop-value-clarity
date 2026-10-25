import { NextResponse } from "next/server";

import { getProAccessErrorResponse } from "@/lib/pro-access";

export function advisorErrorResponse(error: unknown) {
  const known = getProAccessErrorResponse(error);

  if (known) {
    return NextResponse.json(known.body, { status: known.status });
  }

  console.error("[advisor] unexpected error:", error);

  return NextResponse.json(
    {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
    { status: 500 }
  );
}