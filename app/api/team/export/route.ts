import { NextRequest, NextResponse } from "next/server";

import {
  getProAccessErrorResponse,
  requireTeamAdmin,
} from "@/lib/pro-access";

import {
  buildTeamMemberIntelligence,
} from "@/lib/team/member-intelligence";

import {
  buildTeamCsv,
  buildTeamWorkbook,
  type TeamExportDataset,
} from "@/lib/team/export";

import { prisma } from "@/lib/prisma";

const MAX_TEAM_MEMBERS = 20;

/*
|--------------------------------------------------------------------------
| GET /api/team/export
|--------------------------------------------------------------------------
|
| Team Admin only.
|
| Supported:
|
|   /api/team/export?format=csv
|   /api/team/export?format=xlsx
|
| The export is built directly from the same persisted intelligence source
| used by /api/team/analytics.
|
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * ----------------------------------------------------------------------
     * 1. TEAM ADMIN AUTHORIZATION
     * ----------------------------------------------------------------------
     */

    const { workspace } =
      await requireTeamAdmin();

    /*
     * ----------------------------------------------------------------------
     * 2. FORMAT
     * ----------------------------------------------------------------------
     */

    const url =
      new URL(request.url);

    const requestedFormat =
      url.searchParams
        .get("format")
        ?.trim()
        .toLowerCase();

    const format =
      requestedFormat === "csv"
        ? "csv"
        : requestedFormat === "xlsx"
          ? "xlsx"
          : null;

    if (!format) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_EXPORT_FORMAT",
          message:
            "Export format must be either csv or xlsx.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------------------------------------
     * 3. RELOAD ACTIVE MEMBERS
     * ----------------------------------------------------------------------
     *
     * Do not accept member IDs, workspace IDs or user IDs from the client.
     * The workspace always comes from requireTeamAdmin().
     */

    const memberships =
      await prisma.teamMembership.findMany({
        where: {
          workspaceId:
            workspace.id,

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
              name: true,
              email: true,
            },
          },
        },
      });

    /*
     * ----------------------------------------------------------------------
     * 4. BUILD REAL MEMBER INTELLIGENCE
     * ----------------------------------------------------------------------
     *
     * This is deliberately the same server-side source used by the existing
     * Team Analytical View.
     */

    const intelligenceResults =
      await Promise.all(
        memberships.map(
          async (membership) => {
            try {
              return await buildTeamMemberIntelligence(
                {
                  workspaceId:
                    workspace.id,

                  workspaceName:
                    workspace.name,

                  workspaceExpiresAt:
                    workspace.expiresAt,

                  membershipId:
                    membership.id,

                  memberUserId:
                    membership.user.id,
                }
              );
            } catch (error) {
              console.error(
                "[TEAM_EXPORT_MEMBER_BUILD_ERROR]",
                {
                  workspaceId:
                    workspace.id,

                  userId:
                    membership.user.id,

                  error,
                }
              );

              return null;
            }
          }
        )
      );

    const memberIntelligence =
      intelligenceResults.filter(
        (
          value
        ): value is NonNullable<
          (typeof intelligenceResults)[number]
        > =>
          value !== null
      );

    /*
     * ----------------------------------------------------------------------
     * 5. TEAM-LEVEL SUMMARY
     * ----------------------------------------------------------------------
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

    const highestExitValue =
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
              member
                .calculationSummary
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
              member
                .calculationSummary
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

    /*
     * ----------------------------------------------------------------------
     * 6. COMPANY AGGREGATION
     * ----------------------------------------------------------------------
     */

    const companyMap = new Map<
      string,
      {
        grants: number;
        options: number;
        members: number;
      }
    >();

    for (
      const member of memberIntelligence
    ) {
      for (
        const companyRow of
          member.analytics
            .grantCountsByCompany
      ) {
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
        .map(
          ([
            company,
            data,
          ]) => ({
            company,
            grants:
              data.grants,
            options:
              data.options,
            members:
              data.members,
          })
        )
        .sort(
          (a, b) =>
            b.options -
            a.options
        );

    /*
     * ----------------------------------------------------------------------
     * 7. ACTIVITY AGGREGATION
     * ----------------------------------------------------------------------
     */

    const activityTypeMap =
      new Map<
        string,
        number
      >();

    const activityTimelineMap =
      new Map<
        string,
        number
      >();

    for (
      const member of memberIntelligence
    ) {
      for (
        const activity of
          member.analytics
            .activityByType
      ) {
        activityTypeMap.set(
          activity.type,
          (
            activityTypeMap.get(
              activity.type
            ) ?? 0
          ) +
            activity.count
        );
      }

      for (
        const activity of
          member.analytics
            .activityTimeline
      ) {
        activityTimelineMap.set(
          activity.date,
          (
            activityTimelineMap.get(
              activity.date
            ) ?? 0
          ) +
            activity.count
        );
      }
    }

    const activityByType =
      Array.from(
        activityTypeMap.entries()
      )
        .map(
          ([
            type,
            count,
          ]) => ({
            type,
            count,
          })
        )
        .sort(
          (a, b) =>
            b.count -
            a.count
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
          ([
            date,
            count,
          ]) => ({
            date,
            count,
          })
        );

    /*
     * ----------------------------------------------------------------------
     * 8. CALCULATION AGGREGATION
     * ----------------------------------------------------------------------
     */

    const calculations =
      memberIntelligence.flatMap(
        (member) =>
          member.analytics
            .calculationExitValues
            .map(
              (calculation) => ({
                memberId:
                  member.member
                    .id,

                memberName:
                  member.member
                    .name,

                id:
                  calculation.id,

                name:
                  calculation.name,

                exitValue:
                  calculation.exitValue,

                returnMultiple:
                  calculation.returnMultiple,

                roiPercentage:
                  calculation.roiPercentage,

                createdAt:
                  calculation.createdAt,
              })
            )
      );

    calculations.sort(
      (a, b) =>
        new Date(
          a.createdAt
        ).getTime() -
        new Date(
          b.createdAt
        ).getTime()
    );

    /*
     * ----------------------------------------------------------------------
     * 9. EXPIRY AGGREGATION
     * ----------------------------------------------------------------------
     */

    const expiryTimeline =
      memberIntelligence
        .flatMap(
          (member) =>
            member.analytics
              .grantExpiryTimeline
              .map(
                (grant) => ({
                  grantId:
                    grant.grantId,

                  grantName:
                    grant.grantName,

                  companyName:
                    grant.companyName,

                  expiryDate:
                    grant.expiryDate,

                  optionCount:
                    grant.optionCount,

                  daysRemaining:
                    grant.daysRemaining,

                  memberId:
                    member.member
                      .id,

                  memberName:
                    member.member
                      .name,
                })
              )
        )
        .sort(
          (a, b) =>
            a.daysRemaining -
            b.daysRemaining
        );

    /*
     * ----------------------------------------------------------------------
     * 10. MEMBER EXPORT DATA
     * ----------------------------------------------------------------------
     */

    const members =
      memberIntelligence
        .map(
          (member) => ({
            id:
              member.member.id,

            name:
              member.member.name,

            email:
              member.member.email,

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
  String(
    member.membership.addedAt
  ),
          })
        )
        .sort(
          (a, b) =>
            b.options -
            a.options
        );

    /*
     * ----------------------------------------------------------------------
     * 11. BUILD FINAL EXPORT DATASET
     * ----------------------------------------------------------------------
     */

    const dataset:
      TeamExportDataset = {
      workspace: {
        id:
          workspace.id,

        name:
          workspace.name,

        status:
          workspace.status,

      startedAt:
  String(workspace.startedAt),

        expiresAt:
  String(workspace.expiresAt),

        maxMembers:
          MAX_TEAM_MEMBERS,

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

          highestExitValue,

        averageRoi,

        averageReturnMultiple,

        membersWithGrants,

        membersWithCalculations,

        membersWithRecentActivity,
      },

      members,

      companies,

      activityByType,

      activityTimeline,

      calculations,

      expiryTimeline,
    };

    /*
     * ----------------------------------------------------------------------
     * 12. CSV EXPORT
     * ----------------------------------------------------------------------
     */

    if (format === "csv") {
      const csv =
        buildTeamCsv(
          dataset
        );

      /*
       * UTF-8 BOM improves compatibility with Excel on Windows while keeping
       * the file a normal CSV.
       */
      const csvWithBom =
        `\uFEFF${csv}`;

      const safeName =
        sanitizeFileName(
          workspace.name
        );

      const filename =
        `${safeName}-team-intelligence.csv`;

      return new NextResponse(
        csvWithBom,
        {
          status: 200,

          headers: {
            "Content-Type":
              "text/csv; charset=utf-8",

            "Content-Disposition":
              `attachment; filename="${filename}"`,

            "Cache-Control":
              "no-store, max-age=0",

            "X-Content-Type-Options":
              "nosniff",
          },
        }
      );
    }

    /*
     * ----------------------------------------------------------------------
     * 13. XLSX EXPORT
     * ----------------------------------------------------------------------
     */

    const workbookBuffer =
      await buildTeamWorkbook(
        dataset
      );

    const safeName =
      sanitizeFileName(
        workspace.name
      );

    const filename =
      `${safeName}-team-intelligence.xlsx`;

    const body =
      new Uint8Array(
        workbookBuffer
      );

    return new NextResponse(
      body,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    /*
     * ----------------------------------------------------------------------
     * ACCESS ERRORS
     * ----------------------------------------------------------------------
     */

    const accessError =
      getProAccessErrorResponse(
        error
      );

    if (accessError) {
      return NextResponse.json(
        accessError.body,
        {
          status:
            accessError.status,
        }
      );
    }

    /*
     * ----------------------------------------------------------------------
     * UNEXPECTED ERRORS
     * ----------------------------------------------------------------------
     */

    console.error(
      "[TEAM_EXPORT_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "TEAM_EXPORT_FAILED",
        message:
          "We could not generate the Team export. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| FILE NAME SAFETY
|--------------------------------------------------------------------------
*/

function sanitizeFileName(
  value: string
): string {
  const cleaned =
    value
      .trim()
      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        "-"
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        ""
      );

  return (
    cleaned ||
    "EVC-Team-Workspace"
  );
}