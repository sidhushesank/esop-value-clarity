"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type FieldStatus =
  | "VERIFIED"
  | "REVIEW"
  | "NOT_FOUND"
  | "USER_CONFIRMED";

type GrantStatus =
  | "DRAFT"
  | "REVIEW_REQUIRED"
  | "CONFIRMED"
  | "ARCHIVED";

type DocumentStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "CONFIRMED"
  | "FAILED"
  | "DELETED";

type GrantField = {
  id: string;
  fieldKey: string;
  label: string;
  extractedValue: unknown;
  confirmedValue: unknown;
  status: FieldStatus;
  sourceText: string | null;
  sourcePage: number | null;
  reviewedAt: string | null;
};

type Grant = {
  id: string;
  status: GrantStatus;

  companyName: string | null;
  grantName: string | null;
  grantDate: string | null;
  optionCount: number | null;
  strikePrice: number | null;
  currency: string | null;

  vestingStartDate: string | null;
  vestingDurationMonths: number | null;
  cliffMonths: number | null;
  vestingFrequency: string | null;

  expiryDate: string | null;
  postTerminationExerciseDays: number | null;

  notes: string | null;
  confirmedAt: string | null;

  fields: GrantField[];
};

type Clause = {
  id: string;
  type: string;
  importance:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  title: string;
  summary: string | null;
  extractedText: string | null;

  fieldStatus: FieldStatus;
  sourcePage: number | null;
};

type DocumentData = {
  id: string;
  originalFileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  status: DocumentStatus;

  storageKey: string | null;

  extractionError: string | null;

  processingStartedAt: string | null;
  processedAt: string | null;
  confirmedAt: string | null;

  createdAt: string;
  updatedAt: string;

  grants: Grant[];
  clauses: Clause[];
};

type DocumentResponse = {
  success: boolean;
  document?: DocumentData;
  code?: string;
  message?: string;
};

type ProcessResponse = {
  success: boolean;

  document?: {
    id: string;
    status: DocumentStatus;
    processedAt: string | null;
    originalFileName: string | null;
  };

  extraction?: {
    pageCount: number;
    characterCount: number;
    preview: string;
  };

  code?: string;
  message?: string;
};

type FieldMutationResponse = {
  success: boolean;
  field?: GrantField;
  code?: string;
  message?: string;
};

type ConfirmResponse = {
  success: boolean;
  grant?: {
    id: string;
    status: GrantStatus;
    confirmedAt: string | null;
  };
  document?: {
    id: string;
    status: DocumentStatus;
    confirmedAt: string | null;
  };
  code?: string;
  message?: string;
};

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function GrantReviewPage() {
  const params = useParams<{
    documentId: string;
  }>();


  const documentId = params.documentId;

  const [document, setDocument] =
    useState<DocumentData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [processMessage, setProcessMessage] =
    useState("");

  const [savingFieldId, setSavingFieldId] =
    useState<string | null>(null);

  const [confirmingGrant, setConfirmingGrant] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadDocument = useCallback(async () => {
    if (!documentId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/pro/grants/${documentId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as DocumentResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.document
      ) {
        throw new Error(
          data.message ||
            "We could not load this grant document."
        );
      }

      setDocument(data.document);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load this grant document."
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  async function handleProcessDocument() {
    if (!documentId || processing) {
      return;
    }

    setProcessing(true);
    setError("");
    setProcessMessage("");

    try {
      const response = await fetch(
        `/api/pro/grants/${documentId}/process`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data =
        (await response.json()) as ProcessResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We could not analyse this document."
        );
      }

      setProcessMessage(
        data.extraction
          ? `Document text extracted successfully from ${data.extraction.pageCount} page${
              data.extraction.pageCount === 1
                ? ""
                : "s"
            }.`
          : "Document processed successfully."
      );

      await loadDocument();
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "We could not analyse this document."
      );

      await loadDocument();
    } finally {
      setProcessing(false);
    }
  }

  async function handleFieldReview(
    fieldId: string,
    action: "ACCEPT" | "UPDATE" | "CONFIRM_MISSING",
    value?: unknown
  ) {
    if (!documentId || savingFieldId) {
      return;
    }

    setSavingFieldId(fieldId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/pro/grants/${documentId}/fields`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fieldId,
            action,
            ...(action === "UPDATE" ? { value } : {}),
          }),
        }
      );

      const data =
        (await response.json()) as FieldMutationResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We could not save this reviewed field."
        );
      }

      setSuccessMessage(
        action === "ACCEPT"
          ? "Extracted value accepted."
          : action === "CONFIRM_MISSING"
          ? "Field marked as not provided in the source document."
          : "Reviewed value saved."
      );

      await loadDocument();
    } catch (fieldError) {
      setError(
        fieldError instanceof Error
          ? fieldError.message
          : "We could not save this reviewed field."
      );
    } finally {
      setSavingFieldId(null);
    }
  }

  async function handleConfirmGrant() {
    if (!documentId || confirmingGrant) {
      return;
    }

    setConfirmingGrant(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/pro/grants/${documentId}/confirm`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data =
        (await response.json()) as ConfirmResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We could not confirm this grant."
        );
      }

      setSuccessMessage(
        "Grant confirmed. Your reviewed terms are now part of your equity profile."
      );

      await loadDocument();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "We could not confirm this grant."
      );
    } finally {
      setConfirmingGrant(false);
    }
  }

  if (loading) {
    return <ReviewLoadingState />;
  }

  if (error && !document) {
    return (
      <ReviewFatalError
        message={error}
        onRetry={loadDocument}
      />
    );
  }

  if (!document) {
    return (
      <ReviewFatalError
        message="This grant document is unavailable."
        onRetry={loadDocument}
      />
    );
  }

  const primaryGrant =
    document.grants[0] ?? null;

  const verifiedFields =
    primaryGrant?.fields.filter(
      (field) => field.status === "VERIFIED"
    ).length ?? 0;

  const userConfirmedFields =
    primaryGrant?.fields.filter(
      (field) => field.status === "USER_CONFIRMED"
    ).length ?? 0;

  const reviewFields =
    primaryGrant?.fields.filter(
      (field) => field.status === "REVIEW"
    ).length ?? 0;

  const missingFields =
    primaryGrant?.fields.filter(
      (field) => field.status === "NOT_FOUND"
    ).length ?? 0;

  const totalFields =
    primaryGrant?.fields.length ?? 0;

  const unresolvedFields =
    reviewFields + missingFields;

  const canConfirmGrant =
    Boolean(primaryGrant) &&
    totalFields > 0 &&
    unresolvedFields === 0 &&
    document.status !== "CONFIRMED";

  const isUploaded =
    document.status === "UPLOADED";

  const isProcessing =
    document.status === "PROCESSING" ||
    processing;

  const hasProcessed =
    document.status === "REVIEW_REQUIRED" ||
    document.status === "CONFIRMED";

  const hasStructuredData =
    Boolean(primaryGrant) ||
    document.clauses.length > 0;

  const isFailed =
    document.status === "FAILED";

  const isConfirmed =
    document.status === "CONFIRMED";

  return (
    <main className="min-h-screen bg-[#f7faff] text-slate-950">
      <div className="mx-auto max-w-[1520px] px-4 py-5 sm:px-6 md:px-8 md:py-7">
        {/* ================================================================
            TOP BAR
        ================================================================= */}

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/pro/grants/new"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft size={15} />
            {isConfirmed ? "Return to equity profile" : "Back to grant intake"}
          </Link>

          <div className="flex items-center gap-2">
            <StatusPill
              status={document.status}
            />

            <button
              type="button"
              onClick={loadDocument}
              disabled={processing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              aria-label="Refresh document"
            >
              <RefreshCcw size={15} />
            </button>
          </div>
        </div>

        {/* ================================================================
            HERO / DOCUMENT HEADER
        ================================================================= */}

        <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.08)]">
          <div className="pointer-events-none absolute -right-40 -top-44 h-[500px] w-[500px] rounded-full bg-blue-100/70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-44 left-[20%] h-[420px] w-[420px] rounded-full bg-cyan-100/60 blur-3xl" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                    <SearchCheck size={12} />
                    Confirmed grant
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-bold text-emerald-700">
                    <LockKeyhole size={11} />
                    Private document
                  </span>
                </div>

                <p className="mt-7 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Source document
                </p>

                <h1 className="mt-2 max-w-4xl break-words text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">
                  {document.originalFileName ||
                    "ESOP grant document"}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  Review what ESOP Value Clarity
                  understands from your source
                  document before any information
                  becomes part of your confirmed
                  equity profile.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <MetaPill
                    icon={
                      <FileText size={12} />
                    }
                    text="PDF document"
                  />

                  <MetaPill
                    icon={
                      <CalendarDays
                        size={12}
                      />
                    }
                    text={`Uploaded ${formatDate(
                      document.createdAt
                    )}`}
                  />

                  <MetaPill
                    icon={
                      <ShieldCheck
                        size={12}
                      />
                    }
                    text="Pro protected"
                  />

                  <MetaPill
                    icon={
                      <FileCheck2
                        size={12}
                      />
                    }
                    text={formatFileSize(
                      document.fileSizeBytes
                    )}
                  />
                </div>
              </div>

              <div className="lg:col-span-4">
                <ReviewProgressCard
                  status={document.status}
                  processedAt={
                    document.processedAt
                  }
                  confirmedAt={
                    document.confirmedAt
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            INLINE MESSAGES
        ================================================================= */}

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <AlertCircle size={17} />
              </div>

              <div>
                <p className="text-xs font-black text-rose-900">
                  This step needs attention
                </p>

                <p className="mt-1 text-xs leading-5 text-rose-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {processMessage && !isConfirmed && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <p className="text-xs font-black text-emerald-900">
                  Document processing complete
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {processMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <p className="text-xs font-black text-emerald-900">
                  Review saved
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            MAIN WORKSPACE
        ================================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* ============================================================
                PROCESSING / EXTRACTION CARD
            ============================================================= */}

            {isUploaded && (
              <AnalysisStartCard
                onStart={
                  handleProcessDocument
                }
                processing={processing}
              />
            )}

            {isProcessing && (
              <ProcessingCard />
            )}

            {isFailed && (
              <ProcessingFailedCard
                error={
                  document.extractionError
                }
                onRetry={
                  handleProcessDocument
                }
                processing={processing}
              />
            )}

            {hasProcessed &&
              !hasStructuredData && (
                <ExtractionCompleteCard />
              )}

            {/* ============================================================
                STRUCTURED GRANT DATA
            ============================================================= */}

            {primaryGrant && isConfirmed && (
              <ConfirmedGrantSummary grant={primaryGrant} />
            )}

            {primaryGrant && (
              <>
                <SectionCard
                  eyebrow="Grant terms"
                  title="Core grant details"
                  description="These values represent the structured grant information currently associated with this document."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewValue
                      label="Company"
                      value={
                        primaryGrant.companyName
                      }
                    />

                    <ReviewValue
                      label="Grant name"
                      value={
                        primaryGrant.grantName
                      }
                    />

                    <ReviewValue
                      label="Options granted"
                      value={
                        primaryGrant.optionCount !==
                        null
                          ? formatNumber(
                              primaryGrant.optionCount
                            )
                          : null
                      }
                    />

                    <ReviewValue
                      label="Exercise price"
                      value={
                        primaryGrant.strikePrice !==
                        null
                          ? formatCurrency(
                              primaryGrant.strikePrice,
                              primaryGrant.currency ||
                                "INR"
                            )
                          : null
                      }
                    />

                    <ReviewValue
                      label="Grant date"
                      value={
                        primaryGrant.grantDate
                          ? formatDate(
                              primaryGrant.grantDate
                            )
                          : null
                      }
                    />

                    <ReviewValue
                      label="Currency"
                      value={
                        primaryGrant.currency
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Vesting"
                  title="Vesting structure"
                  description="The schedule determines when the granted options become vested."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewValue
                      label="Vesting start"
                      value={
                        primaryGrant.vestingStartDate
                          ? formatDate(
                              primaryGrant.vestingStartDate
                            )
                          : null
                      }
                    />

                    <ReviewValue
                      label="Duration"
                      value={
                        primaryGrant.vestingDurationMonths !==
                        null
                          ? `${primaryGrant.vestingDurationMonths} months`
                          : null
                      }
                    />

                    <ReviewValue
                      label="Cliff"
                      value={
                        primaryGrant.cliffMonths !==
                        null
                          ? `${primaryGrant.cliffMonths} months`
                          : null
                      }
                    />

                    <ReviewValue
                      label="Vesting frequency"
                      value={
                        primaryGrant.vestingFrequency
                          ? humanizeEnum(
                              primaryGrant.vestingFrequency
                            )
                          : null
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Exercise"
                  title="Exercise and expiry"
                  description="These terms can become especially important when employment ends or the option approaches expiry."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewValue
                      label="Option expiry"
                      value={
                        primaryGrant.expiryDate
                          ? formatDate(
                              primaryGrant.expiryDate
                            )
                          : null
                      }
                    />

                    <ReviewValue
                      label="Post-termination exercise window"
                      value={
                        primaryGrant.postTerminationExerciseDays !==
                        null
                          ? `${primaryGrant.postTerminationExerciseDays} days`
                          : null
                      }
                    />
                  </div>
                </SectionCard>
              </>
            )}

            {/* ============================================================
                FIELD REVIEW
            ============================================================= */}

            {primaryGrant &&
              primaryGrant.fields.length >
                0 && (
                <SectionCard
                  eyebrow="Extraction review"
                  title="Review extracted fields"
                  description="Verified fields were identified clearly. Review fields should be checked before confirmation."
                >
                  <div className="space-y-3">
                    {primaryGrant.fields.map(
                      (field) => (
                        <ExtractedFieldRow
                          key={field.id}
                          field={field}
                          saving={savingFieldId === field.id}
                          locked={isConfirmed}
                          onReview={handleFieldReview}
                        />
                      )
                    )}
                  </div>
                </SectionCard>
              )}

            {/* ============================================================
                IMPORTANT CLAUSES
            ============================================================= */}

            {document.clauses.length >
              0 && (
              <SectionCard
                eyebrow="Important clauses"
                title="Terms worth your attention"
                description="These clauses may materially affect vesting, exercise, forfeiture or liquidity outcomes."
              >
                <div className="space-y-3">
                  {document.clauses.map(
                    (clause) => (
                      <ClauseCard
                        key={clause.id}
                        clause={clause}
                      />
                    )
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          {/* ================================================================
              RIGHT RAIL
          ================================================================= */}

          <aside className="space-y-5 lg:col-span-4">
            <SourceOfTruthCard
              document={document}
            />

            <ReviewSummaryCard
              totalFields={totalFields}
              verifiedFields={verifiedFields}
              userConfirmedFields={userConfirmedFields}
              reviewFields={reviewFields}
              missingFields={missingFields}
              unresolvedFields={unresolvedFields}
              clauseCount={document.clauses.length}
            />

            <TrustCard />
          </aside>
        </div>

        {/* ================================================================
            BOTTOM ACTION BAR
        ================================================================= */}

        <div className="sticky bottom-4 z-30 mt-8">
          <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-4 rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {isConfirmed ? (
                  <CheckCircle2
                    size={18}
                  />
                ) : (
                  <ShieldCheck
                    size={18}
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-black text-slate-950">
                  {isConfirmed
                    ? "Grant confirmed"
                    : "You remain in control"}
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                  {isConfirmed
                    ? "This document has been confirmed as part of your equity profile."
                    : "Nothing should become confirmed equity data until you review the extracted terms."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/pro/equity"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {isConfirmed ? "View equity profile" : "Return to workspace"}
              </Link>

              {hasStructuredData &&
                !isConfirmed && (
                  <button
                    type="button"
                    onClick={handleConfirmGrant}
                    disabled={!canConfirmGrant || confirmingGrant}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white transition ${
                      canConfirmGrant && !confirmingGrant
                        ? "bg-blue-600 shadow-[0_12px_28px_rgba(37,99,235,0.20)] hover:-translate-y-0.5 hover:bg-blue-700"
                        : "cursor-not-allowed bg-slate-300"
                    }`}
                    title={
                      canConfirmGrant
                        ? "Confirm this reviewed grant"
                        : `${unresolvedFields} field${unresolvedFields === 1 ? "" : "s"} still need review.`
                    }
                  >
                    {confirmingGrant ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Confirming
                      </>
                    ) : (
                      <>
                        Confirm grant
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
            </div>
          </div>
        </div>

        <footer className="mt-7 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[10px] leading-5 text-slate-400 sm:flex-row">
          <span>
            ESOP Value Clarity · Grant
            intelligence
          </span>

          <span>
            Review extracted terms against
            your original agreement before
            relying on them.
          </span>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================================
 * ANALYSIS STATES
 * ========================================================================== */

function AnalysisStartCard({
  onStart,
  processing,
}: {
  onStart: () => void;
  processing: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_16px_48px_rgba(37,99,235,0.06)]">
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileSearch size={21} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
              Ready for analysis
            </p>

            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Prepare this document
              for review.
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
              We’ll read the PDF and
              prepare its text for the
              structured grant extraction
              stage. Your original document
              remains unchanged.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={processing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
              />
              Analysing
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analyse document
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ProcessingCard() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-cyan-50/50 shadow-sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <Loader2
              size={21}
              className="animate-spin"
            />
          </div>

          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
              Processing
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Reading the source
              document.
            </h2>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              We’re extracting readable
              content from the PDF while
              preserving the original file
              separately.
            </p>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div className="evc-review-progress h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes evc-review-progress {
          0% {
            transform: translateX(-80%);
          }

          50% {
            transform: translateX(30%);
          }

          100% {
            transform: translateX(140%);
          }
        }

        .evc-review-progress {
          animation: evc-review-progress
            1.5s ease-in-out infinite;
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .evc-review-progress {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function ExtractionCompleteCard() {
  return (
    <div className="rounded-[26px] border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/60 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_12px_28px_rgba(16,185,129,0.18)]">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">
            Text extraction complete
          </p>

          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            The PDF is ready for
            structured grant
            interpretation.
          </h2>

          <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600">
            The source document has been
            read successfully. The next
            backend step will interpret
            that text into grant, vesting,
            exercise and clause fields.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">
            <Info size={13} />
            Structured ESOP extraction is
            the next implementation stage.
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingFailedCard({
  error,
  onRetry,
  processing,
}: {
  error: string | null;
  onRetry: () => void;
  processing: boolean;
}) {
  return (
    <div className="rounded-[26px] border border-rose-200 bg-rose-50/60 p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
            <TriangleAlert size={21} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-700">
              Processing unsuccessful
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              We couldn’t read this PDF.
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600">
              {error ||
                "The document could not be processed. It may be image-only, scanned, encrypted or malformed."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={processing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
        >
          <RefreshCcw size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * MAIN COMPONENTS
 * ========================================================================== */

function ConfirmedGrantSummary({
  grant,
}: {
  grant: Grant;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/50 to-cyan-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
            <CheckCircle2 size={12} />
            Confirmed source of truth
          </div>
          <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            Your grant is confirmed.
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600">
            These reviewed values are now the trusted grant terms used across your equity profile and future analyses.
          </p>
        </div>

        <Link
          href="/pro/equity"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
        >
          View equity profile
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReviewValue
          label="Company"
          value={grant.companyName}
        />
        <ReviewValue
          label="Options granted"
          value={grant.optionCount !== null ? formatNumber(grant.optionCount) : null}
        />
        <ReviewValue
          label="Exercise price"
          value={grant.strikePrice !== null ? formatCurrency(grant.strikePrice, grant.currency || "INR") : null}
        />
        <ReviewValue
          label="Expiry"
          value={grant.expiryDate ? formatDate(grant.expiryDate) : null}
        />
      </div>
    </section>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>

      <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

function ReviewValue({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const missing = !value;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        missing
          ? "border-amber-100 bg-amber-50/50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p
          className={`text-sm font-black ${
            missing
              ? "text-amber-700"
              : "text-slate-950"
          }`}
        >
          {value ||
            "Not identified"}
        </p>

        {missing && (
          <CircleAlert
            size={15}
            className="shrink-0 text-amber-500"
          />
        )}
      </div>
    </div>
  );
}

function ExtractedFieldRow({
  field,
  saving,
  locked,
  onReview,
}: {
  field: GrantField;
  saving: boolean;
  locked: boolean;
  onReview: (
    fieldId: string,
    action: "ACCEPT" | "UPDATE" | "CONFIRM_MISSING",
    value?: unknown
  ) => Promise<void>;
}) {
  const displayValue =
    field.status === "USER_CONFIRMED"
      ? field.confirmedValue
      : field.extractedValue;

  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(
    toEditableValue(displayValue)
  );

  useEffect(() => {
    setDraftValue(toEditableValue(displayValue));
  }, [displayValue]);

  const needsReview =
    field.status === "REVIEW" ||
    field.status === "NOT_FOUND";

  const userConfirmed =
    field.status === "USER_CONFIRMED";

  async function saveEditedValue() {
    const normalized = normalizeFieldInput(
      field.fieldKey,
      draftValue
    );

    await onReview(field.id, "UPDATE", normalized);
    setEditing(false);
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        userConfirmed
          ? "border-blue-200 bg-blue-50/40"
          : needsReview
          ? "border-amber-200 bg-amber-50/40"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black text-slate-950">
              {field.label}
            </p>
            <FieldStatusPill status={field.status} />
          </div>

          {!editing && (
            <p className="mt-2 break-words text-sm font-bold text-slate-700">
              {formatUnknownValue(displayValue)}
            </p>
          )}

          {editing && (
            <div className="mt-3 max-w-xl">
              <FieldEditor
                fieldKey={field.fieldKey}
                value={draftValue}
                onChange={setDraftValue}
                disabled={saving || locked}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEditedValue}
                  disabled={saving || locked}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Save reviewed value
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDraftValue(toEditableValue(displayValue));
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {field.sourceText && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                Source evidence
              </p>
              <p className="mt-1.5 max-w-3xl text-[10px] leading-5 text-slate-500">
                “{truncate(field.sourceText, 300)}”
              </p>
            </div>
          )}

          {!locked && !editing && needsReview && (
            <div className="mt-3 flex flex-wrap gap-2">
              {field.status === "REVIEW" &&
                field.extractedValue !== null &&
                field.extractedValue !== undefined && (
                  <button
                    type="button"
                    onClick={() => onReview(field.id, "ACCEPT")}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Accept extracted value
                  </button>
                )}

              <button
                type="button"
                onClick={() => {
                  setDraftValue(toEditableValue(displayValue));
                  setEditing(true);
                }}
                disabled={saving}
                className="rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {field.status === "NOT_FOUND"
                  ? "Enter value"
                  : "Edit value"}
              </button>

              {field.status === "NOT_FOUND" && (
                <button
                  type="button"
                  onClick={() => onReview(field.id, "CONFIRM_MISSING")}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Not provided in document
                </button>
              )}
            </div>
          )}

          {!locked && !editing && field.status === "VERIFIED" && (
            <button
              type="button"
              onClick={() => {
                setDraftValue(toEditableValue(displayValue));
                setEditing(true);
              }}
              disabled={saving}
              className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
            >
              Edit value
            </button>
          )}

          {!locked && !editing && userConfirmed && (
            <button
              type="button"
              onClick={() => {
                setDraftValue(toEditableValue(displayValue));
                setEditing(true);
              }}
              disabled={saving}
              className="mt-3 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
            >
              Edit confirmed value
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {field.sourcePage && (
            <span className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-black text-slate-500">
              Page {field.sourcePage}
            </span>
          )}

          {field.reviewedAt && (
            <span className="text-[8px] font-bold text-slate-400">
              Reviewed {formatDateTime(field.reviewedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldEditor({
  fieldKey,
  value,
  onChange,
  disabled,
}: {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  if (fieldKey === "vestingFrequency") {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      >
        <option value="">Select frequency</option>
        <option value="MONTHLY">Monthly</option>
        <option value="QUARTERLY">Quarterly</option>
        <option value="SEMI_ANNUAL">Semi annual</option>
        <option value="ANNUAL">Annual</option>
        <option value="CUSTOM">Custom</option>
        <option value="UNKNOWN">Unknown</option>
      </select>
    );
  }

  const isDateField = [
    "grantDate",
    "vestingStartDate",
    "expiryDate",
  ].includes(fieldKey);

  const isNumericField = [
    "optionCount",
    "strikePrice",
    "vestingDurationMonths",
    "cliffMonths",
    "postTerminationExerciseDays",
  ].includes(fieldKey);

  return (
    <input
      type={isDateField ? "date" : isNumericField ? "number" : "text"}
      step={fieldKey === "strikePrice" ? "0.01" : isNumericField ? "1" : undefined}
      min={isNumericField ? "0" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
      placeholder="Enter reviewed value"
    />
  );
}

function ClauseCard({
  clause,
}: {
  clause: Clause;
}) {
  const style =
    clause.importance === "CRITICAL"
      ? "border-rose-200 bg-rose-50/60"
      : clause.importance === "HIGH"
      ? "border-amber-200 bg-amber-50/60"
      : "border-slate-200 bg-slate-50";

  return (
    <div
      className={`rounded-2xl border p-4 ${style}`}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black text-slate-950">
              {clause.title}
            </p>

            <span className="rounded-full border border-current/10 bg-white/70 px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
              {humanizeEnum(
                clause.importance
              )}
            </span>
          </div>

          {clause.summary && (
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {clause.summary}
            </p>
          )}

          {clause.extractedText && (
            <p className="mt-3 text-[10px] leading-5 text-slate-500">
              Source: “
              {truncate(
                clause.extractedText,
                300
              )}
              ”
            </p>
          )}
        </div>

        {clause.sourcePage && (
          <span className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-black text-slate-500">
            Page {clause.sourcePage}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * RIGHT RAIL
 * ========================================================================== */

function SourceOfTruthCard({
  document,
}: {
  document: DocumentData;
}) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <FileCheck2 size={18} />
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
        Source of truth
      </p>

      <h3 className="mt-2 text-lg font-black text-slate-950">
        Original grant document
      </h3>

      <div className="mt-4 space-y-3">
        <InfoRow
          label="File"
          value={
            document.originalFileName ||
            "Unknown"
          }
        />

        <InfoRow
          label="Size"
          value={formatFileSize(
            document.fileSizeBytes
          )}
        />

        <InfoRow
          label="Uploaded"
          value={formatDateTime(
            document.createdAt
          )}
        />

        <InfoRow
          label="Processed"
          value={
            document.processedAt
              ? formatDateTime(
                  document.processedAt
                )
              : "Not yet"
          }
        />
      </div>

      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
        <div className="flex items-start gap-2">
          <LockKeyhole
            size={14}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="text-[10px] leading-5 text-emerald-800">
            The source PDF remains stored
            privately and separately from
            any values you later confirm.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewSummaryCard({
  totalFields,
  verifiedFields,
  userConfirmedFields,
  reviewFields,
  missingFields,
  unresolvedFields,
  clauseCount,
}: {
  totalFields: number;
  verifiedFields: number;
  userConfirmedFields: number;
  reviewFields: number;
  missingFields: number;
  unresolvedFields: number;
  clauseCount: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
        Review summary
      </p>

      <h3 className="mt-2 text-lg font-black text-slate-950">
        Extraction coverage
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Fields" value={String(totalFields)} />
        <MiniStat label="Verified" value={String(verifiedFields)} />
        <MiniStat label="User confirmed" value={String(userConfirmedFields)} />
        <MiniStat label="Clauses" value={String(clauseCount)} />
      </div>

      {unresolvedFields > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <CircleAlert
            size={14}
            className="mt-0.5 shrink-0 text-amber-600"
          />
          <p className="text-[10px] leading-5 text-amber-800">
            {unresolvedFields} field{unresolvedFields === 1 ? "" : "s"} still need your review
            {reviewFields > 0
              ? ` · ${reviewFields} extracted value${reviewFields === 1 ? "" : "s"} to check`
              : ""}
            {missingFields > 0
              ? ` · ${missingFields} missing value${missingFields === 1 ? "" : "s"}`
              : ""}.
          </p>
        </div>
      ) : totalFields > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <CheckCircle2
            size={14}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <p className="text-[10px] leading-5 text-emerald-800">
            All extracted fields are resolved. This grant is ready for final confirmation.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TrustCard() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-300">
        <ShieldCheck size={18} />
      </div>

      <h3 className="mt-4 text-lg font-black">
        Review before relying.
      </h3>

      <p className="mt-2 text-xs leading-6 text-slate-300">
        Document interpretation can be
        imperfect. Always compare extracted
        terms against the original grant
        agreement before using them for
        financial decisions.
      </p>
    </div>
  );
}

/* ============================================================================
 * STATUS COMPONENTS
 * ========================================================================== */

function ReviewProgressCard({
  status,
  processedAt,
  confirmedAt,
}: {
  status: DocumentStatus;
  processedAt: string | null;
  confirmedAt: string | null;
}) {
  const uploaded = true;

  const processed =
    status === "REVIEW_REQUIRED" ||
    status === "CONFIRMED";

  const confirmed =
    status === "CONFIRMED";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        Grant progress
      </p>

      <div className="mt-4 space-y-1">
        <ProgressStep
          label="Secure upload"
          complete={uploaded}
        />

        <ProgressConnector
          complete={processed}
        />

        <ProgressStep
          label="Document processed"
          complete={processed}
          active={
            status === "PROCESSING"
          }
        />

        <ProgressConnector
          complete={confirmed}
        />

        <ProgressStep
          label="Grant confirmed"
          complete={confirmed}
        />
      </div>

      {processedAt && (
        <p className="mt-4 text-[9px] font-semibold text-slate-400">
          Processed{" "}
          {formatDateTime(
            processedAt
          )}
        </p>
      )}

      {confirmedAt && (
        <p className="mt-1 text-[9px] font-semibold text-emerald-600">
          Confirmed{" "}
          {formatDateTime(
            confirmedAt
          )}
        </p>
      )}
    </div>
  );
}

function ProgressStep({
  label,
  complete,
  active = false,
}: {
  label: string;
  complete: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
          complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : active
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-slate-200 bg-white text-slate-300"
        }`}
      >
        {complete ? (
          <Check size={12} />
        ) : active ? (
          <Loader2
            size={12}
            className="animate-spin"
          />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>

      <span
        className={`text-[11px] font-bold ${
          complete
            ? "text-slate-800"
            : active
            ? "text-blue-700"
            : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ProgressConnector({
  complete,
}: {
  complete: boolean;
}) {
  return (
    <div
      className={`ml-[13px] h-4 w-px ${
        complete
          ? "bg-emerald-200"
          : "bg-slate-200"
      }`}
    />
  );
}

function StatusPill({
  status,
}: {
  status: DocumentStatus;
}) {
  const styles: Record<
    DocumentStatus,
    string
  > = {
    UPLOADED:
      "border-blue-200 bg-blue-50 text-blue-700",

    PROCESSING:
      "border-blue-200 bg-blue-50 text-blue-700",

    REVIEW_REQUIRED:
      "border-amber-200 bg-amber-50 text-amber-700",

    CONFIRMED:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    FAILED:
      "border-rose-200 bg-rose-50 text-rose-700",

    DELETED:
      "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {status ===
        "PROCESSING" && (
        <Loader2
          size={11}
          className="animate-spin"
        />
      )}

      {humanizeEnum(status)}
    </span>
  );
}

function FieldStatusPill({
  status,
}: {
  status: FieldStatus;
}) {
  const config = {
    VERIFIED: {
      text: "Verified",
      style:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    REVIEW: {
      text: "Review",
      style:
        "border-amber-200 bg-amber-50 text-amber-700",
    },

    NOT_FOUND: {
      text: "Not found",
      style:
        "border-slate-200 bg-white text-slate-500",
    },

    USER_CONFIRMED: {
      text: "User confirmed",
      style:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
  }[status];

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${config.style}`}
    >
      {config.text}
    </span>
  );
}

/* ============================================================================
 * SMALL COMPONENTS
 * ========================================================================== */

function MetaPill({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-bold text-slate-500 shadow-sm">
      <span className="text-blue-600">
        {icon}
      </span>

      {text}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-[10px] font-bold text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-[10px] font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[9px] font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

/* ============================================================================
 * LOADING / ERROR
 * ========================================================================== */

function ReviewLoadingState() {
  return (
    <main className="min-h-screen bg-[#f7faff]">
      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 md:px-8">
        <div className="animate-pulse">
          <div className="h-10 w-44 rounded-xl bg-slate-200" />

          <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-8">
            <div className="h-5 w-40 rounded-lg bg-slate-100" />

            <div className="mt-5 h-12 max-w-xl rounded-xl bg-slate-100" />

            <div className="mt-4 h-5 max-w-2xl rounded-lg bg-slate-100" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="h-[360px] rounded-[26px] border border-slate-200 bg-white lg:col-span-8" />

            <div className="h-[300px] rounded-[26px] border border-slate-200 bg-white lg:col-span-4" />
          </div>
        </div>
      </div>
    </main>
  );
}

function ReviewFatalError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faff] px-4">
      <div className="w-full max-w-xl rounded-[28px] border border-rose-200 bg-white p-7 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <TriangleAlert size={23} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          We couldn’t open this grant.
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <RefreshCcw size={15} />
            Try again
          </button>

          <Link
            href="/pro/grants/new"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Back to grants
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ============================================================================
 * FORMATTERS
 * ========================================================================== */

function formatFileSize(
  bytes: number | null
): string {
  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
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
  value: string
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

function formatCurrency(
  value: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

function humanizeEnum(
  value: string
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function truncate(
  value: string,
  length: number
): string {
  if (
    value.length <= length
  ) {
    return value;
  }

  return `${value.slice(
    0,
    length
  )}…`;
}

function toEditableValue(
  value: unknown
): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return formatUnknownValue(value);
}

function normalizeFieldInput(
  fieldKey: string,
  value: string
): unknown {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if ([
    "optionCount",
    "vestingDurationMonths",
    "cliffMonths",
    "postTerminationExerciseDays",
  ].includes(fieldKey)) {
    return Number.parseInt(trimmed, 10);
  }

  if (fieldKey === "strikePrice") {
    return Number.parseFloat(trimmed);
  }

  return trimmed;
}

function formatUnknownValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not identified";
  }

  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(
      value
    );
  } catch {
    return "Unable to display value";
  }
}