"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";

import { BTN_DARK, BTN_LIGHT, fmtDate, readJson } from "@/components/company/ui";
import { useJurisdiction } from "@/components/company/JurisdictionContext";

const MAX_BYTES = 10 * 1024 * 1024;

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Founder uploads the signed grant letter (prepared by their CS or lawyer).
 * The employee downloads it from their grant page.
 */
export default function GrantLetterCard({
  grantId,
  fileName,
  fileSize,
  uploadedAt,
  downloadedAt,
  downloadCount,
  onChanged,
}: {
  grantId: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  downloadedAt: string | null;
  downloadCount: number;
  onChanged: () => void;
}) {
  const us = useJurisdiction() === "US";
  const doc = us ? "grant agreement" : "grant letter";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"" | "upload" | "delete">("");
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.type !== "application/pdf") return setError("Choose a PDF file.");
    if (file.size > MAX_BYTES) return setError("The PDF must be 10 MB or smaller.");

    setBusy("upload");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/company/grants/${grantId}/letter`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? `We could not upload the ${doc}.`);
      onChanged();
    } catch {
      setError(`We could not upload the ${doc}. Please retry.`);
    } finally {
      setBusy("");
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm(`Remove the uploaded ${doc}? The employee will no longer be able to download it.`)) return;
    setBusy("delete");
    setError("");
    try {
      const res = await fetch(`/api/company/grants/${grantId}/letter`, { method: "DELETE", credentials: "include" });
      const json = await readJson(res);
      if (!res.ok || !json?.success) return setError(json?.message ?? `We could not remove the ${doc}.`);
      onChanged();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm">
            <FileUp size={18} />
          </span>
          <div>
            <h4 className="text-sm font-black">{us ? "Grant agreement" : "Grant letter"}</h4>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Upload the signed {doc} your {us ? "lawyer" : "CS or lawyer"} prepared (PDF, up to 10 MB). The employee
              can download it from their grant page. Stored privately.
            </p>
          </div>
        </div>

        <input
          ref={input}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <button type="button" className={BTN_DARK} disabled={!!busy} onClick={() => input.current?.click()}>
          {busy === "upload" ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          {fileName ? "Replace PDF" : "Upload PDF"}
        </button>
      </div>

      {fileName ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">{fileName}</span>
            {fileSize ? ` · ${fmtSize(fileSize)}` : ""} · uploaded {fmtDate(uploadedAt)} ·{" "}
            {downloadCount > 0
              ? `downloaded by the employee ${downloadCount} time${downloadCount === 1 ? "" : "s"} (first on ${fmtDate(downloadedAt)})`
              : "not downloaded by the employee yet"}
          </p>
          <div className="flex gap-2">
            <a href={`/api/company/grants/${grantId}/letter`} className={BTN_LIGHT}>
              <Download size={14} /> Download
            </a>
            <button type="button" className={BTN_LIGHT} disabled={!!busy} onClick={() => void remove()}>
              {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No {doc} uploaded yet.</p>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
