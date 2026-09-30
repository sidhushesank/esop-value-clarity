"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  CheckCircle2,
  Download,
  History,
  Search,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

import HistoryHeader from "@/components/history/HistoryHeader";
import HistoryCard from "@/components/history/HistoryCard";
import EmptyHistory from "@/components/history/EmptyHistory";
import Footer from "@/components/sections/Footer";

interface Calculation {
  id: string;
  esopsGranted: number;
  vestedPercentage: number;
  currentValuation: number;
  dilutionPercentage: number;
  exitValuation: number;
  vestedShares: number;
  valueToday: number;
  afterDilution: number;
  exitValue: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type HistoryFilter = "all" | "today" | "7days" | "30days";
type HistorySort = "newest" | "oldest" | "highest" | "lowest";

const filterOptions: Array<{ value: HistoryFilter; label: string }> = [
  { value: "all", label: "All scenarios" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
];

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function HistoryPage() {
  const router = useRouter();

  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sortBy, setSortBy] = useState<HistorySort>("newest");

  useEffect(() => {
    fetchCalculations();
  }, []);

  async function fetchCalculations() {
    try {
      // Check login
      const authResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setUser(authData.user);
      } else {
        setUser(null);
      }

      // Fetch calculations
      const response = await fetch("/api/calculator", {
        credentials: "include",
      });

      if (!response.ok) {
        setCalculations([]);
        return;
      }

      const data = await response.json();
      setCalculations(data.calculations ?? []);
    } catch (error) {
      console.error(error);
      setCalculations([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    setCalculations((prev) =>
      prev.filter((calculation) => calculation.id !== id)
    );
  }

  const filteredCalculations = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const now = new Date();

    return calculations
      .filter((calculation) => {
        const created = new Date(calculation.createdAt);

        const searchableText = [
          calculation.esopsGranted,
          calculation.vestedPercentage,
          calculation.currentValuation,
          calculation.dilutionPercentage,
          calculation.exitValuation,
          calculation.vestedShares,
          calculation.valueToday,
          calculation.afterDilution,
          calculation.exitValue,
          created.toLocaleDateString("en-IN"),
          created.toISOString(),
        ]
          .join(" ")
          .toLowerCase();

        if (searchText && !searchableText.includes(searchText)) {
          return false;
        }

        if (filter === "all") return true;

        if (filter === "today") {
          return created.toDateString() === now.toDateString();
        }

        const ageInDays =
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        return filter === "7days" ? ageInDays <= 7 : ageInDays <= 30;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return (
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
            );

          case "highest":
            return b.exitValue - a.exitValue;

          case "lowest":
            return a.exitValue - b.exitValue;

          default:
            return (
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
            );
        }
      });
  }, [calculations, filter, search, sortBy]);

  const summary = useMemo(() => {
    const totalValueToday = calculations.reduce(
      (total, calculation) => total + calculation.valueToday,
      0
    );

    const highestExitValue = calculations.reduce(
      (highest, calculation) => Math.max(highest, calculation.exitValue),
      0
    );

    const averageVested = calculations.length
      ? calculations.reduce(
          (total, calculation) => total + calculation.vestedPercentage,
          0
        ) / calculations.length
      : 0;

    return {
      totalValueToday,
      highestExitValue,
      averageVested,
    };
  }, [calculations]);

  async function exportCSV() {
    if (filteredCalculations.length === 0 || exporting) return;

    setExporting(true);

    try {
      // The server owns the final export format and re-checks ownership
      // before returning any saved calculation data.
      const params = new URLSearchParams({
        ids: filteredCalculations
          .map((calculation) => calculation.id)
          .join(","),
        sort: sortBy,
      });

      const response = await fetch(
        `/api/calculator/export?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to export calculation history.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i);

      const filename =
        filenameMatch?.[1] ||
        `esop-value-clarity-scenario-ledger-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      link.setAttribute("aria-hidden", "true");
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("History export failed:", error);
      alert("Unable to export calculation history right now.");
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setSortBy("newest");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-8 md:py-10">
          <HistoryHeader />

          <div className="mt-8 rounded-[26px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              Loading your saved scenarios...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div>
      <main className="relative min-h-screen bg-[#f6f8fb] text-slate-950">
        <div
          className={`transition-all duration-500 ${
            !user
              ? "pointer-events-none select-none blur-[2px] opacity-50"
              : ""
          }`}
        >
          <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
                  ESOP Value Clarity
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  Your employee equity workspace · History
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Private scenario ledger
              </div>
            </div>

            <HistoryHeader />

            <section
              aria-label="History summary"
              className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                label="Scenarios saved"
                value={calculations.length.toLocaleString("en-IN")}
                caption="Your saved calculation record"
                icon={<History className="h-5 w-5" />}
                tone="violet"
              />

              <SummaryCard
                label="Value today"
                value={
                  calculations.length
                    ? formatMoney(summary.totalValueToday)
                    : "—"
                }
                caption="Combined current modeled value"
                icon={<TrendingUp className="h-5 w-5" />}
                tone="blue"
              />

              <SummaryCard
                label="Highest modeled exit"
                value={
                  calculations.length
                    ? formatMoney(summary.highestExitValue)
                    : "—"
                }
                caption="Largest saved exit scenario"
                icon={<ArrowDownUp className="h-5 w-5" />}
                tone="emerald"
              />

              <SummaryCard
                label="Average vested"
                value={
                  calculations.length
                    ? `${summary.averageVested.toFixed(1)}%`
                    : "—"
                }
                caption="Across saved calculations"
                icon={<ShieldCheck className="h-5 w-5" />}
                tone="slate"
              />
            </section>

            <section className="mt-8 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                    Filter your record
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    Find the scenario you want to revisit
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={clearFilters}
                    disabled={
                      !search && filter === "all" && sortBy === "newest"
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>

                  <button
                    onClick={exportCSV}
                    disabled={filteredCalculations.length === 0 || exporting}
                    aria-label={`Export ${filteredCalculations.length} visible scenarios as CSV`}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0b1024] px-5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? "Preparing CSV..." : "Export CSV"}
                  </button>

                  <label className="sr-only" htmlFor="history-sort">
                    Sort saved calculations
                  </label>

                  <select
                    id="history-sort"
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value as HistorySort)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="highest">Highest exit value</option>
                    <option value="lowest">Lowest exit value</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
                <label className="relative block w-full lg:max-w-md">
                  <span className="sr-only">Search saved calculations</span>

                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    placeholder="Search value, ESOP count or date..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      aria-pressed={filter === option.value}
                      className={`rounded-full px-4 py-2.5 text-xs font-black transition ${
                        filter === option.value
                          ? "bg-violet-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="h-2 w-2 rounded-full bg-violet-500" />

                Showing{" "}
                <span className="font-black text-slate-950">
                  {filteredCalculations.length}
                </span>{" "}
                of {calculations.length} saved scenario
                {calculations.length !== 1 ? "s" : ""}
              </div>

              <p className="text-xs font-bold text-slate-400">
                Export uses the current search, filter and sort selection.
              </p>
            </div>

            <div className="mt-4">
              {filteredCalculations.length === 0 ? (
                calculations.length === 0 ? (
                  <EmptyHistory />
                ) : (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                    <Search className="mx-auto h-10 w-10 text-slate-300" />

                    <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                      No matching scenarios
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Try another search or reset the filters to see your saved
                      calculation history.
                    </p>

                    <button
                      onClick={clearFilters}
                      className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                    >
                      Reset filters
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-5">
                  {filteredCalculations.map((calculation) => (
                    <HistoryCard
                      key={calculation.id}
                      id={calculation.id}
                      esopsGranted={calculation.esopsGranted}
                      vestedPercentage={calculation.vestedPercentage}
                      currentValuation={calculation.currentValuation}
                      dilutionPercentage={calculation.dilutionPercentage}
                      exitValuation={calculation.exitValuation}
                      vestedShares={calculation.vestedShares}
                      valueToday={calculation.valueToday}
                      afterDilution={calculation.afterDilution}
                      exitValue={calculation.exitValue}
                      createdAt={calculation.createdAt}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!user && (
          <div className="absolute inset-x-0 top-0 z-40 flex h-screen items-center justify-center bg-[#f6f8fb]/70 px-5 py-10 backdrop-blur-[3px] md:px-8 md:py-12">
            <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <div className="bg-[#0b1024] px-6 py-8 text-white md:px-10 md:py-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/25">
                    <ShieldCheck className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                      History access
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                      Keep your equity decisions reviewable.
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                      Create a free account to save simulations, revisit
                      assumptions and export your personal scenario record
                      whenever you need it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-7 md:px-10 md:py-8">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Save your calculation history",
                    "Revisit every assumption",
                    "Export a clean CSV record",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex gap-2 text-sm font-bold leading-5 text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => router.push("/signup")}
                    className="flex-1 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-700"
                  >
                    Create a free account
                  </button>

                  <button
                    onClick={() => router.push("/login")}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Sign in to continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  tone: "violet" | "blue" | "emerald" | "slate";
}) {
  const iconTone =
    tone === "violet"
      ? "bg-violet-50 text-violet-700 ring-violet-100"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-2xl p-3 ring-1 ${iconTone}`}>{icon}</div>

        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
          Workspace view
        </span>
      </div>

      <p className="mt-5 text-xs font-bold text-slate-500">{label}</p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">{caption}</p>
    </div>
  );
}