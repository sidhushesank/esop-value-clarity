import { toCsv } from "@/data/esop-liquidity-events";

export const dynamic = "force-static";

export function GET() {
  return new Response(toCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="india-esop-buyback-tracker-evc.csv"',
    },
  });
}
