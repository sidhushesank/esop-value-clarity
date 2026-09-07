import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CalendarDays,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import EmptyState from "./EmptyState";

interface Calculation {
  id: string;
  esopsGranted: number;
  valueToday: number;
  exitValue: number;
  createdAt: string;
}

interface RecentCalculationsProps {
  calculations: Calculation[];
}

// This component deliberately has a narrow responsibility:
//
// 1. Show the most recent saved scenarios.
// 2. Keep the activity area useful on small screens.
// 3. Link each row back to the existing history detail route.
//
// It does not change how a calculation is valued and it does not add
// placeholder records when the API returns an empty collection.
//
// Keeping those boundaries explicit makes the visual upgrade safe to adopt
// alongside the existing simulator and Offer Intelligence workflows.

export default function RecentCalculations({
  calculations,
}: RecentCalculationsProps) {

  // The API already returns the saved calculations in the dashboard's
  // preferred order. Keep this component presentation-only and avoid
  // inventing a second source of truth for the user's history.
  const recentCalculations = calculations.slice(0, 5);

  // Financial figures remain right-aligned so the eye can scan the list
  // without confusing the current value with the modeled exit value.
  //
  // The compact row treatment also prevents a single saved calculation from
  // creating the oversized blank block that appeared in the original view.
  //
  // No totals are recomputed here: summary totals belong to DashboardStats,
  // while this area is intentionally focused on activity and navigation.

  // The empty state is deliberately rendered inside the same card as the
  // populated history list. This keeps the dashboard geometry stable when a
  // new account moves from zero saved scenarios to its first scenario.
  return (
    <Card
      aria-label="Recent ESOP calculations"
      className="rounded-[24px] border border-slate-200/80 bg-white shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-5 md:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Your activity
          </p>
          <CardTitle className="mt-1 text-xl font-black text-slate-950">
            Recent calculations
          </CardTitle>
        </div>

        {calculations.length > 0 && (
          <Link
            href="/history"
            className="flex items-center gap-2 text-sm font-black text-violet-600 transition hover:text-violet-800"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

      </CardHeader>

      <CardContent className="p-5 md:p-6">
        {recentCalculations.length === 0 ? (
          <EmptyState />
        ) : (
          // Each row remains a normal Next link so browser navigation,
          // keyboard navigation and deep links continue to work as before.
          <div className="space-y-3">
            {recentCalculations.map((calculation) => (
              <Link
                key={calculation.id}
                href={`/history/${calculation.id}`}
                aria-label={`View calculation for ${calculation.esopsGranted.toLocaleString()} ESOPs`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <div className="min-w-0">
                  {/* Date and grant size identify the saved scenario. */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(calculation.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-base font-black text-slate-950">
                    {calculation.esopsGranted.toLocaleString()} ESOPs
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-right">
                  {/* Cash values use the existing calculation fields only. */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Value today
                    </p>
                    <p className="mt-1 text-base font-black text-slate-950">
                      ₹{calculation.valueToday.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Exit ₹{calculation.exitValue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-600 sm:block" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
