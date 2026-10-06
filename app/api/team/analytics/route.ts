import { NextResponse } from "next/server";

import {
  getProAccessErrorResponse,
  requireTeamAdmin,
} from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";
import { buildTeamMemberIntelligence } from "@/lib/team/member-intelligence";

/**
 * GET /api/team/analytics
 *
 * Returns the real persisted intelligence dataset for every ACTIVE member
 * belonging to the authenticated Team Admin's workspace.
 *
 * IMPORTANT:
 * - Team Admin only.
 * - Never accepts arbitrary workspaceId from the client.
 * - Never accepts arbitrary user IDs.
 * - Every member is resolved through the authenticated owner's workspace.
 * - No fake/demo analytics are generated.
 */
export async function GET() {
  try {
    const { workspace } =
      await requireTeamAdmin();

    const members =
      await prisma.teamMembership.findMany({
        where: {
          workspaceId: workspace.id,
          status: "ACTIVE",
        },
        orderBy: {
          addedAt: "asc",
        },
        select: {
          id: true,
          addedAt: true,

          user: {
            select: {
              id: true,
            },
          },
        },
      });

    const intelligenceResults =
      await Promise.all(
        members.map(async (membership) => {
          try {
            const intelligence =
              await buildTeamMemberIntelligence({
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                workspaceExpiresAt:
                  workspace.expiresAt,
                membershipId:
                  membership.id,
                memberUserId:
                  membership.user.id,
              });

            if (!intelligence) {
              return null;
            }

            return intelligence;
          } catch (error) {
            console.error(
              "[TEAM_ANALYTICS_MEMBER_BUILD_ERROR]",
              {
                workspaceId: workspace.id,
                userId: membership.user.id,
                error,
              }
            );

            return null;
          }
        })
      );

    const memberIntelligence =
      intelligenceResults.filter(
        (
          value
        ): value is NonNullable<
          (typeof intelligenceResults)[number]
        > => value !== null
      );

    /**
     * ------------------------------------------------------------------------
     * TEAM-LEVEL AGGREGATION
     * ------------------------------------------------------------------------
     */

    const totalOptions =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.grantSummary
            .totalOptions,
        0
      );

    const totalExerciseCost =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.grantSummary
            .totalExerciseCost,
        0
      );

    const totalConfirmedGrants =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.grantSummary
            .confirmedGrantCount,
        0
      );

    const totalCalculations =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.calculationSummary
            .calculationCount,
        0
      );

    const totalActivity =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.activitySummary
            .activityCount,
        0
      );

    const totalDocuments =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.documentSummary
            .documentCount,
        0
      );

    const totalConfirmedDocuments =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.documentSummary
            .confirmedDocumentCount,
        0
      );

    const totalHighestExitValue =
      memberIntelligence.reduce(
        (highest, member) =>
          Math.max(
            highest,
            member.calculationSummary
              .highestExitValue
          ),
        0
      );

    const totalExitValue =
      memberIntelligence.reduce(
        (sum, member) =>
          sum +
          member.calculationSummary
            .totalExitValue,
        0
      );

    const averageRoi =
      memberIntelligence.length > 0
        ? memberIntelligence.reduce(
            (sum, member) =>
              sum +
              member.calculationSummary
                .averageRoiPercentage,
            0
          ) /
          memberIntelligence.length
        : 0;

    const averageReturnMultiple =
      memberIntelligence.length > 0
        ? memberIntelligence.reduce(
            (sum, member) =>
              sum +
              member.calculationSummary
                .averageReturnMultiple,
            0
          ) /
          memberIntelligence.length
        : 0;

    const membersWithGrants =
      memberIntelligence.filter(
        (member) =>
          member.grantSummary
            .confirmedGrantCount > 0
      ).length;

    const membersWithCalculations =
      memberIntelligence.filter(
        (member) =>
          member.calculationSummary
            .calculationCount > 0
      ).length;

    const membersWithRecentActivity =
      memberIntelligence.filter(
        (member) =>
          member.activitySummary
            .activityCount > 0
      ).length;

    /**
     * ------------------------------------------------------------------------
     * TEAM COMPANY AGGREGATION
     * ------------------------------------------------------------------------
     */

    const companyMap = new Map<
      string,
      {
        grants: number;
        options: number;
        members: number;
      }
    >();

    for (const member of memberIntelligence) {
      for (const companyRow of member.analytics
        .grantCountsByCompany) {
        const existing =
          companyMap.get(
            companyRow.company
          ) ?? {
            grants: 0,
            options: 0,
            members: 0,
          };

        existing.grants +=
          companyRow.grants;

        existing.options +=
          companyRow.options;

        existing.members += 1;

        companyMap.set(
          companyRow.company,
          existing
        );
      }
    }

    const companies =
      Array.from(
        companyMap.entries()
      )
        .map(([company, data]) => ({
          company,
          grants: data.grants,
          options: data.options,
          members: data.members,
        }))
        .sort(
          (a, b) =>
            b.options - a.options
        );

    /**
     * ------------------------------------------------------------------------
     * TEAM ACTIVITY AGGREGATION
     * ------------------------------------------------------------------------
     */

    const activityTypeMap =
      new Map<string, number>();

    const activityTimelineMap =
      new Map<string, number>();

    for (const member of memberIntelligence) {
      for (const activity of member
        .analytics.activityByType) {
        activityTypeMap.set(
          activity.type,
          (activityTypeMap.get(
            activity.type
          ) ?? 0) +
            activity.count
        );
      }

      for (const activity of member
        .analytics.activityTimeline) {
        activityTimelineMap.set(
          activity.date,
          (activityTimelineMap.get(
            activity.date
          ) ?? 0) +
            activity.count
        );
      }
    }

    const activityByType =
      Array.from(
        activityTypeMap.entries()
      )
        .map(
          ([type, count]) => ({
            type,
            count,
          })
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );

    const activityTimeline =
      Array.from(
        activityTimelineMap.entries()
      )
        .sort(
          ([a], [b]) =>
            a.localeCompare(b)
        )
        .map(
          ([date, count]) => ({
            date,
            count,
          })
        );

    /**
     * ------------------------------------------------------------------------
     * TEAM CALCULATION AGGREGATION
     * ------------------------------------------------------------------------
     */

    const calculationSeries =
      memberIntelligence.flatMap(
        (member) =>
          member.analytics
            .calculationExitValues.map(
              (calculation) => ({
                memberId:
                  member.member.id,
                memberName:
                  member.member.name,
                ...calculation,
              })
            )
      );

    calculationSeries.sort(
      (a, b) =>
        new Date(
          a.createdAt
        ).getTime() -
        new Date(
          b.createdAt
        ).getTime()
    );

    /**
     * ------------------------------------------------------------------------
     * EXPIRY AGGREGATION
     * ------------------------------------------------------------------------
     */

    const expiryTimeline =
      memberIntelligence
        .flatMap(
          (member) =>
            member.analytics
              .grantExpiryTimeline.map(
                (grant) => ({
                  ...grant,
                  memberId:
                    member.member.id,
                  memberName:
                    member.member.name,
                })
              )
        )
        .sort(
          (a, b) =>
            a.daysRemaining -
            b.daysRemaining
        );

    /**
     * ------------------------------------------------------------------------
     * MEMBER RANKING / COMPARISON DATA
     * ------------------------------------------------------------------------
     *
     * These are descriptive persisted-data metrics.
     * They are not intended to represent employee performance ratings.
     */

    const memberSummary =
      memberIntelligence
        .map((member) => ({
          id: member.member.id,
          name: member.member.name,
          email: member.member.email,

          options:
            member.grantSummary
              .totalOptions,

          confirmedGrants:
            member.grantSummary
              .confirmedGrantCount,

          exerciseCost:
            member.grantSummary
              .totalExerciseCost,

          calculations:
            member.calculationSummary
              .calculationCount,

          totalExitValue:
            member.calculationSummary
              .totalExitValue,

          highestExitValue:
            member.calculationSummary
              .highestExitValue,

          averageReturnMultiple:
            member.calculationSummary
              .averageReturnMultiple,

          averageRoiPercentage:
            member.calculationSummary
              .averageRoiPercentage,

          activities:
            member.activitySummary
              .activityCount,

          documents:
            member.documentSummary
              .documentCount,

          expiringWithin365Days:
            member.grantSummary
              .expiringWithin365Days,

          addedAt:
            member.membership.addedAt,
        }))
        .sort(
          (a, b) =>
            b.options - a.options
        );

    return NextResponse.json({
      success: true,

      workspace: {
        id: workspace.id,
        name: workspace.name,
        status: workspace.status,
        startedAt: workspace.startedAt,
        expiresAt: workspace.expiresAt,

        maxMembers: 20,
        activeMemberCount:
          memberIntelligence.length,
      },

      summary: {
        memberCount:
          memberIntelligence.length,

        totalOptions,

        totalExerciseCost,

        totalConfirmedGrants,

        totalCalculations,

        totalActivity,

        totalDocuments,

        totalConfirmedDocuments,

        totalExitValue,

        highestExitValue:
          totalHighestExitValue,

        averageRoi,

        averageReturnMultiple,

        membersWithGrants,

        membersWithCalculations,

        membersWithRecentActivity,
      },

      analytics: {
        companies,

        activityByType,

        activityTimeline,

        calculationSeries,

        expiryTimeline,
      },

      members: memberSummary,

      /**
       * Full member intelligence is returned because the same server-backed
       * dataset powers the workspace analytical canvas and member drill-downs.
       */
      memberIntelligence,

      meta: {
        source:
          "PERSISTED_EVC_TEAM_DATA",
        retrievedAt:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    const accessError =
      getProAccessErrorResponse(error);

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status: accessError.status,
        }
      );
    }

    console.error(
      "[TEAM_ANALYTICS_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "TEAM_ANALYTICS_LOAD_FAILED",
        message:
          "We could not load the Team analytical dataset.",
      },
      {
        status: 500,
      }
    );
  }
}