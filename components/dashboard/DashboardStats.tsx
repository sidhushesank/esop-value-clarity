import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Calculator,
  Wallet,
  Rocket,
} from "lucide-react";

interface Calculation {
  id: string;
  valueToday: number;
  exitValue: number;
}

interface DashboardStatsProps {
  calculations: Calculation[];
}

export default function DashboardStats({
  calculations,
}: DashboardStatsProps) {

  const totalCalculations = calculations.length;

  const portfolioValue = calculations.reduce(
    (total, calculation) => total + calculation.valueToday,
    0
  );

  const estimatedExitValue = calculations.reduce(
    (max, calculation) =>
      Math.max(max, calculation.exitValue),
    0
  );

  const stats = [
    {
      title: "Total Calculations",
      value: totalCalculations.toLocaleString(),
      icon: Calculator,
    },
    {
      title: "Portfolio Value",
      value: `₹${portfolioValue.toLocaleString("en-IN")}`,
      icon: Wallet,
    },
    {
      title: "Highest Exit Value",
      value: `₹${estimatedExitValue.toLocaleString("en-IN")}`,
      icon: Rocket,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">

      {stats.map((stat) => (

        <Card
          key={stat.title}
          className="group rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <CardContent className="p-7">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition-colors duration-300 group-hover:bg-slate-900">

              <stat.icon className="h-7 w-7 text-slate-700 group-hover:text-white" />

            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              {stat.title}
            </p>

            <h2 className="mt-2 break-all text-4xl font-bold tracking-tight text-slate-900">

              {stat.value}

            </h2>

          </CardContent>

        </Card>

      ))}

    </div>
  );
}