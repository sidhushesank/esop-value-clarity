"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Button } from "@/components/ui/button";

export default function SimulatorPage() {
  const router = useRouter();

  const [esops, setEsops] = useState(0);
  const [vested, setVested] = useState(100);
  const [valuation, setValuation] = useState(0);
  const [dilution, setDilution] = useState(0);
  const [exitValuation, setExitValuation] = useState(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [result, setResult] = useState<{
    vestedShares: number;
    valueToday: number;
    afterDilution: number;
    exitValue: number;
  } | null>(null);

  async function handleCalculate() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          esopsGranted: esops,
          vestedPercentage: vested,
          currentValuation: valuation,
          dilutionPercentage: dilution,
          exitValuation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to calculate.");
        return;
      }

      setResult(data.calculation);
      setMessage("Calculation saved successfully.");

    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-5 py-6 md:px-6 md:py-10 space-y-6 md:space-y-8">

        {/* Back */}

        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Back
        </button>

        {/* Heading */}

        <div>

          <h1 className="text-2xl md:text-3xl font-bold">
            ESOP Value Simulator
          </h1>

          <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-600 leading-6">
            Estimate the value of your ESOPs using vesting,
            dilution and future valuation assumptions.
          </p>

        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT */}

          <Card>

            <CardHeader className="pb-4">

              <CardTitle className="text-lg md:text-xl">
                ESOP Inputs
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-5">

              <div>

                <Label>
                  ESOPs Granted
                </Label>

                <Input
                  className="mt-2 h-11"
                  type="number"
                  value={esops}
                  onChange={(e) =>
                    setEsops(Number(e.target.value))
                  }
                />

              </div>

              <div>

                <Label>
                  Vested %
                </Label>

                <Input
                  className="mt-2 h-11"
                  type="number"
                  value={vested}
                  onChange={(e) =>
                    setVested(Number(e.target.value))
                  }
                />

              </div>

              <Separator />

              <div>

                <Label>
                  Current Company Valuation (₹)
                </Label>

                <Input
                  className="mt-2 h-11"
                  type="number"
                  value={valuation}
                  onChange={(e) =>
                    setValuation(Number(e.target.value))
                  }
                />

              </div>

              <div>

                <Label>
                  Dilution %
                </Label>

                <Input
                  className="mt-2 h-11"
                  type="number"
                  value={dilution}
                  onChange={(e) =>
                    setDilution(Number(e.target.value))
                  }
                />

              </div>

              <div>

                <Label>
                  Exit Valuation (₹)
                </Label>

                <Input
                  className="mt-2 h-11"
                  type="number"
                  value={exitValuation}
                  onChange={(e) =>
                    setExitValuation(Number(e.target.value))
                  }
                />

              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="h-11 w-full"
              >
                {loading
                  ? "Calculating..."
                  : "Calculate ESOP Value"}
              </Button>

              {message && (

                <div
                  className={`rounded-lg border p-3 text-center text-sm ${
                    message.includes("successfully")
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>

              )}

            </CardContent>

          </Card>

          {/* RIGHT */}

          <Card className="lg:col-span-2">

            <CardHeader>

              <CardTitle className="text-lg md:text-xl">
                Estimated ESOP Value
              </CardTitle>

            </CardHeader>

            <CardContent className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                <ValueBox
                  label="Value Today"
                  value={result?.valueToday ?? 0}
                />

                <ValueBox
                  label="After Dilution"
                  value={result?.afterDilution ?? 0}
                />

                <ValueBox
                  label="At Exit"
                  value={result?.exitValue ?? 0}
                  highlight
                />

              </div>

              <Separator />

              <div className="text-sm text-slate-600">

                <p className="mb-3 font-semibold">
                  Assumptions
                </p>

                <ul className="ml-5 list-disc space-y-2">

                  <li>Total shares assumed: 1,000,000</li>

                  <li>Linear dilution applied</li>

                  <li>No taxation included</li>

                  <li>Illustrative purposes only</li>

                </ul>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  );
}
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
      className={`rounded-2xl border p-5 md:p-6 transition-all duration-300 hover:shadow-md ${
        highlight
          ? "border-slate-900 bg-slate-900 text-white"
          : "bg-white"
      }`}
    >
      <p
        className={`text-xs md:text-sm font-medium ${
          highlight
            ? "text-slate-300"
            : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <h2 className="mt-3 break-words text-2xl md:text-3xl font-bold leading-tight">
        ₹{value.toLocaleString("en-IN")}
      </h2>
    </div>
  );
}