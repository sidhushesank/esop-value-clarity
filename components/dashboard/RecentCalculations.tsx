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

export default function RecentCalculations({
  calculations,
}: RecentCalculationsProps) {

  const recentCalculations = calculations.slice(0, 5);

  return (
    <Card className="rounded-3xl border border-slate-200 shadow-sm">

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle className="text-xl">
          Recent Calculations
        </CardTitle>

        {calculations.length > 0 && (
          <Link
            href="/history"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

      </CardHeader>

      <CardContent>

        {recentCalculations.length === 0 ? (

          <EmptyState />

        ) : (

          <div className="space-y-4">

            {recentCalculations.map((calculation) => (

  <Link
    key={calculation.id}
    href={`/history/${calculation.id}`}
    className="block"
  >

    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-slate-200
        p-5
        cursor-pointer
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-slate-300
        hover:bg-slate-50
        hover:shadow-lg
      "
    >

                <div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">

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

                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {calculation.esopsGranted.toLocaleString()} ESOPs
                  </h3>

                </div>

                <div className="text-right">

                  <p className="text-sm text-slate-500">
                    Value Today
                  </p>

                  <p className="text-xl font-bold text-slate-900">
                    ₹{calculation.valueToday.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-1 text-sm text-emerald-600 font-medium">
                    Exit ₹{calculation.exitValue.toLocaleString("en-IN")}
                  </p>

                </div>

                 </div>

  </Link>

))}

          </div>

        )}

      </CardContent>

    </Card>
  );
}