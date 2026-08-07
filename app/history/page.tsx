"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, RotateCcw } from "lucide-react";

import HistoryHeader from "@/components/history/HistoryHeader";
import HistoryCard from "@/components/history/HistoryCard";
import EmptyHistory from "@/components/history/EmptyHistory";

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

export default function HistoryPage() {
  const router = useRouter();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "today" | "7days" | "30days"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");

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

  // ===========================
  // DERIVED STATE
  // ===========================
  const filteredCalculations = calculations
    .filter((calculation) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        calculation.esopsGranted.toString().includes(searchText) ||
        calculation.vestedPercentage.toString().includes(searchText) ||
        calculation.currentValuation.toString().includes(searchText) ||
        calculation.exitValuation.toString().includes(searchText) ||
        calculation.exitValue.toString().includes(searchText) ||
        calculation.valueToday.toString().includes(searchText) ||
        new Date(calculation.createdAt)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchText);

      if (!matchesSearch) return false;

      if (filter === "all") return true;

      const created = new Date(calculation.createdAt);
      const now = new Date();

      if (filter === "today") {
        return created.toDateString() === now.toDateString();
      }

      const diff =
        (now.getTime() - created.getTime()) /
        (1000 * 60 * 60 * 24);

      if (filter === "7days") return diff <= 7;

      if (filter === "30days") return diff <= 30;

      return true;
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

  // ===========================
  // UTILITIES
  // ===========================
  function exportCSV() {
    if (filteredCalculations.length === 0) return;

    const rows = [
      [
        "Date",
        "ESOPs Granted",
        "Vested %",
        "Current Valuation",
        "Exit Valuation",
        "Value Today",
        "Exit Value",
      ],
    ];

    filteredCalculations.forEach((c) => {
      rows.push([
        new Date(c.createdAt).toLocaleDateString(),
        c.esopsGranted.toString(),
        `${c.vestedPercentage}%`,
        c.currentValuation.toString(),
        c.exitValuation.toString(),
        c.valueToday.toString(),
        c.exitValue.toString(),
      ]);
    });

    const csv = rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "esop-history.csv";

    link.click();

    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
    setSortBy("newest");
  }

  // ===========================
  // LOADING STATE
  // ===========================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <HistoryHeader />
          <div className="mt-12 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* ===========================
            HISTORY CONTENT
      =========================== */}
      <div
        className={`mx-auto max-w-7xl px-6 py-12 transition-all duration-500 ${
          !user ? "pointer-events-none blur-md select-none opacity-40" : ""
        }`}
      >
        <HistoryHeader />

        <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search calculations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["today", "Today"],
              ["7days", "Last 7 Days"],
              ["30days", "Last 30 Days"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Clear
            </button>

            <button
              onClick={exportCSV}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#0A2540] px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Download size={16} />
              Export CSV
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Exit Value</option>
              <option value="lowest">Lowest Exit Value</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredCalculations.length}
            </span>{" "}
            calculation{filteredCalculations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-10">
          {filteredCalculations.length === 0 ? (
            calculations.length === 0 ? (
              <EmptyHistory />
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-24 text-center">
                <Search size={42} className="mx-auto text-slate-300" />

                <h3 className="mt-5 text-2xl font-semibold text-slate-900">
                  No matching calculations
                </h3>

                <p className="mt-2 text-slate-500">
                  Try another search or clear your filters.
                </p>

                <button
                  onClick={clearFilters}
                  className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              </div>
            )
          ) : (
            <div className="space-y-6">
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

      {/* ===========================
            GUEST LOCK OVERLAY
      =========================== */}
      {!user && (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-white/30 pt-[10vh] md:pt-[15vh] px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[480px] rounded-[24px] border border-slate-200 bg-white p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center text-center">
            {/* Lock Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A2540] shadow-sm ring-4 ring-slate-50">
              <span className="text-xl">🔒</span>
            </div>

            {/* Pill */}
            <span className="mt-6 rounded-full bg-slate-100 px-3.5 py-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
              History Locked
            </span>

            {/* Heading */}
            <h2 className="mt-5 text-[26px] md:text-3xl font-bold tracking-tight text-slate-900">
              Save Your ESOP Journey
            </h2>

            <p className="mt-3 text-[15px] text-slate-500 leading-relaxed max-w-[90%]">
              Sign up for free to save every ESOP simulation, revisit previous
              calculations, and monitor your equity journey over time.
            </p>

            {/* Features */}
            <div className="mt-8 flex w-full flex-col items-start space-y-4 px-2 md:px-6">
              {[
                "Unlimited calculation history",
                "Revisit previous simulations",
                "Track ESOP growth over time",
                "Future premium insights",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <svg
                    className="h-[18px] w-[18px] shrink-0 text-slate-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[15px] font-medium text-slate-700">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-10 w-full space-y-3">
              <button
                onClick={() => router.push("/signup")}
                className="group flex h-12 w-full items-center justify-center rounded-xl bg-[#0A2540] text-[15px] font-medium text-white transition-all hover:bg-slate-800 shadow-sm"
              >
                Create Free Account
                <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>

              <button
                onClick={() => router.push("/login")}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              >
                Already have an account?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}