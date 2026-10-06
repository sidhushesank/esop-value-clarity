import ExcelJS from "exceljs";

/*
|--------------------------------------------------------------------------
| TEAM EXPORT TYPES
|--------------------------------------------------------------------------
|
| These types mirror the real Team Analytical dataset already consumed by
| TeamAnalyticalView.
|
*/

export type TeamExportMember = {
  id: string;
  name: string;
  email: string;
  options: number;
  confirmedGrants: number;
  exerciseCost: number;
  calculations: number;
  totalExitValue: number;
  highestExitValue: number;
  averageReturnMultiple: number;
  averageRoiPercentage: number;
  activities: number;
  documents: number;
  expiringWithin365Days: number;
  addedAt: string;
};

export type TeamExportCompany = {
  company: string;
  grants: number;
  options: number;
  members: number;
};

export type TeamExportActivity = {
  type: string;
  count: number;
};

export type TeamExportActivityTimeline = {
  date: string;
  count: number;
};

export type TeamExportCalculation = {
  memberId: string;
  memberName: string;
  id: string;
  name: string;
  exitValue: number;
  returnMultiple: number;
  roiPercentage: number;
  createdAt: string;
};

export type TeamExportExpiry = {
  grantId: string;
  grantName: string;
  companyName: string;
  expiryDate: string;
  optionCount: number;
  daysRemaining: number;
  memberId: string;
  memberName: string;
};

export type TeamExportSummary = {
  memberCount: number;
  totalOptions: number;
  totalExerciseCost: number;
  totalConfirmedGrants: number;
  totalCalculations: number;
  totalActivity: number;
  totalDocuments: number;
  totalConfirmedDocuments: number;
  totalExitValue: number;
  highestExitValue: number;
  averageRoi: number;
  averageReturnMultiple: number;
  membersWithGrants: number;
  membersWithCalculations: number;
  membersWithRecentActivity: number;
};

export type TeamExportWorkspace = {
  id: string;
  name: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  maxMembers: number;
  activeMemberCount: number;
};

export type TeamExportDataset = {
  workspace: TeamExportWorkspace;
  summary: TeamExportSummary;
  members: TeamExportMember[];
  companies: TeamExportCompany[];
  activityByType: TeamExportActivity[];
  activityTimeline: TeamExportActivityTimeline[];
  calculations: TeamExportCalculation[];
  expiryTimeline: TeamExportExpiry[];
};

/*
|--------------------------------------------------------------------------
| XLSX THEME
|--------------------------------------------------------------------------
*/

const COLORS = {
  navy: "07111F",
  navySoft: "0F1B2D",
  blue: "2563EB",
  blueSoft: "DBEAFE",
  slate: "475569",
  slateLight: "64748B",
  slateBorder: "E2E8F0",
  slateBackground: "F8FAFC",
  white: "FFFFFF",
  green: "059669",
  greenSoft: "D1FAE5",
  amber: "D97706",
  amberSoft: "FEF3C7",
  red: "DC2626",
  redSoft: "FEE2E2",
};

const INR_FORMAT =
  '[$₹-en-IN]#,##0;[Red]-[$₹-en-IN]#,##0';

const NUMBER_FORMAT =
  '#,##0;[Red]-#,##0';

const DECIMAL_FORMAT =
  '#,##0.00;[Red]-#,##0.00';

const PERCENT_FORMAT =
  '0.0"%"';

const MULTIPLE_FORMAT =
  '0.00"x"';

const DATE_FORMAT =
  "dd-mmm-yyyy";

const DATETIME_FORMAT =
  "dd-mmm-yyyy hh:mm";

/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

export async function buildTeamWorkbook(
  dataset: TeamExportDataset
): Promise<Buffer> {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "ESOP Value Clarity";

  workbook.lastModifiedBy =
    "ESOP Value Clarity";

  workbook.created =
    new Date();

  workbook.modified =
    new Date();

  workbook.title =
    `${dataset.workspace.name} - Team Intelligence`;

  workbook.subject =
    "EVC Team Intelligence Export";

  workbook.description =
    "Professional Team Intelligence export generated from persisted EVC data.";

  workbook.company =
    "ESOP Value Clarity";

  workbook.manager =
    "ESOP Value Clarity";

  

  workbook.calcProperties.fullCalcOnLoad =
    true;

  /*
   * Sheet order is deliberate.
   */
  addSummarySheet(
    workbook,
    dataset
  );

  addMembersSheet(
    workbook,
    dataset
  );

  addCompaniesSheet(
    workbook,
    dataset
  );

  addActivitySheet(
    workbook,
    dataset
  );

  addCalculationsSheet(
    workbook,
    dataset
  );

  addExpirySheet(
    workbook,
    dataset
  );

  /*
   * Workbook properties and active sheet.
   */
 

  return Buffer.from(
    await workbook.xlsx.writeBuffer()
  );
}

export function buildTeamCsv(
  dataset: TeamExportDataset
): string {
  /*
   * CSV deliberately uses one clean consolidated member-level table.
   *
   * Detailed Excel sheets are retained in the XLSX export because CSV
   * cannot represent multiple worksheets, styling, filters or formatting.
   */

  const headers = [
    "Workspace",
    "Workspace Status",
    "Workspace Started",
    "Workspace Expires",
    "Member Name",
    "Member Email",
    "Member Added",
    "Options",
    "Confirmed Grants",
    "Exercise Cost",
    "Calculations",
    "Total Exit Value",
    "Highest Exit Value",
    "Average Return Multiple",
    "Average ROI %",
    "Activities",
    "Documents",
    "Expiring Grants Within 365 Days",
  ];

  const rows =
    dataset.members.map(
      (member) => [
        dataset.workspace.name,
        dataset.workspace.status,
        formatDateValue(
          dataset.workspace.startedAt
        ),
        formatDateValue(
          dataset.workspace.expiresAt
        ),
        member.name,
        member.email,
        formatDateValue(
          member.addedAt
        ),
        member.options,
        member.confirmedGrants,
        member.exerciseCost,
        member.calculations,
        member.totalExitValue,
        member.highestExitValue,
        member.averageReturnMultiple,
        member.averageRoiPercentage,
        member.activities,
        member.documents,
        member.expiringWithin365Days,
      ]
    );

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      row
        .map(escapeCsv)
        .join(",")
    ),
  ].join("\r\n");
}

/*
|--------------------------------------------------------------------------
| SUMMARY SHEET
|--------------------------------------------------------------------------
*/

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Team Summary",
      {
        views: [
          {
            showGridLines: false,
          },
        ],
      }
    );

  sheet.properties.defaultRowHeight = 20;

  sheet.mergeCells(
    "A1:F1"
  );

  const title =
    sheet.getCell("A1");

  title.value =
    "ESOP VALUE CLARITY — TEAM INTELLIGENCE";

  styleTitle(title);

  sheet.mergeCells(
    "A2:F2"
  );

  const subtitle =
    sheet.getCell("A2");

  subtitle.value =
    dataset.workspace.name;

  subtitle.font = {
    name: "Aptos",
    size: 15,
    bold: true,
    color: {
      argb: COLORS.navy,
    },
  };

  subtitle.alignment = {
    vertical: "middle",
  };

  sheet.mergeCells(
    "A3:F3"
  );

  const description =
    sheet.getCell("A3");

  description.value =
    "Professional Team Intelligence export generated from persisted EVC workspace data.";

  description.font = {
    name: "Aptos",
    size: 10,
    italic: true,
    color: {
      argb: COLORS.slateLight,
    },
  };

  sheet.mergeCells(
    "A5:B5"
  );

  sectionHeading(
    sheet.getCell("A5"),
    "WORKSPACE"
  );

  const workspaceRows: Array<
    [string, string | number]
  > = [
    [
      "Workspace ID",
      dataset.workspace.id,
    ],
    [
      "Workspace Status",
      dataset.workspace.status,
    ],
    [
      "Started",
      formatDateValue(
        dataset.workspace.startedAt
      ),
    ],
    [
      "Expires",
      formatDateValue(
        dataset.workspace.expiresAt
      ),
    ],
    [
      "Maximum Members",
      dataset.workspace.maxMembers,
    ],
    [
      "Active Members",
      dataset.workspace.activeMemberCount,
    ],
  ];

  let rowNumber = 6;

  for (const [
    label,
    value,
  ] of workspaceRows) {
    sheet.getCell(
      `A${rowNumber}`
    ).value = label;

    sheet.getCell(
      `B${rowNumber}`
    ).value = value;

    styleLabelCell(
      sheet.getCell(
        `A${rowNumber}`
      )
    );

    styleValueCell(
      sheet.getCell(
        `B${rowNumber}`
      )
    );

    rowNumber += 1;
  }

  sheet.mergeCells(
    "D5:F5"
  );

  sectionHeading(
    sheet.getCell("D5"),
    "TEAM SUMMARY"
  );

  const summaryRows: Array<
  [
    string,
    string | number,
    "number" |
      "currency" |
      "percentage" |
      "multiple"
  ]
> = [
    [
      "Total Options",
      dataset.summary
        .totalOptions,
      "number",
    ],
    [
      "Confirmed Grants",
      dataset.summary
        .totalConfirmedGrants,
      "number",
    ],
    [
      "Exercise Cost",
      dataset.summary
        .totalExerciseCost,
      "currency",
    ],
    [
      "Saved Calculations",
      dataset.summary
        .totalCalculations,
      "number",
    ],
    [
      "Saved Exit Value",
      dataset.summary
        .totalExitValue,
      "currency",
    ],
    [
      "Highest Exit Value",
      dataset.summary
        .highestExitValue,
      "currency",
    ],
    [
      "Average ROI",
      dataset.summary.averageRoi,
      "percentage",
    ],
    [
      "Average Return Multiple",
      dataset.summary
        .averageReturnMultiple,
      "multiple",
    ],
    [
      "Activity Events",
      dataset.summary
        .totalActivity,
      "number",
    ],
    [
      "Documents",
      dataset.summary
        .totalDocuments,
      "number",
    ],
  ];

  rowNumber = 6;

  for (const [
    label,
    value,
    type,
  ] of summaryRows) {
    sheet.mergeCells(
      `D${rowNumber}:E${rowNumber}`
    );

    sheet.getCell(
      `D${rowNumber}`
    ).value = label;

    sheet.getCell(
      `F${rowNumber}`
    ).value = value;

    styleLabelCell(
      sheet.getCell(
        `D${rowNumber}`
      )
    );

    styleValueCell(
      sheet.getCell(
        `F${rowNumber}`
      ),
      type
    );

    rowNumber += 1;
  }

  sheet.mergeCells(
    "A14:F14"
  );

  sectionHeading(
    sheet.getCell("A14"),
    "EXPORT INFORMATION"
  );

  const metadataRows = [
    [
      "Generated",
      formatDateTime(
        new Date()
      ),
    ],
    [
      "Source",
      "Persisted EVC Team data",
    ],
    [
      "Workspace Members",
      dataset.members.length,
    ],
    [
      "Companies",
      dataset.companies.length,
    ],
    [
      "Activity Types",
      dataset.activityByType.length,
    ],
    [
      "Expiry Records",
      dataset.expiryTimeline.length,
    ],
  ];

  rowNumber = 15;

  for (const [
    label,
    value,
  ] of metadataRows) {
    sheet.getCell(
      `A${rowNumber}`
    ).value = label;

    sheet.getCell(
      `B${rowNumber}`
    ).value = value;

    sheet.mergeCells(
      `B${rowNumber}:F${rowNumber}`
    );

    styleLabelCell(
      sheet.getCell(
        `A${rowNumber}`
      )
    );

    styleValueCell(
      sheet.getCell(
        `B${rowNumber}`
      )
    );

    rowNumber += 1;
  }

  sheet.getColumn("A").width =
    25;

  sheet.getColumn("B").width =
    28;

  sheet.getColumn("C").width =
    4;

  sheet.getColumn("D").width =
    28;

  sheet.getColumn("E").width =
    4;

  sheet.getColumn("F").width =
    22;

  addFooter(
    sheet,
    21,
    "Team Summary"
  );
}

/*
|--------------------------------------------------------------------------
| MEMBERS SHEET
|--------------------------------------------------------------------------
*/

function addMembersSheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Members",
      {
        views: [
          {
            state: "frozen",
            ySplit: 4,
            showGridLines: false,
          },
        ],
      }
    );

  sheet.mergeCells(
    "A1:S1"
  );

  const title =
    sheet.getCell("A1");

  title.value =
    "TEAM MEMBERS";

  styleTitle(title);

  sheet.mergeCells(
    "A2:S2"
  );

  sheet.getCell("A2").value =
    dataset.workspace.name;

  styleSubTitle(
    sheet.getCell("A2")
  );

  sheet.mergeCells(
    "A3:S3"
  );

  sheet.getCell("A3").value =
    "Member-level persisted EVC metrics.";

  styleDescription(
    sheet.getCell("A3")
  );

  const headers = [
    "Member Name",
    "Email",
    "Added",
    "Options",
    "Confirmed Grants",
    "Exercise Cost",
    "Calculations",
    "Total Exit Value",
    "Highest Exit Value",
    "Average Return Multiple",
    "Average ROI %",
    "Activities",
    "Documents",
    "Expiring Grants ≤ 365 Days",
    "Member ID",
  ];

  addTableHeader(
    sheet,
    5,
    headers
  );

  dataset.members.forEach(
    (member, index) => {
      const row =
        sheet.getRow(
          index + 6
        );

      row.values = [
        member.name,
        member.email,
        parseDate(
          member.addedAt
        ),
        member.options,
        member.confirmedGrants,
        member.exerciseCost,
        member.calculations,
        member.totalExitValue,
        member.highestExitValue,
        member.averageReturnMultiple,
        member.averageRoiPercentage,
        member.activities,
        member.documents,
        member.expiringWithin365Days,
        member.id,
      ];

      styleTableRow(
        row,
        index % 2 === 1
      );

      row.getCell(3).numFmt =
        DATETIME_FORMAT;

      row.getCell(4).numFmt =
        NUMBER_FORMAT;

      row.getCell(5).numFmt =
        NUMBER_FORMAT;

      row.getCell(6).numFmt =
        INR_FORMAT;

      row.getCell(7).numFmt =
        NUMBER_FORMAT;

      row.getCell(8).numFmt =
        INR_FORMAT;

      row.getCell(9).numFmt =
        INR_FORMAT;

      row.getCell(10).numFmt =
        MULTIPLE_FORMAT;

      row.getCell(11).numFmt =
        PERCENT_FORMAT;

      row.getCell(12).numFmt =
        NUMBER_FORMAT;

      row.getCell(13).numFmt =
        NUMBER_FORMAT;

      row.getCell(14).numFmt =
        NUMBER_FORMAT;

      row.getCell(15).font = {
        name: "Aptos",
        size: 9,
        color: {
          argb: COLORS.slateLight,
        },
      };
    }
  );

  setWidths(
    sheet,
    [
      24,
      30,
      18,
      14,
      18,
      18,
      15,
      19,
      19,
      20,
      15,
      13,
      13,
      24,
      38,
    ]
  );

  addAutoFilter(
    sheet,
    5,
    headers.length,
    Math.max(
      5,
      5 + dataset.members.length
    )
  );

  addFooter(
    sheet,
    6 +
      dataset.members.length,
    "Members"
  );
}

/*
|--------------------------------------------------------------------------
| COMPANIES SHEET
|--------------------------------------------------------------------------
*/

function addCompaniesSheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Companies",
      {
        views: [
          {
            state: "frozen",
            ySplit: 4,
            showGridLines: false,
          },
        ],
      }
    );

  sheet.mergeCells(
    "A1:D1"
  );

  styleTitle(
    sheet.getCell("A1")
  );

  sheet.getCell("A1").value =
    "COMPANY EQUITY FOOTPRINT";

  sheet.mergeCells(
    "A2:D2"
  );

  sheet.getCell("A2").value =
    "Confirmed option concentration across Team members.";

  styleDescription(
    sheet.getCell("A2")
  );

  const headers = [
    "Company",
    "Confirmed Grants",
    "Options",
    "Members",
  ];

  addTableHeader(
    sheet,
    4,
    headers
  );

  dataset.companies.forEach(
    (company, index) => {
      const row =
        sheet.getRow(
          index + 5
        );

      row.values = [
        company.company,
        company.grants,
        company.options,
        company.members,
      ];

      styleTableRow(
        row,
        index % 2 === 1
      );

      row.getCell(2).numFmt =
        NUMBER_FORMAT;

      row.getCell(3).numFmt =
        NUMBER_FORMAT;

      row.getCell(4).numFmt =
        NUMBER_FORMAT;
    }
  );

  setWidths(
    sheet,
    [38, 20, 18, 15]
  );

  addAutoFilter(
    sheet,
    4,
    headers.length,
    Math.max(
      4,
      4 + dataset.companies.length
    )
  );

  addFooter(
    sheet,
    5 +
      dataset.companies.length,
    "Companies"
  );
}

/*
|--------------------------------------------------------------------------
| ACTIVITY SHEET
|--------------------------------------------------------------------------
*/

function addActivitySheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Activity",
      {
        views: [
          {
            showGridLines: false,
          },
        ],
      }
    );

  sheet.mergeCells(
    "A1:H1"
  );

  sheet.getCell("A1").value =
    "TEAM ACTIVITY";

  styleTitle(
    sheet.getCell("A1")
  );

  sheet.mergeCells(
    "A2:H2"
  );

  sheet.getCell("A2").value =
    "Persisted activity summarized by type and date.";

  styleDescription(
    sheet.getCell("A2")
  );

  sheet.mergeCells(
    "A4:B4"
  );

  sectionHeading(
    sheet.getCell("A4"),
    "ACTIVITY BY TYPE"
  );

  const typeHeaders = [
    "Activity Type",
    "Count",
  ];

  addTableHeader(
    sheet,
    5,
    typeHeaders
  );

  dataset.activityByType.forEach(
    (item, index) => {
      const row =
        sheet.getRow(
          index + 6
        );

      row.values = [
        item.type,
        item.count,
      ];

      styleTableRow(
        row,
        index % 2 === 1
      );

      row.getCell(2).numFmt =
        NUMBER_FORMAT;
    }
  );

  const timelineStart =
    4;

  const timelineColumn =
    4;

  sheet.mergeCells(
    `D${timelineStart}:E${timelineStart}`
  );

  sectionHeading(
    sheet.getCell(
      `D${timelineStart}`
    ),
    "ACTIVITY TIMELINE"
  );

  sheet.getCell(
    `D${timelineStart + 1}`
  ).value = "Date";

  sheet.getCell(
    `E${timelineStart + 1}`
  ).value = "Count";

  styleHeaderRow(
    sheet,
    timelineStart + 1,
    4,
    5
  );

  dataset.activityTimeline.forEach(
    (item, index) => {
      const row =
        sheet.getRow(
          timelineStart +
            2 +
            index
        );

      row.getCell(4).value =
        parseDate(item.date);

      row.getCell(5).value =
        item.count;

      styleTableRow(
        row,
        index % 2 === 1,
        4,
        5
      );

      row.getCell(4).numFmt =
        DATE_FORMAT;

      row.getCell(5).numFmt =
        NUMBER_FORMAT;
    }
  );

  setColumnWidth(
    sheet,
    1,
    30
  );

  setColumnWidth(
    sheet,
    2,
    14
  );

  setColumnWidth(
    sheet,
    3,
    5
  );

  setColumnWidth(
    sheet,
    4,
    18
  );

  setColumnWidth(
    sheet,
    5,
    14
  );

  addFooter(
    sheet,
    Math.max(
      7,
      6 +
        dataset.activityByType
          .length,
      timelineStart +
        2 +
        dataset.activityTimeline
          .length
    ),
    "Activity"
  );
}

/*
|--------------------------------------------------------------------------
| CALCULATIONS SHEET
|--------------------------------------------------------------------------
*/

function addCalculationsSheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Calculations",
      {
        views: [
          {
            state: "frozen",
            ySplit: 4,
            showGridLines: false,
          },
        ],
      }
    );

  sheet.mergeCells(
    "A1:H1"
  );

  sheet.getCell("A1").value =
    "SAVED CALCULATIONS";

  styleTitle(
    sheet.getCell("A1")
  );

  sheet.mergeCells(
    "A2:H2"
  );

  sheet.getCell("A2").value =
    "Persisted calculation results available across Team members.";

  styleDescription(
    sheet.getCell("A2")
  );

  const headers = [
    "Member",
    "Calculation",
    "Exit Value",
    "Return Multiple",
    "ROI %",
    "Created",
    "Member ID",
    "Calculation ID",
  ];

  addTableHeader(
    sheet,
    4,
    headers
  );

  dataset.calculations.forEach(
    (calculation, index) => {
      const row =
        sheet.getRow(
          index + 5
        );

      row.values = [
        calculation.memberName,
        calculation.name,
        calculation.exitValue,
        calculation.returnMultiple,
        calculation.roiPercentage,
        parseDate(
          calculation.createdAt
        ),
        calculation.memberId,
        calculation.id,
      ];

      styleTableRow(
        row,
        index % 2 === 1
      );

      row.getCell(3).numFmt =
        INR_FORMAT;

      row.getCell(4).numFmt =
        MULTIPLE_FORMAT;

      row.getCell(5).numFmt =
        PERCENT_FORMAT;

      row.getCell(6).numFmt =
        DATETIME_FORMAT;

      row.getCell(7).font = {
        name: "Aptos",
        size: 9,
        color: {
          argb: COLORS.slateLight,
        },
      };

      row.getCell(8).font = {
        name: "Aptos",
        size: 9,
        color: {
          argb: COLORS.slateLight,
        },
      };
    }
  );

  setWidths(
    sheet,
    [
      25,
      34,
      20,
      18,
      14,
      20,
      38,
      38,
    ]
  );

  addAutoFilter(
    sheet,
    4,
    headers.length,
    Math.max(
      4,
      4 +
        dataset.calculations
          .length
    )
  );

  addFooter(
    sheet,
    5 +
      dataset.calculations.length,
    "Calculations"
  );
}

/*
|--------------------------------------------------------------------------
| EXPIRY SHEET
|--------------------------------------------------------------------------
*/

function addExpirySheet(
  workbook: ExcelJS.Workbook,
  dataset: TeamExportDataset
) {
  const sheet =
    workbook.addWorksheet(
      "Expiry",
      {
        views: [
          {
            state: "frozen",
            ySplit: 4,
            showGridLines: false,
          },
        ],
      }
    );

  sheet.mergeCells(
    "A1:H1"
  );

  sheet.getCell("A1").value =
    "GRANT EXPIRY INTELLIGENCE";

  styleTitle(
    sheet.getCell("A1")
  );

  sheet.mergeCells(
    "A2:H2"
  );

  sheet.getCell("A2").value =
    "Persisted confirmed grants with recorded expiry dates.";

  styleDescription(
    sheet.getCell("A2")
  );

  const headers = [
    "Member",
    "Grant",
    "Company",
    "Expiry Date",
    "Days Remaining",
    "Options",
    "Member ID",
    "Grant ID",
  ];

  addTableHeader(
    sheet,
    4,
    headers
  );

  dataset.expiryTimeline.forEach(
    (expiry, index) => {
      const row =
        sheet.getRow(
          index + 5
        );

      row.values = [
        expiry.memberName,
        expiry.grantName,
        expiry.companyName,
        parseDate(
          expiry.expiryDate
        ),
        expiry.daysRemaining,
        expiry.optionCount,
        expiry.memberId,
        expiry.grantId,
      ];

      styleTableRow(
        row,
        index % 2 === 1
      );

      row.getCell(4).numFmt =
        DATE_FORMAT;

      row.getCell(5).numFmt =
        NUMBER_FORMAT;

      row.getCell(6).numFmt =
        NUMBER_FORMAT;

      styleExpiryDaysCell(
        row.getCell(5),
        expiry.daysRemaining
      );

      row.getCell(7).font = {
        name: "Aptos",
        size: 9,
        color: {
          argb: COLORS.slateLight,
        },
      };

      row.getCell(8).font = {
        name: "Aptos",
        size: 9,
        color: {
          argb: COLORS.slateLight,
        },
      };
    }
  );

  setWidths(
    sheet,
    [
      24,
      34,
      32,
      18,
      18,
      16,
      38,
      38,
    ]
  );

  addAutoFilter(
    sheet,
    4,
    headers.length,
    Math.max(
      4,
      4 +
        dataset.expiryTimeline
          .length
    )
  );

  addFooter(
    sheet,
    5 +
      dataset.expiryTimeline.length,
    "Expiry"
  );
}

/*
|--------------------------------------------------------------------------
| COMMON EXCEL STYLING
|--------------------------------------------------------------------------
*/

function styleTitle(
  cell: ExcelJS.Cell
) {
  cell.font = {
    name: "Aptos Display",
    size: 18,
    bold: true,
    color: {
      argb: COLORS.white,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.navy,
    },
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  cell.border = {
    bottom: {
      style: "thin",
      color: {
        argb: COLORS.blue,
      },
    },
  };

  cell.protection = {
    locked: true,
  };
}

function styleSubTitle(
  cell: ExcelJS.Cell
) {
  cell.font = {
    name: "Aptos",
    size: 14,
    bold: true,
    color: {
      argb: COLORS.navy,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "EEF4FF",
    },
  };

  cell.alignment = {
    vertical: "middle",
  };
}

function styleDescription(
  cell: ExcelJS.Cell
) {
  cell.font = {
    name: "Aptos",
    size: 10,
    italic: true,
    color: {
      argb: COLORS.slateLight,
    },
  };

  cell.alignment = {
    vertical: "middle",
  };
}

function sectionHeading(
  cell: ExcelJS.Cell,
  text: string
) {
  cell.value = text;

  cell.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: {
      argb: COLORS.blue,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "EEF4FF",
    },
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  cell.border = {
    bottom: {
      style: "thin",
      color: {
        argb: "BFDBFE",
      },
    },
  };
}

function styleLabelCell(
  cell: ExcelJS.Cell
) {
  cell.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: {
      argb: COLORS.slate,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.slateBackground,
    },
  };

  cell.border = thinBorder();

  cell.alignment = {
    vertical: "middle",
  };
}

function styleValueCell(
  cell: ExcelJS.Cell,
  type?:
    | "number"
    | "currency"
    | "percentage"
    | "multiple"
) {
  cell.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: {
      argb: COLORS.navy,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.white,
    },
  };

  cell.border = thinBorder();

  cell.alignment = {
    vertical: "middle",
  };

  if (type === "number") {
    cell.numFmt =
      NUMBER_FORMAT;
  }

  if (type === "currency") {
    cell.numFmt =
      INR_FORMAT;
  }

  if (type === "percentage") {
    cell.numFmt =
      PERCENT_FORMAT;
  }

  if (type === "multiple") {
    cell.numFmt =
      MULTIPLE_FORMAT;
  }
}

function addTableHeader(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  headers: string[]
) {
  headers.forEach(
    (header, index) => {
      const cell =
        sheet.getCell(
          rowNumber,
          index + 1
        );

      cell.value = header;

      cell.font = {
        name: "Aptos",
        size: 9,
        bold: true,
        color: {
          argb: COLORS.white,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: COLORS.navySoft,
        },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal:
          index >= 2
            ? "right"
            : "left",
        wrapText: true,
      };

      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: COLORS.navySoft,
          },
        },
        bottom: {
          style: "thin",
          color: {
            argb: COLORS.navySoft,
          },
        },
      };
    }
  );

  const row =
    sheet.getRow(
      rowNumber
    );

  row.height = 28;
}

function styleHeaderRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  startColumn: number,
  endColumn: number
) {
  for (
    let column = startColumn;
    column <= endColumn;
    column += 1
  ) {
    const cell =
      sheet.getCell(
        rowNumber,
        column
      );

    cell.font = {
      name: "Aptos",
      size: 9,
      bold: true,
      color: {
        argb: COLORS.white,
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: COLORS.navySoft,
      },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal:
        column === startColumn
          ? "left"
          : "right",
    };

    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: COLORS.navySoft,
        },
      },
    };
  }

  sheet.getRow(
    rowNumber
  ).height = 26;
}

function styleTableRow(
  row: ExcelJS.Row,
  alternate: boolean,
  startColumn = 1,
  endColumn?: number
) {
  const finalColumn =
    endColumn ??
    row.cellCount;

  for (
    let column = startColumn;
    column <= finalColumn;
    column += 1
  ) {
    const cell =
      row.getCell(
        column
      );

    cell.font = {
      name: "Aptos",
      size: 10,
      color: {
        argb: COLORS.navy,
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: alternate
          ? "F8FAFC"
          : COLORS.white,
      },
    };

    cell.border = thinBorder();

    cell.alignment = {
      vertical: "middle",
      horizontal:
        column >= 3
          ? "right"
          : "left",
      wrapText:
        column <= 3,
    };
  }

  row.height = 24;
}

function styleExpiryDaysCell(
  cell: ExcelJS.Cell,
  daysRemaining: number
) {
  if (
    daysRemaining <= 90
  ) {
    cell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: {
        argb: COLORS.red,
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: COLORS.redSoft,
      },
    };

    return;
  }

  if (
    daysRemaining <= 180
  ) {
    cell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: {
        argb: COLORS.amber,
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: COLORS.amberSoft,
      },
    };

    return;
  }

  cell.font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: {
      argb: COLORS.green,
    },
  };
}

function addFooter(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  sectionName: string
) {
  const row =
    sheet.getRow(
      rowNumber + 1
    );

  row.getCell(1).value =
    `ESOP Value Clarity · Team Intelligence · ${sectionName}`;

  row.getCell(1).font = {
    name: "Aptos",
    size: 9,
    italic: true,
    color: {
      argb: COLORS.slateLight,
    },
  };

  row.getCell(1).alignment = {
    vertical: "middle",
  };
}

function addAutoFilter(
  sheet: ExcelJS.Worksheet,
  headerRow: number,
  endColumn: number,
  endRow: number
) {
  sheet.autoFilter = {
    from: {
      row: headerRow,
      column: 1,
    },
    to: {
      row: Math.max(
        headerRow,
        endRow
      ),
      column: endColumn,
    },
  };
}

function setWidths(
  sheet: ExcelJS.Worksheet,
  widths: number[]
) {
  widths.forEach(
    (width, index) => {
      sheet.getColumn(
        index + 1
      ).width = width;
    }
  );
}

function setColumnWidth(
  sheet: ExcelJS.Worksheet,
  column: number,
  width: number
) {
  sheet.getColumn(
    column
  ).width = width;
}

function thinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: {
      style: "thin",
      color: {
        argb: COLORS.slateBorder,
      },
    },
    bottom: {
      style: "thin",
      color: {
        argb: COLORS.slateBorder,
      },
    },
    left: {
      style: "thin",
      color: {
        argb: COLORS.slateBorder,
      },
    },
    right: {
      style: "thin",
      color: {
        argb: COLORS.slateBorder,
      },
    },
  };
}

/*
|--------------------------------------------------------------------------
| CSV HELPERS
|--------------------------------------------------------------------------
*/

function escapeCsv(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    value instanceof Date
      ? formatDateTime(value)
      : String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll(
      '"',
      '""'
    )}"`;
  }

  return text;
}

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

function parseDate(
  value: string
): Date {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return new Date(0);
  }

  return date;
}

function formatDateValue(
  value: string | Date
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value: Date
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(value);
}