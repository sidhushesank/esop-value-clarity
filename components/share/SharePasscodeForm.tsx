"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SharePasscodeForm({ token }: { token: string }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !passcode) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        router.refresh();
        return;
      }

      setError(json?.message ?? "Could not unlock this report.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium text-gray-700" htmlFor="passcode">
        Passcode
      </label>
      <input
        id="passcode"
        type="password"
        autoComplete="off"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !passcode}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Checking..." : "View report"}
      </button>
    </form>
  );
}