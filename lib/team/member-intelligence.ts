import { prisma } from "@/lib/prisma";

/**
 * ============================================================================
 * EVC TEAM MEMBER INTELLIGENCE
 * ============================================================================
 *
 * Server-side aggregation layer for Team Workspace.
 *
 * IMPORTANT:
 * - This file reads REAL persisted EVC data only.
 * - It never uses another user's browser localStorage.
 * - It never creates demo/fake member metrics.
 * - It is intentionally independent from the Team UI so the same dataset can
 *   power Preview, Compare, Analysis and Team Analytical View.
 *
 * Current persisted EVC sources:
 * - User
 * - EsopGrant
 * - EsopDocument
 * - EsopGrantField
 * - EsopDocumentClause
 * - Calculation
 * - UserActivity
 *
 * The current schema does not persist the complete browser-based Pro state
 * (vesting/exercise/dilution/tax/exit assumptions) as one server-side object.
 * Therefore this builder only exposes metrics that are actually persisted.
 * The deeper Pro-model analytics must be added later through a persisted
 * analysis/session layer rather than inventing values here.
 * ============================================================================
 */

export type TeamMemberGrantSummary = {
  grantCount: number;
  confirmedGrantCount: number;
  totalOptions: number;
  totalExerciseCost: number;
  companies: string[];
  earliestGrantDate: string | null;
  latestGrantDate: string | null;
  nextExpiryDate: string | null;
  expiringWithin365Days: number;
};

export type TeamMemberCalculationSummary = {
  calculationCount: number;
  latestCalculationAt: string | null;
  totalModeledGrantUnits: number;
  totalExitValue: number;
  highestExitValue: number;
  averageExitValue: number;
  averageReturnMultiple: number;
  averageRoiPercentage: number;
};

export type TeamMemberActivitySummary = {
  activityCount: number;
  lastActivityAt: string | null;

  byType: Array<{
    type: string;
    count: number;
    lastOccurredAt: string | null;
  }>;

  recent: Array<{
    id: string;
    type: string;
    createdAt: string;
    metadata: unknown;
  }>;
};

export type TeamMemberDocumentSummary = {
  documentCount: number;
  confirmedDocumentCount: number;
  clauseCount: number;
  reviewDocumentCount: number;
};

export type TeamMemberIntelligence = {
  member: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
  };

  membership: {
    membershipId: string;
    status: string;
    addedAt: string;
    workspaceId: string;
    workspaceName: string;
    workspaceExpiresAt: string;
  };

  grantSummary: TeamMemberGrantSummary;

  calculationSummary: TeamMemberCalculationSummary;

  activitySummary: TeamMemberActivitySummary;

  documentSummary: TeamMemberDocumentSummary;

  /**
   * Compact dataset specifically intended for chart components.
   * These values all originate from persisted EVC records.
   */
  analytics: {
    grantCountsByCompany: Array<{
      company: string;
      grants: number;
      options: number;
    }>;

    calculationExitValues: Array<{
      id: string;
      name: string;
      exitValue: number;
      returnMultiple: number;
      roiPercentage: number;
      createdAt: string;
    }>;

    activityTimeline: Array<{
      date: string;
      count: number;
    }>;

    activityByType: Array<{
      type: string;
      count: number;
    }>;

    grantExpiryTimeline: Array<{
      grantId: string;
      grantName: string;
      companyName: string;
      expiryDate: string;
      optionCount: number;
      daysRemaining: number;
    }>;
  };
};

function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value ?? NaN)
    ? Number(value)
    : 0;
}

function safeDate(value: Date | null | undefined): string | null {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString()
    : null;
}

function daysFromNow(date: Date): number {
  const now = new Date();

  const milliseconds =
    date.getTime() - now.getTime();

  return Math.ceil(
    milliseconds / (1000 * 60 * 60 * 24)
  );
}

/**
 * Build the complete Team Workspace intelligence object for one member.
 *
 * The caller MUST already have verified that the member belongs to the
 * requesting Admin's Team Workspace.
 */
export async function buildTeamMemberIntelligence({
  workspaceId,
  workspaceName,
  workspaceExpiresAt,
  membershipId,
  memberUserId,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceExpiresAt: Date;
  membershipId: string;
  memberUserId: string;
}): Promise<TeamMemberIntelligence | null> {
  const member = await prisma.user.findUnique({
    where: {
      id: memberUserId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      accountStatus: true,
      createdAt: true,
      lastLoginAt: true,
      lastActiveAt: true,

      esopDocuments: {
        select: {
          id: true,
          status: true,

          clauses: {
            select: {
              id: true,
            },
          },
        },
      },

      esopGrants: {
        where: {
          archivedAt: null,
        },

        orderBy: [
          {
            grantDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        select: {
          id: true,
          status: true,
          companyName: true,
          grantName: true,
          grantDate: true,
          optionCount: true,
          strikePrice: true,
          currency: true,
          vestingStartDate: true,
          vestingDurationMonths: true,
          cliffMonths: true,
          vestingFrequency: true,
          expiryDate: true,
          postTerminationExerciseDays: true,
          confirmedAt: true,
          createdAt: true,

          document: {
            select: {
              id: true,
              status: true,
              originalFileName: true,
              confirmedAt: true,

              clauses: {
                select: {
                  id: true,
                  type: true,
                  importance: true,
                },
              },
            },
          },

          fields: {
            select: {
              id: true,
              fieldKey: true,
              label: true,
              confirmedValue: true,
              extractedValue: true,
              status: true,
              sourcePage: true,
            },
          },
        },
      },

      calculations: {
        select: {
          id: true,
          name: true,
          esopsGranted: true,
          vestedPercentage: true,
          currentValuation: true,
          dilutionPercentage: true,
          exitValuation: true,
          vestedShares: true,
          valueToday: true,
          afterDilution: true,
          exitValue: true,
          totalShares: true,
          strikePrice: true,
          unvestedShares: true,
          ownershipPercentage: true,
          currentSharePrice: true,
          grossValueToday: true,
          exerciseCost: true,
          netValueToday: true,
          grossExitValue: true,
          dilutionImpact: true,
          netExitProceeds: true,
          returnMultiple: true,
          roiPercentage: true,
          breakEvenExitValuation: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      activities: {
        orderBy: {
          createdAt: "desc",
        },

        take: 250,

        select: {
          id: true,
          type: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  const grants = member.esopGrants;

  const confirmedGrants = grants.filter(
    (grant) => grant.status === "CONFIRMED"
  );

  const totalOptions = confirmedGrants.reduce(
    (sum, grant) =>
      sum + Math.max(safeNumber(grant.optionCount), 0),
    0
  );

  const totalExerciseCost = confirmedGrants.reduce(
    (sum, grant) =>
      sum +
      Math.max(safeNumber(grant.optionCount), 0) *
        Math.max(safeNumber(grant.strikePrice), 0),
    0
  );

  const companies = Array.from(
    new Set(
      confirmedGrants
        .map((grant) => grant.companyName?.trim())
        .filter(
          (company): company is string =>
            Boolean(company)
        )
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );

  const grantDates = confirmedGrants
    .map((grant) => grant.grantDate)
    .filter(
      (date): date is Date =>
        date instanceof Date
    )
    .sort(
      (a, b) =>
        a.getTime() - b.getTime()
    );

  const expiryDates = confirmedGrants
    .map((grant) => grant.expiryDate)
    .filter(
      (date): date is Date =>
        date instanceof Date
    )
    .sort(
      (a, b) =>
        a.getTime() - b.getTime()
    );

  const nextExpiryDate =
    expiryDates.length > 0
      ? expiryDates.find(
          (date) =>
            daysFromNow(date) >= 0
        ) ?? null
      : null;

  const expiringWithin365Days =
    expiryDates.filter((date) => {
      const days = daysFromNow(date);

      return days >= 0 && days <= 365;
    }).length;

  const calculationCount =
    member.calculations.length;

  const totalExitValue =
    member.calculations.reduce(
      (sum, calculation) =>
        sum +
        safeNumber(calculation.exitValue),
      0
    );

  const highestExitValue =
    member.calculations.reduce(
      (highest, calculation) =>
        Math.max(
          highest,
          safeNumber(calculation.exitValue)
        ),
      0
    );

  const averageExitValue =
    calculationCount > 0
      ? totalExitValue / calculationCount
      : 0;

  const totalReturnMultiple =
    member.calculations.reduce(
      (sum, calculation) =>
        sum +
        Math.max(
          safeNumber(
            calculation.returnMultiple
          ),
          0
        ),
      0
    );

  const totalRoi =
    member.calculations.reduce(
      (sum, calculation) =>
        sum +
        safeNumber(
          calculation.roiPercentage
        ),
      0
    );

  const latestCalculationAt =
    member.calculations.length > 0
      ? safeDate(
          member.calculations[0].createdAt
        )
      : null;

  const activityMap = new Map<
    string,
    {
      count: number;
      lastOccurredAt: Date;
    }
  >();

  for (const activity of member.activities) {
    const current =
      activityMap.get(activity.type);

    if (!current) {
      activityMap.set(activity.type, {
        count: 1,
        lastOccurredAt: activity.createdAt,
      });
      continue;
    }

    current.count += 1;

    if (
      activity.createdAt.getTime() >
      current.lastOccurredAt.getTime()
    ) {
      current.lastOccurredAt =
        activity.createdAt;
    }
  }

  const byType = Array.from(
    activityMap.entries()
  )
    .map(([type, value]) => ({
      type,
      count: value.count,
      lastOccurredAt:
        value.lastOccurredAt.toISOString(),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.type.localeCompare(b.type);
    });

  const activityTimelineMap = new Map<
    string,
    number
  >();

  for (const activity of member.activities) {
    const dateKey =
      activity.createdAt
        .toISOString()
        .slice(0, 10);

    activityTimelineMap.set(
      dateKey,
      (activityTimelineMap.get(
        dateKey
      ) ?? 0) + 1
    );
  }

  const activityTimeline = Array.from(
    activityTimelineMap.entries()
  )
    .sort(([a], [b]) =>
      a.localeCompare(b)
    )
    .map(([date, count]) => ({
      date,
      count,
    }));

  const activityByType = byType.map(
    (item) => ({
      type: item.type,
      count: item.count,
    })
  );

  const grantCountsByCompanyMap = new Map<
    string,
    {
      grants: number;
      options: number;
    }
  >();

  for (const grant of confirmedGrants) {
    const company =
      grant.companyName?.trim() ||
      "Company not specified";

    const current =
      grantCountsByCompanyMap.get(company) ?? {
        grants: 0,
        options: 0,
      };

    current.grants += 1;

    current.options += Math.max(
      safeNumber(grant.optionCount),
      0
    );

    grantCountsByCompanyMap.set(
      company,
      current
    );
  }

  const grantCountsByCompany =
    Array.from(
      grantCountsByCompanyMap.entries()
    )
      .map(([company, value]) => ({
        company,
        grants: value.grants,
        options: value.options,
      }))
      .sort((a, b) => {
        if (b.options !== a.options) {
          return b.options - a.options;
        }

        return a.company.localeCompare(
          b.company
        );
      });

  const calculationExitValues =
    member.calculations.map(
      (calculation) => ({
        id: calculation.id,
        name:
          calculation.name?.trim() ||
          "Untitled calculation",
        exitValue: safeNumber(
          calculation.exitValue
        ),
        returnMultiple: Math.max(
          safeNumber(
            calculation.returnMultiple
          ),
          0
        ),
        roiPercentage: safeNumber(
          calculation.roiPercentage
        ),
        createdAt:
          calculation.createdAt.toISOString(),
      })
    );

  const grantExpiryTimeline =
    confirmedGrants
      .filter(
        (
          grant
        ): grant is typeof grant & {
          expiryDate: Date;
        } =>
          grant.expiryDate instanceof Date
      )
      .map((grant) => ({
        grantId: grant.id,
        grantName:
          grant.grantName?.trim() ||
          "Unnamed grant",
        companyName:
          grant.companyName?.trim() ||
          "Company not specified",
        expiryDate:
          grant.expiryDate.toISOString(),
        optionCount: Math.max(
          safeNumber(grant.optionCount),
          0
        ),
        daysRemaining:
          daysFromNow(
            grant.expiryDate
          ),
      }))
      .filter(
        (grant) =>
          grant.daysRemaining >= 0
      )
      .sort(
        (a, b) =>
          a.daysRemaining -
          b.daysRemaining
      );

  const clauseCount =
    member.esopDocuments.reduce(
      (sum, document) =>
        sum + document.clauses.length,
      0
    );

  const confirmedDocumentCount =
    member.esopDocuments.filter(
      (document) =>
        document.status ===
        "CONFIRMED"
    ).length;

  const reviewDocumentCount =
    member.esopDocuments.filter(
      (document) =>
        document.status ===
        "REVIEW_REQUIRED"
    ).length;

  const lastActivityAt =
    member.activities.length > 0
      ? safeDate(
          member.activities[0].createdAt
        )
      : null;

  return {
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      accountStatus: member.accountStatus,
      emailVerified: member.emailVerified,
      createdAt:
        member.createdAt.toISOString(),
      lastLoginAt:
        safeDate(member.lastLoginAt),
      lastActiveAt:
        safeDate(member.lastActiveAt),
    },

    membership: {
      membershipId,
      status: "ACTIVE",
      addedAt:
        (
          await prisma.teamMembership.findUnique(
            {
              where: {
                id: membershipId,
              },
              select: {
                addedAt: true,
              },
            }
          )
        )?.addedAt.toISOString() ??
        new Date().toISOString(),

      workspaceId,
      workspaceName,
      workspaceExpiresAt:
        workspaceExpiresAt.toISOString(),
    },

    grantSummary: {
      grantCount: grants.length,
      confirmedGrantCount:
        confirmedGrants.length,
      totalOptions,
      totalExerciseCost,
      companies,
      earliestGrantDate:
        grantDates.length > 0
          ? grantDates[0].toISOString()
          : null,
      latestGrantDate:
        grantDates.length > 0
          ? grantDates[
              grantDates.length - 1
            ].toISOString()
          : null,
      nextExpiryDate:
        nextExpiryDate?.toISOString() ??
        null,
      expiringWithin365Days,
    },

    calculationSummary: {
      calculationCount,
      latestCalculationAt,
      totalModeledGrantUnits:
        member.calculations.reduce(
          (sum, calculation) =>
            sum +
            Math.max(
              safeNumber(
                calculation.esopsGranted
              ),
              0
            ),
          0
        ),
      totalExitValue,
      highestExitValue,
      averageExitValue,
      averageReturnMultiple:
        calculationCount > 0
          ? totalReturnMultiple /
            calculationCount
          : 0,
      averageRoiPercentage:
        calculationCount > 0
          ? totalRoi /
            calculationCount
          : 0,
    },

    activitySummary: {
      activityCount:
        member.activities.length,
      lastActivityAt,
      byType,
      recent:
        member.activities
          .slice(0, 20)
          .map((activity) => ({
            id: activity.id,
            type: activity.type,
            createdAt:
              activity.createdAt.toISOString(),
            metadata: activity.metadata,
          })),
    },

    documentSummary: {
      documentCount:
        member.esopDocuments.length,
      confirmedDocumentCount,
      clauseCount,
      reviewDocumentCount,
    },

    analytics: {
      grantCountsByCompany,

      calculationExitValues,

      activityTimeline,

      activityByType,

      grantExpiryTimeline,
    },
  };
}