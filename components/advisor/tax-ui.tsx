"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export const SURFACE =
  "rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export const INPUT =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50 disabled:text-slate-400";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const COLOUR = {
  red: "#b42318",
  amber: "#d97706",
  blue: "#2563a8",
  green: "#2f855a",
  slate: "#64748b",
};

const inr0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return `₹${inr0.format(Math.round(n))}`;
}

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return inr0.format(n);
}

export function day(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function isoDay(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function daysFrom(asOfIso: string, dueIso: string): number {
  const a = Date.parse(asOfIso.slice(0, 10));
  const b = Date.parse(dueIso.slice(0, 10));
  return Math.round((b - a) / 86_400_000);
}

export function Panel({
  title,
  caption,
  action,
  children,
  className = "",
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${SURFACE} ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {title}
          </h3>
          {caption ? (
            <span className="text-[10px] font-medium text-slate-400">
              {caption}
            </span>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Chip({
  colour,
  children,
}: {
  colour: "red" | "amber" | "blue" | "green" | "slate";
  children: ReactNode;
}) {
  const map = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${map[colour]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] leading-4 text-slate-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className={`relative overflow-hidden px-4 pb-4 pt-3.5 ${SURFACE}`}>
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: accent }}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p>
    </div>
  );
}

export async function callApi(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        ok: false,
        message: data?.message ?? "Something went wrong. Please try again.",
      };
    }

    return { ok: true, message: "" };
  } catch {
    return {
      ok: false,
      message: "We could not connect. Please check your connection and retry.",
    };
  }
}

/* ------------------------------------------------------------------ */
/* In-app confirmation dialog (replaces the browser's confirm box)     */
/* ------------------------------------------------------------------ */

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" colours the confirm button red (deletes, archives). */
  tone?: "danger" | "default";
};

function ConfirmDialog({
  options,
  onResult,
}: {
  options: ConfirmOptions;
  onResult: (ok: boolean) => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = options.tone === "danger";

  useEffect(() => {
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onResult(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onResult]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onResult(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
      >
        <h3 id="confirm-title" className="text-sm font-semibold text-slate-900">
          {options.title}
        </h3>
        <p id="confirm-message" className="mt-2 text-xs leading-5 text-slate-600">
          {options.message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => onResult(false)} className={BTN_GHOST}>
            {options.cancelLabel ?? "Cancel"}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onResult(true)}
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
                : BTN_PRIMARY
            }
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * const { ask, dialog } = useConfirm();
 * if (!(await ask({ title, message }))) return;
 * ...and render {dialog} once inside the component's JSX.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(opts);
    });
  }, []);

  const onResult = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  const dialog = options ? <ConfirmDialog options={options} onResult={onResult} /> : null;

  return { ask, dialog };
}