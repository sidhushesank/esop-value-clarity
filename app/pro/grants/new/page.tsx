"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type UploadState =
  | "idle"
  | "selected"
  | "uploading"
  | "success"
  | "error";

type UploadResponse = {
  success: boolean;
  document?: {
    id: string;
    originalFileName: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    status: string;
    createdAt: string;
  };
  code?: string;
  message?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function NewGrantPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedDocumentId, setUploadedDocumentId] =
    useState<string | null>(null);

  const fileSize = useMemo(() => {
    if (!file) return null;

    if (file.size < 1024) {
      return `${file.size} B`;
    }

    if (file.size < 1024 * 1024) {
      return `${(file.size / 1024).toFixed(1)} KB`;
    }

    return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  function resetSelection() {
    setFile(null);
    setState("idle");
    setErrorMessage("");
    setUploadedDocumentId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validateFile(candidate: File): string | null {
    if (candidate.type !== "application/pdf") {
      return "Only PDF grant documents are supported right now.";
    }

    if (candidate.size <= 0) {
      return "The selected PDF is empty.";
    }

    if (candidate.size > MAX_FILE_SIZE) {
      return "Your PDF must be 10 MB or smaller.";
    }

    return null;
  }

  function selectFile(candidate: File) {
    const validationError = validateFile(candidate);

    if (validationError) {
      setFile(null);
      setState("error");
      setErrorMessage(validationError);
      return;
    }

    setFile(candidate);
    setState("selected");
    setErrorMessage("");
    setUploadedDocumentId(null);
  }

  function handleFileInput(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    selectFile(selectedFile);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (state === "uploading") return;

    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (state === "uploading") return;

    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (!droppedFile) return;

    selectFile(droppedFile);
  }

  async function handleUpload() {
    if (!file || state === "uploading") {
      return;
    }

    setState("uploading");
    setErrorMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/pro/grants/upload",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data =
        (await response.json()) as UploadResponse;

      if (!response.ok || !data.success || !data.document) {
        throw new Error(
          data.message ||
            "We could not securely upload your document."
        );
      }

      setUploadedDocumentId(data.document.id);
      setState("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not securely upload your document.";

      setState("error");
      setErrorMessage(message);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-slate-950">
      <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            href="/pro"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft size={15} />
            Back to workspace
          </Link>

          <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:flex">
            <ShieldCheck
              size={14}
              className="text-emerald-500"
            />
            Private Pro workspace
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[34px] border border-blue-100 bg-white shadow-[0_28px_90px_rgba(37,99,235,0.09)]">
          <div className="pointer-events-none absolute -right-36 -top-48 h-[520px] w-[520px] rounded-full bg-blue-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-44 left-[20%] h-[420px] w-[420px] rounded-full bg-cyan-100/70 blur-3xl" />

          <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
            <div className="rounded-[28px] border border-blue-100 bg-white/95 p-6 shadow-[0_18px_55px_rgba(37,99,235,0.05)] backdrop-blur sm:p-8 lg:col-span-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">
                  <Sparkles size={13} />
                  Grant intelligence
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[10px] font-bold text-emerald-700">
                  <LockKeyhole size={12} />
                  Private upload
                </span>
              </div>

              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Create your equity source of truth
              </p>

              <h1 className="mt-3 max-w-xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[3.7rem] lg:leading-[0.98]">
                Add your ESOP grant.
                <span className="mt-2 block bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                  We’ll prepare the details for review.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                Upload the grant letter or option agreement you
                received from your company. ESOP Value Clarity
                will use the document as the starting point for a
                structured equity profile.
              </p>

              <div className="mt-8 space-y-3">
                <ProcessItem
                  number="01"
                  title="Secure document intake"
                  text="Your PDF is stored privately inside your account workspace."
                />

                <ProcessItem
                  number="02"
                  title="Grant terms extracted"
                  text="Key grant, vesting, exercise and expiry details are prepared for review."
                />

                <ProcessItem
                  number="03"
                  title="You stay in control"
                  text="Nothing becomes part of your equity profile until you review and confirm it."
                />
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Info size={16} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Prefer manual entry?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      You can still build the same Pro model
                      manually without uploading a document.
                    </p>

                    <Link
                      href="/pro/simulator"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-blue-600 transition hover:text-blue-700"
                    >
                      Enter details manually
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-[0_18px_55px_rgba(37,99,235,0.06)] backdrop-blur sm:p-6 lg:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">
                      Upload grant document
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      Start from the real source document.
                    </h2>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                      PDF only · Maximum 10 MB · Stored privately
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                    <FileText size={12} />
                    Phase 1
                  </span>
                </div>

                {state !== "success" ? (
                  <>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative mt-7 overflow-hidden rounded-[26px] border transition-all duration-200 ${
                        dragActive
                          ? "border-blue-400 bg-blue-50 shadow-[0_16px_40px_rgba(37,99,235,0.10)]"
                          : state === "error"
                          ? "border-rose-200 bg-rose-50/40"
                          : "border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-50 [background-size:28px_28px] [background-image:linear-gradient(rgba(37,99,235,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.035)_1px,transparent_1px)]" />

                      <div className="relative p-5 sm:p-7">
                        {!file ? (
                          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-[0_12px_30px_rgba(37,99,235,0.10)]">
                              <Upload size={26} />
                            </div>

                            <h3 className="mt-5 text-xl font-black text-slate-950">
                              Drop your ESOP PDF here
                            </h3>

                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                              Or choose the grant letter or option
                              agreement from your computer.
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                            >
                              <Upload size={16} />
                              Choose PDF
                            </button>

                            <p className="mt-4 text-[10px] font-semibold text-slate-400">
                              PDF · Up to 10 MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FileText size={21} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-slate-950">
                                  {file.name}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-400">
                                  <span>{fileSize}</span>
                                  <span>PDF</span>
                                  <span>
                                    Ready for secure upload
                                  </span>
                                </div>
                              </div>

                              {state !== "uploading" && (
                                <button
                                  type="button"
                                  onClick={resetSelection}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Remove selected file"
                                >
                                  <X size={15} />
                                </button>
                              )}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                              <TrustMetric
                                icon={<LockKeyhole size={15} />}
                                label="Private storage"
                                value="Enabled"
                              />

                              <TrustMetric
                                icon={<FileCheck2 size={15} />}
                                label="Format validation"
                                value="PDF verified"
                              />

                              <TrustMetric
                                icon={<ShieldCheck size={15} />}
                                label="Account access"
                                value="Pro protected"
                              />
                            </div>

                            {state === "uploading" && (
                              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  </div>

                                  <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900">
                                      Securing your grant document
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                      Validating and storing the
                                      original PDF inside your private
                                      workspace.
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-blue-100">
                                  <div className="evc-upload-progress h-full w-2/3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                                </div>
                              </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="max-w-md text-[10px] leading-5 text-slate-400">
                                The original document remains separate
                                from any values you later confirm.
                              </p>

                              <button
                                type="button"
                                onClick={handleUpload}
                                disabled={state === "uploading"}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {state === "uploading" ? (
                                  <>
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                    Uploading securely
                                  </>
                                ) : (
                                  <>
                                    Upload grant
                                    <ArrowRight
                                      size={16}
                                      className="transition group-hover:translate-x-0.5"
                                    />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {state === "error" && errorMessage && (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                            <X size={15} />
                          </div>

                          <div>
                            <p className="text-xs font-black text-rose-800">
                              Upload needs attention
                            </p>

                            <p className="mt-1 text-xs leading-5 text-rose-700">
                              {errorMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <SuccessState
                    documentId={uploadedDocumentId}
                    fileName={file?.name ?? "ESOP grant"}
                    onUploadAnother={resetSelection}
                  />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                      What we’ll prepare next
                    </p>

                    <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                      The document becomes structured grant data.
                    </h3>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
                      After secure upload, the next stage will
                      identify important values and clauses for your
                      confirmation.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Review before save
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ExtractionPreview
                    title="Grant"
                    items={[
                      "Option count",
                      "Grant date",
                      "Exercise price",
                    ]}
                  />

                  <ExtractionPreview
                    title="Vesting"
                    items={[
                      "Start date",
                      "Cliff",
                      "Schedule",
                    ]}
                  />

                  <ExtractionPreview
                    title="Exercise"
                    items={[
                      "Expiry date",
                      "Exercise window",
                    ]}
                  />

                  <ExtractionPreview
                    title="Clauses"
                    items={[
                      "Termination",
                      "Forfeiture",
                      "Acceleration",
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[10px] leading-5 text-slate-400 sm:flex-row">
          <span>
            ESOP Value Clarity · Private equity workspace
          </span>

          <span>
            Uploaded documents are used to help structure your
            equity information. Review all extracted terms before
            relying on them.
          </span>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes evc-upload-progress {
          0% {
            transform: translateX(-55%);
          }

          50% {
            transform: translateX(35%);
          }

          100% {
            transform: translateX(115%);
          }
        }

        .evc-upload-progress {
          animation: evc-upload-progress 1.5s ease-in-out
            infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .evc-upload-progress {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function ProcessItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[10px] font-black text-blue-700">
        {number}
      </span>

      <div>
        <p className="text-xs font-black text-slate-950">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function TrustMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ExtractionPreview({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-600">
        {title}
      </p>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 text-[11px] font-semibold text-slate-600"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              <Check size={11} />
            </span>

            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessState({
  documentId,
  fileName,
  onUploadAnother,
}: {
  documentId: string | null;
  fileName: string;
  onUploadAnother: () => void;
}) {
  return (
    <div className="mt-7 overflow-hidden rounded-[26px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/60 to-blue-50/60">
      <div className="p-6 sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]">
          <CheckCircle2 size={25} />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          Secure upload complete
        </p>

        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Your grant document is now inside your private
          workspace.
        </h3>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          <span className="font-bold text-slate-800">
            {fileName}
          </span>{" "}
          has been stored successfully. The next stage will prepare
          the grant terms for review before anything becomes part of
          your confirmed equity profile.
        </p>

        {documentId && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/90 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
              Document reference
            </p>

            <p className="mt-1 break-all font-mono text-[11px] font-semibold text-slate-600">
              {documentId}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {documentId ? (
            <Link
              href={`/pro/grants/${documentId}/review`}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
            >
              Continue to review
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-300 px-5 py-3 text-sm font-black text-white"
            >
              Continue to review
            </button>
          )}

          <button
            type="button"
            onClick={onUploadAnother}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Upload another
          </button>
        </div>
      </div>
    </div>
  );
}