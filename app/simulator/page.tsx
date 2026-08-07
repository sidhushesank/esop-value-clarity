"use client";

import { useEffect, useState } from "react";
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestUsage, setGuestUsage] = useState({
    used: 0,
    remaining: 3,
    limitReached: false,
  });
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const authRes = await fetch("/api/auth/me", {
          credentials: "include",
        });

        const authData = await authRes.json();

        if (authData.success) {
          setIsLoggedIn(true);
          return;
        }

        const guestRes = await fetch("/api/guest/status", {
          credentials: "include",
        });

        const guestData = await guestRes.json();

        if (guestData.success) {
          setGuestUsage({
            used: guestData.used,
            remaining: guestData.remaining,
            limitReached: guestData.limitReached,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, []);

  async function handleCalculate() {
    try {
      setLoading(true);
      setMessage("");

      const endpoint = isLoggedIn
        ? "/api/calculator"
        : "/api/guest/calculate";

      const response = await fetch(endpoint, {
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
        if (data.limitReached) {
          setGuestUsage((prev) => ({
            ...prev,
            limitReached: true,
            remaining: 0,
          }));

          setMessage("");
          return;
        }

        setMessage(data.message || "Unable to calculate.");
        return;
      }

      if (!isLoggedIn) {
        setGuestUsage((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: data.remaining,
        }));
      }

      const calculation = data.calculation ?? data;

      setResult(calculation);

      setMessage(
        isLoggedIn
          ? "Calculation saved successfully."
          : "Calculation completed successfully."
      );
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative mx-auto max-w-7xl px-5 py-6 md:px-6 md:py-10">
        <div
          className={`space-y-6 md:space-y-8 transition-all duration-300 ${
            guestUsage.limitReached
              ? "pointer-events-none blur-md select-none"
              : ""
          }`}
        >
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
              Estimate the value of your ESOPs using vesting, dilution and future
              valuation assumptions.
            </p>
          </div>

          {/* Guest Banner */}
          {!checkingAccess && !isLoggedIn && (
            <div
              className={`mt-6 rounded-2xl border p-5 transition-all ${
                guestUsage.limitReached
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      guestUsage.limitReached
                        ? "text-red-900"
                        : "text-amber-900"
                    }`}
                  >
                    Guest Access
                  </p>

                  {guestUsage.limitReached ? (
                    <>
                      <p className="mt-1 text-sm text-red-700">
                        You've used all 3 complimentary simulations.
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        Create a free account to unlock unlimited ESOP
                        simulations, history and dashboard.
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-amber-700">
                      {guestUsage.remaining} of 3 complimentary
                      simulations remaining
                    </p>
                  )}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    guestUsage.limitReached
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {guestUsage.used}/3 Used
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className={`h-full transition-all duration-500 ${
                    guestUsage.limitReached
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (guestUsage.used / 3) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg md:text-xl">ESOP Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>ESOPs Granted</Label>
                  <Input
                    className="mt-2 h-11"
                    type="number"
                    value={esops}
                    onChange={(e) => setEsops(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Vested %</Label>
                  <Input
                    className="mt-2 h-11"
                    type="number"
                    value={vested}
                    onChange={(e) => setVested(Number(e.target.value))}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Current Company Valuation (₹)</Label>
                  <Input
                    className="mt-2 h-11"
                    type="number"
                    value={valuation}
                    onChange={(e) => setValuation(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Dilution %</Label>
                  <Input
                    className="mt-2 h-11"
                    type="number"
                    value={dilution}
                    onChange={(e) => setDilution(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Exit Valuation (₹)</Label>
                  <Input
                    className="mt-2 h-11"
                    type="number"
                    value={exitValuation}
                    onChange={(e) => setExitValuation(Number(e.target.value))}
                  />
                </div>

                <Button
                  onClick={handleCalculate}
                  disabled={loading || (!isLoggedIn && guestUsage.limitReached)}
                  className="h-11 w-full"
                >
                  {loading
                    ? "Calculating..."
                    : !isLoggedIn && guestUsage.limitReached
                    ? "Complimentary Limit Reached"
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
                  <p className="mb-3 font-semibold">Assumptions</p>
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

        {guestUsage.limitReached && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-2xl p-10 shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white text-3xl">
                🔒
              </div>

              <h2 className="mt-6 text-center text-3xl font-bold">
                Unlock ESOP Value Clarity
              </h2>

              <p className="mt-3 text-center text-slate-600">
                You've used all 3 complimentary simulations.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span>Unlimited ESOP simulations</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span>Simulation history</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span>Dashboard analytics</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>✓</span>
                  <span>Future premium features</span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/signup")}
                className="mt-8 h-12 w-full rounded-xl"
              >
                Create Free Account
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="mt-3 h-12 w-full rounded-xl"
              >
                Already have an account?
              </Button>
            </div>
          </div>
        )}
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
          highlight ? "text-slate-300" : "text-slate-500"
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