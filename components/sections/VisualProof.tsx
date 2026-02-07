"use client"

import { Card } from "@/components/ui/card"

export default function VisualProof() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-semibold text-center mb-4">
          Visualize your ESOP journey
        </h2>
        <p className="text-center text-slate-600 mb-12">
          Simple visuals that explain how equity changes — no spreadsheets.
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Card className="p-6">
            <div className="h-48 rounded-lg bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200 animate-pulse" />
            <p className="text-sm text-slate-500 mt-4">
              Example visualization. Values are illustrative only.
            </p>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">📈 ESOP Value Over Time</Card>
            <Card className="p-5 border-indigo-500">
              📉 Dilution Impact
            </Card>
            <Card className="p-5">🚪 Exit Scenarios</Card>
          </div>
        </div>
      </div>
    </section>
  )
}
