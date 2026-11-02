import { prisma } from "@/lib/prisma";
import {
  buildCapTable,
  type ClassLite,
  type EsopLite,
  type HolderLite,
  type MovementLite,
} from "@/lib/company/captable";

/** Grants that use up pool and count as options in issue. Drafts do not. */
const ISSUED_GRANT_STATUSES = ["ISSUED", "ACCEPTED", "LEFT", "EXERCISED"] as const;

export async function loadMovements(workspaceId: string): Promise<MovementLite[]> {
  const rows = await prisma.shareMovement.findMany({
    where: { workspaceId },
    select: {
      id: true,
      kind: true,
      date: true,
      createdAt: true,
      classId: true,
      toClassId: true,
      fromHolderId: true,
      toHolderId: true,
      quantity: true,
      toQuantity: true,
    },
  });

  return rows;
}

export async function loadEsop(workspaceId: string): Promise<EsopLite> {
  const [schemes, grants] = await Promise.all([
    prisma.esopScheme.aggregate({
      where: { workspaceId, archivedAt: null },
      _sum: { poolSize: true },
    }),
    prisma.optionGrant.findMany({
      where: { workspaceId, status: { in: [...ISSUED_GRANT_STATUSES] } },
      select: { options: true, optionsLapsed: true, optionsExercised: true },
    }),
  ]);

  let grantedNetOfLapsed = 0;
  let outstandingOptions = 0;

  for (const g of grants) {
    grantedNetOfLapsed += g.options - g.optionsLapsed;
    outstandingOptions += Math.max(0, g.options - g.optionsLapsed - g.optionsExercised);
  }

  return {
    poolSize: schemes._sum.poolSize ?? 0,
    grantedNetOfLapsed,
    outstandingOptions,
  };
}

export async function loadCapTable(workspaceId: string, asOf?: Date) {
  const [classes, holders, movements, esop, movementLog] = await Promise.all([
    prisma.securityClass.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shareholder.findMany({
      where: { workspaceId, archivedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    loadMovements(workspaceId),
    loadEsop(workspaceId),
    prisma.shareMovement.findMany({
      where: { workspaceId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        class: { select: { name: true } },
        fromHolder: { select: { name: true } },
        toHolder: { select: { name: true } },
      },
    }),
  ]);

  const classLite: ClassLite[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    conversionRatio: c.conversionRatio,
    principalAmount: c.principalAmount,
  }));

  const holderLite: HolderLite[] = holders.map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type,
  }));

  const snapshot = buildCapTable({
    classes: classLite,
    holders: holderLite,
    movements,
    esop,
    asOf,
  });

  const classNames = new Map(classes.map((c) => [c.id, c.name]));

  return {
    classes,
    holders,
    snapshot,
    movements: movementLog.map((m) => ({
      id: m.id,
      kind: m.kind,
      date: m.date,
      className: m.class.name,
      toClassName: m.toClassId ? (classNames.get(m.toClassId) ?? "Archived class") : null,
      fromHolderName: m.fromHolder?.name ?? null,
      toHolderName: m.toHolder?.name ?? null,
      quantity: m.quantity,
      toQuantity: m.toQuantity,
      pricePerShare: m.pricePerShare,
      note: m.note,
      createdAt: m.createdAt,
    })),
  };
}
