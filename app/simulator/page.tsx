"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SimulatorPage() {
  const router = useRouter();

  const [esops, setEsops] = useState(0);
  const [vested, setVested] = useState(100);
  const [valuation, setValuation] = useState(0);
  const [dilution, setDilution] = useState(0);
  const [exitValuation, setExitValuation] = useState(0);

  const vestedShares = (esops * vested) / 100;
  const valueToday = (vestedShares / 1_000_000) * valuation;
  const afterDilution = valueToday * (1 - dilution / 100);
  const exitValue =
    (vestedShares / 1_000_000) * exitValuation * (1 - dilution / 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            ESOP Value Simulator
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Estimate the real value of your ESOPs across vesting, dilution,
            and exit scenarios using transparent assumptions.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Inputs */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>ESOP Inputs</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <Label>ESOPs Granted</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  onChange={(e) => setEsops(+e.target.value || 0)}
                />
              </div>

              <div>
                <Label>Vested %</Label>
                <Input
                  type="number"
                  placeholder="e.g. 75"
                  onChange={(e) => setVested(+e.target.value || 0)}
                />
              </div>

              <Separator />

              <div>
                <Label>Current Company Valuation (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50,00,00,000"
                  onChange={(e) => setValuation(+e.target.value || 0)}
                />
              </div>

              <div>
                <Label>Dilution % (Future Rounds)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  onChange={(e) => setDilution(+e.target.value || 0)}
                />
              </div>

              <div>
                <Label>Exit Valuation (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 300,00,00,000"
                  onChange={(e) => setExitValuation(+e.target.value || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Estimated ESOP Value</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Value Tiles */}
              <div className="grid md:grid-cols-3 gap-4">
                <ValueBox label="Value Today" value={valueToday} />
                <ValueBox label="After Dilution" value={afterDilution} />
                <ValueBox label="At Exit" value={exitValue} highlight />
              </div>

              <Separator />

              {/* Assumptions */}
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-medium text-slate-700">
                  Assumptions
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Total shares assumed: 1,000,000</li>
                  <li>Linear dilution applied</li>
                  <li>No tax implications included</li>
                  <li>Illustrative estimates only</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --- Helper component --- */

function ValueBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white"
      }`}
    >
      <p
        className={`text-sm ${
          highlight ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1">
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
