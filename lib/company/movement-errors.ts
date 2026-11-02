import { prisma } from "@/lib/prisma";
import type { NegativeBalance } from "@/lib/company/captable";

/** Turns a negative-balance finding into a sentence the founder can act on. */
export async function describeNegative(n: NegativeBalance): Promise<string> {
  const [holder, cls] = await Promise.all([
    prisma.shareholder.findUnique({ where: { id: n.holderId }, select: { name: true } }),
    prisma.securityClass.findUnique({ where: { id: n.classId }, select: { name: true } }),
  ]);

  const day = n.date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${holder?.name ?? "A shareholder"} would hold ${n.balance.toLocaleString("en-IN")} ${cls?.name ?? "units"} on ${day}. Nobody can transfer, convert or sell back more than they hold on that date.`;
}
