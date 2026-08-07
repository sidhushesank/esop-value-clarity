"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import EquityGrowthChart from "@/components/history/EquityGrowthChart";

import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  CalendarDays,
  BadgeIndianRupee,
  Percent,
  Rocket,
  Coins,
  TrendingUp,
  Sparkles,
  Building2,
  BarChart3,
} from "lucide-react";

interface Calculation {
  id: string;
  esopsGranted: number;
  vestedPercentage: number;
  vestedShares: number;
  currentValuation: number;
  dilutionPercentage: number;
  exitValuation: number;
  valueToday: number;
  afterDilution: number;
  exitValue: number;
  createdAt: string;
}

export default function CalculationDetailsPage() {
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [calculation, setCalculation] = useState<Calculation | null>(null);

  useEffect(() => {
    fetchCalculation();
  }, []);

  async function fetchCalculation() {
    try {
      const response = await fetch(`/api/calculator/${params.id}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setCalculation(data.calculation);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50">
        <h2 className="text-2xl font-bold">Calculation not found</h2>

        <Link href="/history">
          <Button>Back to History</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link href="/history">
          <Button variant="outline" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
        </Link>

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-10 text-white shadow-xl">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                ESOP Calculation
              </h1>

              <div className="mt-5 flex items-center gap-3 text-slate-300">
                <CalendarDays className="h-5 w-5" />
                {new Date(calculation.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="rounded-full bg-emerald-500/20 px-6 py-3 font-semibold text-emerald-300">
              Saved Scenario
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            title="Current Value"
            value={calculation.valueToday}
            icon={<BadgeIndianRupee className="h-7 w-7" />}
            color="blue"
          />

          <KpiCard
            title="After Dilution"
            value={calculation.afterDilution}
            icon={<Percent className="h-7 w-7" />}
            color="amber"
          />

          <KpiCard
            title="Estimated Exit"
            value={calculation.exitValue}
            icon={<Rocket className="h-7 w-7" />}
            color="emerald"
          />
        </div>

        <EquityGrowthChart
          currentValue={calculation.valueToday}
          afterDilution={calculation.afterDilution}
          exitValue={calculation.exitValue}
        />

        {/* MAIN GRID */}
        <div className="mt-8 grid gap-8 xl:grid-cols-3">
          {/* LEFT */}
          <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <BarChart3 className="h-7 w-7 text-slate-700" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Calculation Inputs</h2>
                <p className="mt-1 text-slate-500">
                  Values used for this calculation
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <InfoRow
                icon={<Coins className="h-5 w-5" />}
                label="ESOPs Granted"
                value={calculation.esopsGranted.toLocaleString()}
              />

              <InfoRow
                icon={<TrendingUp className="h-5 w-5" />}
                label="Vested Percentage"
                value={`${calculation.vestedPercentage}%`}
              />

              <InfoRow
                icon={<Sparkles className="h-5 w-5" />}
                label="Vested Shares"
                value={calculation.vestedShares.toLocaleString()}
              />

              <InfoRow
                icon={<Building2 className="h-5 w-5" />}
                label="Current Valuation"
                value={`₹${calculation.currentValuation.toLocaleString("en-IN")}`}
              />
              <InfoRow
                icon={<Percent className="h-5 w-5" />}
                label="Dilution Percentage"
                value={`${calculation.dilutionPercentage}%`}
              />

              <InfoRow
                icon={<Rocket className="h-5 w-5" />}
                label="Exit Valuation"
                value={`₹${calculation.exitValuation.toLocaleString("en-IN")}`}
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Estimated Wealth
              </p>

              <h2 className="mt-4 break-all text-5xl font-extrabold leading-tight">
                ₹{calculation.exitValue.toLocaleString("en-IN")}
              </h2>

              <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full bg-emerald-400" />
              </div>

              <p className="mt-5 text-sm text-slate-300">
                Based on your assumptions and vesting details.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold">Quick Summary</h2>

              <div className="mt-6 space-y-5">
                <SummaryRow
                  label="Current Value"
                  value={`₹${calculation.valueToday.toLocaleString("en-IN")}`}
                />

                <SummaryRow
                  label="After Dilution"
                  value={`₹${calculation.afterDilution.toLocaleString("en-IN")}`}
                />

                <SummaryRow
                  label="Exit Value"
                  value={`₹${calculation.exitValue.toLocaleString("en-IN")}`}
                />

                <SummaryRow
                  label="Vested Shares"
                  value={calculation.vestedShares.toLocaleString()}
                />

                <SummaryRow
                  label="Created On"
                  value={new Date(calculation.createdAt).toLocaleDateString(
                    "en-IN"
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================================================
   KPI CARD
======================================================= */

function KpiCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: "blue" | "amber" | "emerald";
}) {
  const gradients = {
    blue: "from-blue-600 via-indigo-600 to-violet-700",
    amber: "from-amber-400 via-orange-500 to-orange-600",
    emerald: "from-emerald-500 via-teal-600 to-cyan-700",
  };

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${gradients[color]} p-7 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/80">{title}</p>

          <h2 className="mt-3 break-all text-4xl font-extrabold">
            ₹{value.toLocaleString("en-IN")}
          </h2>
        </div>

        <div className="rounded-2xl bg-white/20 p-4 backdrop-blur">{icon}</div>
      </div>
    </div>
  );
}

/* =======================================================
   INFO ROW
======================================================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition-all hover:border-blue-200 hover:bg-blue-50">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          {icon}
        </div>

        <span className="font-medium text-slate-600">{label}</span>
      </div>

      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

/* =======================================================
   SUMMARY ROW
======================================================= */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-none last:pb-0">
      <span className="text-slate-500">{label}</span>

      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}