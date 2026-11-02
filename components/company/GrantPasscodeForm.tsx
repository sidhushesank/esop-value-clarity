"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function GrantPasscodeForm({ token }: { token: string }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !passcode) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/grant/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        router.refresh();
        return;
      }
      setError(json?.message ?? "Could not unlock this page.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label className="block text-xs font-bold text-slate-500" htmlFor="passcode">
        Passcode
      </label>
      <input
        id="passcode"
        type="password"
        autoComplete="off"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !passcode}
        className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {busy ? "Checking..." : "View my grant"}
      </button>
    </form>
  );
}
