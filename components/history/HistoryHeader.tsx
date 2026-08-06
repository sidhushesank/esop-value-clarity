"use client";

import { History } from "lucide-react";

export default function HistoryHeader() {
  return (
    <div className="flex items-center justify-between">

      <div>

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">

            <History className="h-6 w-6" />

          </div>

          <div>

            <h1 className="text-3xl font-bold tracking-tight">
              Calculation History
            </h1>

            <p className="mt-1 text-slate-500">
              View every ESOP calculation you've saved.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}