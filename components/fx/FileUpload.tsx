"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { BTN_DARK, readJson } from "@/components/fx/ui";

/** A file picker plus extra form fields, posting multipart to `url`. */
export default function FileUpload({
  url,
  fields,
  label,
  disabled,
  onDone,
}: {
  url: string;
  fields: Record<string, string>;
  label: string;
  disabled?: boolean;
  onDone: (data: Record<string, unknown>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      for (const [k, v] of Object.entries(fields)) form.append(k, v);
      const res = await fetch(url, { method: "POST", body: form, credentials: "include" });
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        setMsg({ ok: false, text: String(data.message ?? "Upload failed.") });
        return;
      }
      setMsg({ ok: true, text: `Saved ${data.saved} days (${data.from} to ${data.to})${data.skipped ? `, skipped ${data.skipped} unreadable rows` : ""}.` });
      onDone(data);
    } catch {
      setMsg({ ok: false, text: "Could not connect. Please retry." });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <button type="button" className={BTN_DARK} disabled={disabled || busy} onClick={() => ref.current?.click()}>
        <Upload size={14} />
        {busy ? "Uploading..." : label}
      </button>
      {msg && (
        <p className={`mt-2 text-xs font-semibold ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>
      )}
    </div>
  );
}
