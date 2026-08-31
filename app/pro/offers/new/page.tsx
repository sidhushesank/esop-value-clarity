"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileCheck2,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

import type {
  OfferScannerField,
  OfferScannerReviewStatus,
  ScannedOfferLetter,
} from "@/lib/esop/offers/scanner-types";

/* ============================================================
   API TYPES
============================================================ */

type ScannerDiagnostics = {
  documentType: string;

  currency: string;

  companyDetected: boolean;

  roleDetected: boolean;

  headlineCTCDetected: boolean;

  fixedSalaryDetected: boolean;

  equityType: string | null;

  equityQuantityDetected: boolean;

  exercisePriceDetected: boolean;

  fmvDetected: boolean;

  vestingDetected: boolean;

  cliffDetected: boolean;

  readiness: string;

  blockingIssues: number;

  warnings: number;
};

type ScannerReviewQueueItem = {
  path: string;

  reason:
    | "UNREVIEWED"
    | "LOW_CONFIDENCE"
    | "MISSING"
    | "BLOCKING_ISSUE"
    | "WARNING";

  message: string;
};

type ScannerSuccessResponse = {
  success: true;

  scan: ScannedOfferLetter;

  diagnostics: ScannerDiagnostics;

  reviewQueue: ScannerReviewQueueItem[];

  validation: {
    criticalFieldsReviewed: boolean;

    equityCriticalFieldsReviewed: boolean;

    blockingIssueCount: number;

    warningCount: number;

    informationCount: number;
  };

  extraction: {
    mode: "TEXT" | "PDF";

    fileName: string | null;

    mimeType: string | null;

    fileSizeBytes: number | null;

    extractedCharacterCount: number;

    pageCount: number | null;

    localProcessing: true;

    externalAIUsed: false;
  };
};

type ScannerErrorResponse = {
  success: false;

  message: string;

  code?: string;

  details?: Record<string, unknown>;
};

type ScannerApiResponse =
  | ScannerSuccessResponse
  | ScannerErrorResponse;

type ConfirmOfferSuccessResponse = {
  success: true;
  message: string;
  offerId: string;
  side: "A" | "B";
  offer: {
    id: string;
    status: string;
    companyName: string | null;
    roleTitle: string | null;
    currency: string;
    headlineCTC: number | null;
    fixedSalary: number | null;
    targetVariablePay: number | null;
    joiningBonus: number | null;
    equityType: string | null;
    totalOptionsOrShares: number | null;
    exercisePrice: number | null;
    currentFMV: number | null;
  };
};

type ConfirmOfferErrorResponse = {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

type ConfirmOfferApiResponse =
  | ConfirmOfferSuccessResponse
  | ConfirmOfferErrorResponse;

/* ============================================================
   UI TYPES
============================================================ */

type ReviewValue =
  | string
  | number
  | boolean
  | string[]
  | null;

type ReviewField = {
  path: string;

  label: string;

  field: OfferScannerField<unknown>;

  kind:
    | "TEXT"
    | "MONEY"
    | "NUMBER"
    | "BOOLEAN"
    | "ENUM";

  critical?: boolean;
};

type ReviewSection = {
  id:
    | "EMPLOYER"
    | "CASH"
    | "EQUITY";

  title: string;

  subtitle: string;

  fields: ReviewField[];
};

/* ============================================================
   FORMATTERS
============================================================ */

function money(
  value: unknown
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not found";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",

      currency: "INR",

      maximumFractionDigits: 0,
    }
  ).format(value);
}

function number(
  value: unknown
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not found";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function displayValue(
  field: ReviewField
): string {
  const value =
    field.field.value;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not found";
  }

  if (
    field.kind === "MONEY"
  ) {
    return money(value);
  }

  if (
    field.kind === "NUMBER"
  ) {
    return number(value);
  }

  if (
    field.kind === "BOOLEAN"
  ) {
    return value === true
      ? "Yes"
      : "No";
  }

  if (
    Array.isArray(value)
  ) {
    return value.join(", ");
  }

  return String(value)
    .replaceAll("_", " ");
}

function fileSize(
  bytes: number
): string {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

/* ============================================================
   CONFIDENCE UI
============================================================ */

function confidenceClasses(
  confidence: string
): string {
  if (
    confidence === "HIGH"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    confidence === "MEDIUM"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    confidence === "LOW"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function statusClasses(
  status:
    OfferScannerReviewStatus
): string {
  if (
    status === "CONFIRMED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status === "EDITED"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    status === "REJECTED"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status === "MISSING"
  ) {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  return "border-violet-200 bg-violet-50 text-violet-700";
}

/* ============================================================
   IMMUTABLE FIELD UPDATE

   Scanner objects are nested.

   This helper updates paths such as:

   cash.fixedSalary
   employer.companyName
   equity.exercisePrice
============================================================ */

function updateFieldAtPath(
  scan: ScannedOfferLetter,
  path: string,
  updater: (
    field: OfferScannerField<unknown>
  ) => OfferScannerField<unknown>
): ScannedOfferLetter {
  const [
    section,
    fieldName,
  ] =
    path.split(".");

  if (
    !section ||
    !fieldName
  ) {
    return scan;
  }

  const sectionValue =
    (
      scan as unknown as
        Record<
          string,
          unknown
        >
    )[section];

  if (
    !sectionValue ||
    typeof sectionValue !==
      "object"
  ) {
    return scan;
  }

  const sectionRecord =
    sectionValue as Record<
      string,
      unknown
    >;

  const currentField =
    sectionRecord[
      fieldName
    ];

  if (
    !currentField ||
    typeof currentField !==
      "object"
  ) {
    return scan;
  }

  return {
    ...scan,

    [section]: {
      ...sectionRecord,

      [fieldName]:
        updater(
          currentField as
            OfferScannerField<unknown>
        ),
    },
  } as ScannedOfferLetter;
}

/* ============================================================
   REVIEW FIELD BUILDERS
============================================================ */

function buildReviewSections(
  scan: ScannedOfferLetter
): ReviewSection[] {
  return [
    {
      id:
        "EMPLOYER",

      title:
        "Role & employment",

      subtitle:
        "Confirm who made the offer and the employment terms.",

      fields: [
        {
          path:
            "employer.companyName",

          label:
            "Company",

          field:
            scan.employer
              .companyName,

          kind:
            "TEXT",

          critical:
            true,
        },

        {
          path:
            "employer.roleTitle",

          label:
            "Role / designation",

          field:
            scan.employer
              .roleTitle,

          kind:
            "TEXT",

          critical:
            true,
        },

        {
          path:
            "employer.location",

          label:
            "Location",

          field:
            scan.employer
              .location,

          kind:
            "TEXT",
        },

        {
          path:
            "employer.employmentType",

          label:
            "Employment type",

          field:
            scan.employer
              .employmentType,

          kind:
            "ENUM",
        },

        {
          path:
            "employer.workMode",

          label:
            "Work mode",

          field:
            scan.employer
              .workMode,

          kind:
            "ENUM",
        },

        {
          path:
            "employer.joiningDate",

          label:
            "Joining date",

          field:
            scan.employer
              .joiningDate,

          kind:
            "TEXT",
        },
      ],
    },

    {
      id:
        "CASH",

      title:
        "Compensation",

      subtitle:
        "Keep guaranteed, variable and one-time compensation separate.",

      fields: [
        {
          path:
            "cash.headlineCTC",

          label:
            "Headline CTC",

          field:
            scan.cash
              .headlineCTC,

          kind:
            "MONEY",
        },

        {
          path:
            "cash.fixedSalary",

          label:
            "Annual fixed compensation",

          field:
            scan.cash
              .fixedSalary,

          kind:
            "MONEY",

          critical:
            true,
        },

        {
          path:
            "cash.basicSalary",

          label:
            "Basic salary",

          field:
            scan.cash
              .basicSalary,

          kind:
            "MONEY",
        },

        {
          path:
            "cash.hra",

          label:
            "HRA",

          field:
            scan.cash.hra,

          kind:
            "MONEY",
        },

        {
          path:
            "cash.specialAllowance",

          label:
            "Special allowance",

          field:
            scan.cash
              .specialAllowance,

          kind:
            "MONEY",
        },

        {
          path:
            "cash.targetVariablePay",

          label:
            "Target variable pay",

          field:
            scan.cash
              .targetVariablePay,

          kind:
            "MONEY",

          critical:
            true,
        },

        {
          path:
            "cash.joiningBonus",

          label:
            "Joining bonus",

          field:
            scan.cash
              .joiningBonus,

          kind:
            "MONEY",

          critical:
            true,
        },

        {
          path:
            "cash.employerPF",

          label:
            "Employer PF",

          field:
            scan.cash
              .employerPF,

          kind:
            "MONEY",
        },

        {
          path:
            "cash.gratuity",

          label:
            "Gratuity",

          field:
            scan.cash
              .gratuity,

          kind:
            "MONEY",
        },
      ],
    },

    {
      id:
        "EQUITY",

      title:
        "Equity",

      subtitle:
        "Equity is modeled separately from cash. Missing valuation inputs are never invented.",

      fields: [
        {
          path:
            "equity.type",

          label:
            "Equity type",

          field:
            scan.equity.type,

          kind:
            "ENUM",

          critical:
            true,
        },

        {
          path:
            "equity.companyStatus",

          label:
            "Company equity status",

          field:
            scan.equity
              .companyStatus,

          kind:
            "ENUM",
        },

        {
          path:
            "equity.employerHeadlineEquityValue",

          label:
            "Employer-stated equity value",

          field:
            scan.equity
              .employerHeadlineEquityValue,

          kind:
            "MONEY",
        },

        {
          path:
            "equity.totalOptionsOrShares",

          label:
            "Options / shares granted",

          field:
            scan.equity
              .totalOptionsOrShares,

          kind:
            "NUMBER",
        },

        {
          path:
            "equity.exercisePrice",

          label:
            "Exercise / strike price",

          field:
            scan.equity
              .exercisePrice,

          kind:
            "MONEY",
        },

        {
          path:
            "equity.currentFMV",

          label:
            "Current FMV",

          field:
            scan.equity
              .currentFMV,

          kind:
            "MONEY",
        },

        {
          path:
            "equity.listedSharePrice",

          label:
            "Listed share price",

          field:
            scan.equity
              .listedSharePrice,

          kind:
            "MONEY",
        },

        {
          path:
            "equity.vestingDurationMonths",

          label:
            "Vesting duration",

          field:
            scan.equity
              .vestingDurationMonths,

          kind:
            "NUMBER",
        },

        {
          path:
            "equity.cliffMonths",

          label:
            "Cliff",

          field:
            scan.equity
              .cliffMonths,

          kind:
            "NUMBER",
        },

        {
          path:
            "equity.vestingFrequency",

          label:
            "Vesting frequency",

          field:
            scan.equity
              .vestingFrequency,

          kind:
            "ENUM",
        },

        {
          path:
            "equity.postTerminationExerciseDays",

          label:
            "Post-termination exercise window",

          field:
            scan.equity
              .postTerminationExerciseDays,

          kind:
            "NUMBER",
        },

        {
          path:
            "equity.expectedDilutionPercentage",

          label:
            "Expected dilution",

          field:
            scan.equity
              .expectedDilutionPercentage,

          kind:
            "NUMBER",
        },
      ],
    },
  ];
}

/* ============================================================
   REVIEW FIELD CARD
============================================================ */

function ReviewFieldCard({
  item,
  onConfirm,
  onReject,
  onEdit,
}: {
  item: ReviewField;

  onConfirm: (
    path: string
  ) => void;

  onReject: (
    path: string
  ) => void;

  onEdit: (
    item: ReviewField
  ) => void;
}) {
  const evidence =
    item.field
      .evidence?.[0]
      ?.excerpt;

  const missing =
    item.field.value ===
      null ||
    item.field.value ===
      undefined;

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition",
        item.field
          .reviewStatus ===
          "CONFIRMED"
          ? "border-emerald-200 bg-emerald-50/40"
          : item.field
              .reviewStatus ===
              "EDITED"
          ? "border-blue-200 bg-blue-50/30"
          : item.field
              .reviewStatus ===
              "REJECTED"
          ? "border-red-200 bg-red-50/30"
          : missing
          ? "border-slate-200 bg-slate-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-slate-950">
              {item.label}
            </p>

            {item.critical ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-700">
                Important
              </span>
            ) : null}

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                confidenceClasses(
                  item.field
                    .confidence
                ),
              ].join(" ")}
            >
              {
                item.field
                  .confidence
              }{" "}
              confidence
            </span>

            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                statusClasses(
                  item.field
                    .reviewStatus
                ),
              ].join(" ")}
            >
              {item.field
                .reviewStatus
                .replaceAll(
                  "_",
                  " "
                )}
            </span>
          </div>

          <p
            className={[
              "mt-2 text-xl font-black",
              missing
                ? "text-slate-400"
                : "text-slate-950",
            ].join(" ")}
          >
            {displayValue(
              item
            )}
          </p>

          {evidence ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Source from document
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                “{evidence}”
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              No direct source
              evidence was captured
              for this field.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!missing &&
          item.field
            .reviewStatus !==
            "CONFIRMED" ? (
            <button
              type="button"
              onClick={() =>
                onConfirm(
                  item.path
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              <Check
                size={14}
              />

              Confirm
            </button>
          ) : null}

          <button
            type="button"
            onClick={() =>
              onEdit(item)
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil
              size={14}
            />

            {missing
              ? "Enter"
              : "Edit"}
          </button>

          {!missing &&
          item.field
            .reviewStatus !==
            "REJECTED" ? (
            <button
              type="button"
              onClick={() =>
                onReject(
                  item.path
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50"
            >
              <X
                size={14}
              />

              Reject
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EDIT MODAL
============================================================ */

function EditFieldModal({
  item,
  onClose,
  onSave,
}: {
  item: ReviewField;

  onClose: () => void;

  onSave: (
    path: string,
    value: ReviewValue
  ) => void;
}) {
  const initial =
    item.field.value ===
      null ||
    item.field.value ===
      undefined
      ? ""
      : String(
          item.field.value
        );

  const [
    value,
    setValue,
  ] =
    useState(
      initial
    );

  function save() {
    if (
      item.kind ===
        "MONEY" ||
      item.kind ===
        "NUMBER"
    ) {
      const cleaned =
        value
          .replaceAll(
            ",",
            ""
          )
          .replace(
            /[^0-9.\-]/g,
            ""
          );

      const parsed =
        Number(cleaned);

      if (
        !Number.isFinite(
          parsed
        )
      ) {
        return;
      }

      onSave(
        item.path,
        parsed
      );

      return;
    }

    if (
      item.kind ===
      "BOOLEAN"
    ) {
      onSave(
        item.path,
        value === "true"
      );

      return;
    }

    onSave(
      item.path,
      value.trim()
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
              Review field
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {item.label}
            </h3>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X
              size={18}
            />
          </button>
        </div>

        {item.field
          .evidence?.[0]
          ?.excerpt ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Extracted source
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              “
              {
                item.field
                  .evidence[0]
                  .excerpt
              }
              ”
            </p>
          </div>
        ) : null}

        <label className="mt-5 block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Correct value
          </span>

          {item.kind ===
          "BOOLEAN" ? (
            <select
              value={
                value
              }
              onChange={(
                event
              ) =>
                setValue(
                  event
                    .target
                    .value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-violet-400"
            >
              <option value="true">
                Yes
              </option>

              <option value="false">
                No
              </option>
            </select>
          ) : (
            <input
              autoFocus
              value={value}
              onChange={(
                event
              ) =>
                setValue(
                  event
                    .target
                    .value
                )
              }
              placeholder={
                item.kind ===
                  "MONEY" ||
                item.kind ===
                  "NUMBER"
                  ? "Enter numeric value"
                  : "Enter value"
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-violet-400"
            />
          )}
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              save
            }
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
          >
            Save correction
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function NewOfferPage() {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const searchParams =
    useSearchParams();

  const requestedSide =
    searchParams.get(
      "side"
    );

  const requestedCompareWith =
    searchParams
      .get(
        "compareWith"
      )
      ?.trim() ||
    null;

  const offerSide:
    "A" | "B" =
    requestedSide ===
      "B" &&
    requestedCompareWith
      ? "B"
      : "A";

  const compareWithOfferId =
    offerSide === "B"
      ? requestedCompareWith
      : null;

  const modeResolved =
    true;

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    dragging,
    setDragging,
  ] =
    useState(false);

  const [
    scanning,
    setScanning,
  ] =
    useState(false);

  const [
    response,
    setResponse,
  ] =
    useState<ScannerSuccessResponse | null>(
      null
    );

  const [
    scan,
    setScan,
  ] =
    useState<ScannedOfferLetter | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    editingField,
    setEditingField,
  ] =
    useState<ReviewField | null>(
      null
    );

  const [
    expandedIssues,
    setExpandedIssues,
  ] =
    useState(true);

  const [
    creatingOffer,
    setCreatingOffer,
  ] =
    useState(false);

  const [
    createError,
    setCreateError,
  ] =
    useState<string | null>(
      null
    );

  const [
    createdOffer,
    setCreatedOffer,
  ] =
    useState<ConfirmOfferSuccessResponse | null>(
      null
    );

  /* ==========================================================
     ROUTE / OFFER-SIDE RESET

     Next.js can reuse this client component when navigating from
     /pro/offers/new to /pro/offers/new?side=B&compareWith=...
     so explicitly clear all Offer A scanner/result state whenever
     the URL comparison context changes.
  ========================================================== */

  useEffect(() => {
    setSelectedFile(
      null
    );

    setDragging(
      false
    );

    setScanning(
      false
    );

    setResponse(
      null
    );

    setScan(
      null
    );

    setError(
      null
    );

    setEditingField(
      null
    );

    setExpandedIssues(
      true
    );

    setCreatingOffer(
      false
    );

    setCreateError(
      null
    );

    setCreatedOffer(
      null
    );

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }, [
    offerSide,
    compareWithOfferId,
  ]);

  /* ==========================================================
     REVIEW SECTIONS
  ========================================================== */

  const sections =
    useMemo(
      () =>
        scan
          ? buildReviewSections(
              scan
            )
          : [],
      [scan]
    );

  const reviewStats =
    useMemo(() => {
      const fields =
        sections.flatMap(
          (section) =>
            section.fields
        );

      const populated =
        fields.filter(
          (item) =>
            item.field
              .value !==
              null &&
            item.field
              .value !==
              undefined
        );

      const reviewed =
        populated.filter(
          (item) =>
            item.field
              .reviewStatus ===
              "CONFIRMED" ||
            item.field
              .reviewStatus ===
              "EDITED" ||
            item.field
              .reviewStatus ===
              "REJECTED"
        );

      const accepted =
        populated.filter(
          (item) =>
            item.field
              .reviewStatus ===
              "CONFIRMED" ||
            item.field
              .reviewStatus ===
              "EDITED"
        );

      return {
        total:
          populated.length,

        reviewed:
          reviewed.length,

        accepted:
          accepted.length,

        remaining:
          Math.max(
            populated.length -
              reviewed.length,
            0
          ),

        percentage:
          populated.length
            ? Math.round(
                (
                  reviewed.length /
                  populated.length
                ) *
                  100
              )
            : 0,
      };
    }, [sections]);

  /* ==========================================================
     FILE SELECTION
  ========================================================== */

  function chooseFile(
    file: File | null
  ) {
    setError(null);
    setResponse(null);
    setScan(null);

    if (!file) {
      setSelectedFile(
        null
      );

      return;
    }

    const isPdf =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(
          ".pdf"
        );

    if (!isPdf) {
      setSelectedFile(
        null
      );

      setError(
        "Please select a PDF offer letter."
      );

      return;
    }

    if (
      file.size >
      10 *
        1024 *
        1024
    ) {
      setSelectedFile(
        null
      );

      setError(
        "The PDF must be 10 MB or smaller."
      );

      return;
    }

    setSelectedFile(
      file
    );
  }

  function onFileInput(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    chooseFile(
      event.target
        .files?.[0] ??
        null
    );
  }

  function onDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragging(false);

    chooseFile(
      event
        .dataTransfer
        .files?.[0] ??
        null
    );
  }

  /* ==========================================================
     SCAN
  ========================================================== */

  async function scanOffer() {
    if (
      !selectedFile
    ) {
      setError(
        "Choose an offer-letter PDF first."
      );

      return;
    }

    setScanning(true);
    setError(null);
    setResponse(null);
    setScan(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "documentTypeHint",
        "OFFER_LETTER"
      );

      formData.append(
        "currencyHint",
        "INR"
      );

      const request =
        await fetch(
          "/api/pro/offers/scan",
          {
            method:
              "POST",

            body:
              formData,

            cache:
              "no-store",
          }
        );

      const result =
        (await request.json()) as
          ScannerApiResponse;

      if (
        !request.ok ||
        !result.success
      ) {
        const message =
          result.success
            ? "The offer letter could not be scanned."
            : result.message;

        setError(
          message
        );

        return;
      }

      setResponse(
        result
      );

      setScan(
        result.scan
      );
    } catch (
      caught
    ) {
      console.error(
        "[OFFER_UPLOAD_UI]",
        caught
      );

      setError(
        "Something went wrong while scanning the PDF."
      );
    } finally {
      setScanning(
        false
      );
    }
  }

  /* ==========================================================
     REVIEW ACTIONS
  ========================================================== */

  function confirmField(
    path: string
  ) {
    setScan(
      (current) => {
        if (!current) {
          return current;
        }

        return updateFieldAtPath(
          current,
          path,
          (field) => ({
            ...field,

            reviewStatus:
              "CONFIRMED",
          })
        );
      }
    );
  }

  function rejectField(
    path: string
  ) {
    setScan(
      (current) => {
        if (!current) {
          return current;
        }

        return updateFieldAtPath(
          current,
          path,
          (field) => ({
            ...field,

            reviewStatus:
              "REJECTED",
          })
        );
      }
    );
  }

  function saveEditedField(
    path: string,
    value: ReviewValue
  ) {
    setScan(
      (current) => {
        if (!current) {
          return current;
        }

        return updateFieldAtPath(
          current,
          path,
          (field) => ({
            ...field,

            value,

            reviewStatus:
              "EDITED",

            notes: [
              ...(field.notes ??
                []),

              "Value edited by the user during Review & Confirm.",
            ],
          })
        );
      }
    );

    setEditingField(
      null
    );
  }

  function confirmAllExtracted() {
    setScan(
      (current) => {
        if (!current) {
          return current;
        }

        let next =
          current;

        for (
          const section of
          buildReviewSections(
            current
          )
        ) {
          for (
            const item of
            section.fields
          ) {
            if (
              item.field
                .value ===
                null ||
              item.field
                .value ===
                undefined ||
              item.field
                .reviewStatus ===
                "REJECTED"
            ) {
              continue;
            }

            next =
              updateFieldAtPath(
                next,
                item.path,
                (field) => ({
                  ...field,

                  reviewStatus:
                    field
                      .reviewStatus ===
                    "EDITED"
                      ? "EDITED"
                      : "CONFIRMED",
                })
              );
          }
        }

        return next;
      }
    );
  }

  async function createOffer() {
    if (
      !scan ||
      !response ||
      reviewStats.total === 0 ||
      reviewStats.remaining > 0 ||
      creatingOffer
    ) {
      return;
    }

    setCreatingOffer(true);
    setCreateError(null);

    try {
      const request =
        await fetch(
          "/api/pro/offers/confirm",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              scan,
              side: offerSide,
              compareWithOfferId:
                offerSide === "B"
                  ? compareWithOfferId
                  : null,
              rawScanSnapshot:
                response.scan,
              source:
                "PDF_UPLOAD",
              fileMetadata: {
                originalFileName:
                  response.extraction.fileName ??
                  selectedFile?.name ??
                  null,
                mimeType:
                  response.extraction.mimeType ??
                  selectedFile?.type ??
                  null,
                fileSizeBytes:
                  response.extraction.fileSizeBytes ??
                  selectedFile?.size ??
                  null,
                pageCount:
                  response.extraction.pageCount,
              },
            }),
            cache: "no-store",
          }
        );

      const result =
        (await request.json()) as
          ConfirmOfferApiResponse;

      if (
        !request.ok ||
        !result.success
      ) {
        setCreateError(
          result.success
            ? "The offer could not be created."
            : result.message
        );
        return;
      }

      setCreatedOffer(result);
    } catch (caught) {
      console.error(
        "[OFFER_CREATE_UI]",
        caught
      );

      setCreateError(
        "Something went wrong while creating the offer. Please try again."
      );
    } finally {
      setCreatingOffer(false);
    }
  }

  function reset() {
    setSelectedFile(
      null
    );

    setResponse(null);
    setScan(null);
    setError(null);
    setCreateError(null);
    setCreatedOffer(null);
    setCreatingOffer(false);
    setEditingField(
      null
    );

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">

        {/* =====================================================
            TOP NAV
        ====================================================== */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pro/offers"
            className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft
              size={17}
            />

            Offer Intelligence
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            <ShieldCheck
              size={15}
            />

            Local processing
          </div>
        </div>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-xl shadow-slate-950/10">
          <div className="relative p-7 md:p-10 lg:p-12">
            <div className="pointer-events-none absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-120px] left-[20%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-200">
                <Sparkles
                  size={14}
                />

                PRO • Offer Intelligence
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl lg:text-6xl">
                {offerSide === "B"
                  ? "Add the offer you want to compare."
                  : "Understand what your offer is really worth."}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                {offerSide === "B"
                  ? "Upload Offer B. We’ll use the same local scanner and review process, then compare it with your saved Offer A."
                  : "Upload your offer letter. We’ll locally extract the compensation and equity terms, then you review every important number before it enters your comparison."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <LockKeyhole
                    size={14}
                  />

                  No external AI
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <FileCheck2
                    size={14}
                  />

                  Evidence-backed
                  extraction
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <CheckCircle2
                    size={14}
                  />

                  You confirm before
                  modeling
                </span>
              </div>
            </div>
          </div>
        </section>

        {modeResolved &&
        offerSide === "B" &&
        compareWithOfferId ? (
          <section className="mt-6 rounded-[24px] border border-violet-200 bg-violet-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
                  Offer B mode
                </p>

                <h2 className="mt-1 text-lg font-black text-violet-950">
                  Add the second offer
                </h2>

                <p className="mt-1 text-sm leading-6 text-violet-900/75">
                  This offer will be compared with your saved Offer A.
                </p>
              </div>

              <Link
                href={`/pro/offers/${encodeURIComponent(
                  compareWithOfferId
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-black text-violet-700 transition hover:bg-violet-100"
              >
                <ArrowLeft size={16} />
                View Offer A
              </Link>
            </div>
          </section>
        ) : null}

        {/* =====================================================
            UPLOAD MODE
        ====================================================== */}

        {!scan ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">

            {/* -------------------------------------------------
                UPLOAD
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  Step 1
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Upload your offer
                  letter
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  For this version,
                  upload a
                  text-based PDF.
                  Scanned/image-only
                  PDFs will be
                  detected rather
                  than guessed.
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={
                  onFileInput
                }
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  inputRef.current?.click()
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    inputRef.current?.click();
                  }
                }}
                onDragEnter={(
                  event
                ) => {
                  event.preventDefault();

                  setDragging(
                    true
                  );
                }}
                onDragOver={(
                  event
                ) => {
                  event.preventDefault();

                  setDragging(
                    true
                  );
                }}
                onDragLeave={() =>
                  setDragging(
                    false
                  )
                }
                onDrop={onDrop}
                className={[
                  "mt-6 flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-8 text-center transition",
                  dragging
                    ? "border-violet-400 bg-violet-50"
                    : selectedFile
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/30",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-16 w-16 items-center justify-center rounded-2xl",
                    selectedFile
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-violet-100 text-violet-700",
                  ].join(" ")}
                >
                  {selectedFile ? (
                    <FileCheck2
                      size={30}
                    />
                  ) : (
                    <UploadCloud
                      size={30}
                    />
                  )}
                </div>

                {selectedFile ? (
                  <>
                    <p className="mt-5 max-w-md break-all text-lg font-black text-slate-950">
                      {
                        selectedFile.name
                      }
                    </p>

                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {fileSize(
                        selectedFile.size
                      )}
                    </p>

                    <p className="mt-4 text-xs text-slate-400">
                      Click or drop
                      another PDF to
                      replace this
                      file.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-lg font-black text-slate-950">
                      Drop your offer
                      letter here
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      or click to
                      choose a PDF
                      from your
                      computer
                    </p>

                    <p className="mt-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-400 shadow-sm">
                      PDF • Maximum
                      10 MB
                    </p>
                  </>
                )}
              </div>

              {error ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                  <CircleAlert
                    className="mt-0.5 shrink-0"
                    size={18}
                  />

                  <p className="text-sm font-bold leading-6">
                    {error}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    !selectedFile ||
                    scanning
                  }
                  onClick={
                    scanOffer
                  }
                  className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {scanning ? (
                    <>
                      <Loader2
                        className="animate-spin"
                        size={17}
                      />

                      Scanning locally…
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={17}
                      />

                      Scan offer
                    </>
                  )}
                </button>

                {selectedFile ? (
                  <button
                    type="button"
                    disabled={
                      scanning
                    }
                    onClick={
                      reset
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw
                      size={16}
                    />

                    Clear
                  </button>
                ) : null}
              </div>
            </section>

            {/* -------------------------------------------------
                PRIVACY / PRODUCT VALUE
            -------------------------------------------------- */}

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <h3 className="mt-4 text-lg font-black text-emerald-950">
                  Private by design
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                  The current
                  scanner processes
                  text locally on
                  our application
                  server. Your offer
                  is not sent to
                  OpenAI, Gemini,
                  Groq or another
                  external AI
                  provider.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  What we look for
                </p>

                <div className="mt-4 space-y-4">
                  {[
                    [
                      "Cash reality",
                      "Fixed salary, variable pay, bonuses, PF and gratuity.",
                    ],

                    [
                      "Equity reality",
                      "ESOP/RSU quantity, strike price, FMV, vesting and cliff.",
                    ],

                    [
                      "Hidden conditions",
                      "Clawbacks, exercise windows and important missing information.",
                    ],
                  ].map(
                    ([
                      title,
                      description,
                    ]) => (
                      <div
                        key={
                          title
                        }
                        className="flex gap-3"
                      >
                        <CheckCircle2
                          className="mt-0.5 shrink-0 text-violet-600"
                          size={17}
                        />

                        <div>
                          <p className="text-sm font-black">
                            {
                              title
                            }
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {
                              description
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info
                    className="mt-0.5 shrink-0 text-amber-700"
                    size={17}
                  />

                  <p className="text-xs leading-5 text-amber-900">
                    Extraction is
                    assistance, not
                    truth. You&apos;ll
                    review every
                    important field
                    before we use it
                    in Offer
                    Intelligence.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {/* =====================================================
            REVIEW MODE
        ====================================================== */}

        {scan &&
        response ? (
          <div className="mt-8">

            {/* -------------------------------------------------
                SCAN SUCCESS
            -------------------------------------------------- */}

            <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 md:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <FileCheck2
                      size={24}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Local scan
                      complete
                    </p>

                    <h2 className="mt-1 text-xl font-black text-emerald-950">
                      Review what we
                      found
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                      {
                        response
                          .extraction
                          .fileName
                      }{" "}
                      •{" "}
                      {
                        response
                          .extraction
                          .extractedCharacterCount
                      }{" "}
                      characters
                      extracted
                      {response
                        .extraction
                        .pageCount
                        ? ` • ${response.extraction.pageCount} page${
                            response
                              .extraction
                              .pageCount ===
                            1
                              ? ""
                              : "s"
                          }`
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    reset
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                >
                  <UploadCloud
                    size={16}
                  />

                  Scan another
                </button>
              </div>
            </section>

            {/* -------------------------------------------------
                REVIEW PROGRESS
            -------------------------------------------------- */}

            <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Step 2 • Review
                    & Confirm
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Confirm the
                    extracted terms
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Confirm correct
                    values, edit
                    anything that
                    was interpreted
                    incorrectly and
                    reject values
                    that do not
                    belong to your
                    offer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    confirmAllExtracted
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                >
                  <CheckCircle2
                    size={17}
                  />

                  Confirm all
                  extracted
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-black text-slate-700">
                    {
                      reviewStats
                        .reviewed
                    }{" "}
                    of{" "}
                    {
                      reviewStats.total
                    }{" "}
                    extracted fields
                    reviewed
                  </p>

                  <p className="text-sm font-black text-violet-700">
                    {
                      reviewStats.percentage
                    }
                    %
                  </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-300"
                    style={{
                      width: `${reviewStats.percentage}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* -------------------------------------------------
                ISSUES
            -------------------------------------------------- */}

            {scan.issues
              .length > 0 ? (
              <section className="mt-6 overflow-hidden rounded-[24px] border border-amber-200 bg-amber-50">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedIssues(
                      (current) =>
                        !current
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <CircleAlert
                      size={19}
                      className="text-amber-700"
                    />

                    <div>
                      <p className="font-black text-amber-950">
                        Scanner
                        review notes
                      </p>

                      <p className="mt-1 text-xs text-amber-800">
                        {
                          scan.issues
                            .length
                        }{" "}
                        item
                        {scan
                          .issues
                          .length ===
                        1
                          ? ""
                          : "s"}{" "}
                        need
                        attention
                        or context.
                      </p>
                    </div>
                  </div>

                  {expandedIssues ? (
                    <ChevronUp
                      size={18}
                      className="text-amber-700"
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className="text-amber-700"
                    />
                  )}
                </button>

                {expandedIssues ? (
                  <div className="border-t border-amber-200 px-5 pb-5 pt-4">
                    <div className="space-y-3">
                      {scan.issues.map(
                        (
                          issue,
                          index
                        ) => (
                          <div
                            key={`${issue.code}-${issue.field ?? "general"}-${index}`}
                            className="rounded-xl bg-white/70 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                  issue.severity ===
                                  "BLOCKING"
                                    ? "bg-red-100 text-red-700"
                                    : issue.severity ===
                                      "WARNING"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700",
                                ].join(
                                  " "
                                )}
                              >
                                {
                                  issue.severity
                                }
                              </span>

                              <p className="text-sm font-black text-slate-950">
                                {
                                  issue.title
                                }
                              </p>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {
                                issue.message
                              }
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* -------------------------------------------------
                REVIEW SECTIONS
            -------------------------------------------------- */}

            <div className="mt-6 space-y-6">
              {sections.map(
                (section) => (
                  <section
                    key={
                      section.id
                    }
                    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7"
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                        {
                          section.id
                        }
                      </p>

                      <h3 className="mt-2 text-xl font-black">
                        {
                          section.title
                        }
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {
                          section.subtitle
                        }
                      </p>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      {section.fields.map(
                        (item) => (
                          <ReviewFieldCard
                            key={
                              item.path
                            }
                            item={
                              item
                            }
                            onConfirm={
                              confirmField
                            }
                            onReject={
                              rejectField
                            }
                            onEdit={
                              setEditingField
                            }
                          />
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>

            {/* -------------------------------------------------
                BOTTOM ACTION / PERSISTENCE SUCCESS
            -------------------------------------------------- */}

            {createdOffer ? (
              <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm">
                <div className="bg-emerald-50 p-6 md:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                        <CheckCircle2 size={24} />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                          Offer {createdOffer.side} created
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-emerald-950">
                          {createdOffer.offer.companyName ??
                            "Your offer"}
                        </h3>

                        {createdOffer.offer.roleTitle ? (
                          <p className="mt-1 text-sm font-bold text-emerald-900/70">
                            {createdOffer.offer.roleTitle}
                          </p>
                        ) : null}

                        <p className="mt-3 text-sm leading-6 text-emerald-900/80">
                          {createdOffer.side === "B"
                            ? "Offer B has been saved. Both offers are now ready for the side-by-side Offer Intelligence comparison."
                            : "Your reviewed offer has been saved and is ready for Offer Intelligence comparison."}
                        </p>
                      </div>
                    </div>

                    {createdOffer.side === "A" ? (
                      <Link
                        href={`/pro/offers/new?side=B&compareWith=${encodeURIComponent(
                          createdOffer.offerId
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <FileText size={17} />
                        Compare with another offer
                      </Link>
                    ) : compareWithOfferId ? (
                      <Link
                        href={`/pro/offers/compare?offerA=${encodeURIComponent(
                          compareWithOfferId
                        )}&offerB=${encodeURIComponent(
                          createdOffer.offerId
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <FileText size={17} />
                        Compare Offer A vs Offer B
                      </Link>
                    ) : (
                      <Link
                        href={`/pro/offers/${encodeURIComponent(
                          createdOffer.offerId
                        )}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <FileText size={17} />
                        View saved offer
                      </Link>
                    )}
                  </div>
                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Fixed compensation
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {money(createdOffer.offer.fixedSalary)}
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Headline CTC
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {money(createdOffer.offer.headlineCTC)}
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Equity
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {createdOffer.offer.equityType ?? "None"}
                    </p>
                  </div>

                  <div className="bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Options / shares
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                      {createdOffer.offer.totalOptionsOrShares === null
                        ? "Not applicable"
                        : number(createdOffer.offer.totalOptionsOrShares)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                  <p className="text-xs text-slate-500">
                    Offer ID: {createdOffer.offerId}
                  </p>

                  <Link
                    href={`/pro/offers/${createdOffer.offerId}`}
                    className="text-sm font-black text-violet-700 hover:text-violet-800"
                  >
                    View saved offer →
                  </Link>
                </div>
              </section>
            ) : (
              <section className="mt-6 rounded-[28px] bg-slate-950 p-6 text-white md:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                      Next
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      Create this offer
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      Once every extracted field has been reviewed, we will revalidate the offer on the server, normalize only confirmed values and save Offer {offerSide} for comparison.
                    </p>

                    {createError ? (
                      <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">
                        <CircleAlert
                          className="mt-0.5 shrink-0"
                          size={18}
                        />
                        <p className="text-sm font-bold leading-6">
                          {createError}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Review
                      </p>

                      <p className="mt-1 font-black">
                        {reviewStats.remaining} remaining
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        creatingOffer ||
                        reviewStats.total === 0 ||
                        reviewStats.remaining > 0
                      }
                      onClick={createOffer}
                      className="inline-flex min-w-[175px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        reviewStats.remaining > 0
                          ? "Review every extracted field before creating the offer."
                          : `Create Offer ${offerSide}`
                      }
                    >
                      {creatingOffer ? (
                        <>
                          <Loader2
                            className="animate-spin"
                            size={17}
                          />
                          Creating Offer...
                        </>
                      ) : (
                        <>
                          <FileText size={17} />
                          Create Offer {offerSide}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>

      {/* =======================================================
          EDIT MODAL
      ======================================================== */}

      {editingField ? (
        <EditFieldModal
          key={
            editingField.path
          }
          item={
            editingField
          }
          onClose={() =>
            setEditingField(
              null
            )
          }
          onSave={
            saveEditedField
          }
        />
      ) : null}
    </main>
  );
}