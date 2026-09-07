import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Calculator,
  Wallet,
  Rocket,
  ArrowUpRight,
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
      label: "Tracked calculations",
      value: totalCalculations.toLocaleString(),
      description: "Saved scenarios in your workspace",
      eyebrow: "ACTIVITY",
      icon: Calculator,
      tone: "violet",
    },
    {
      label: "Value today",
      value: `₹${portfolioValue.toLocaleString("en-IN")}`,
      description: "Based on your current saved inputs",
      eyebrow: "CURRENT VIEW",
      icon: Wallet,
      tone: "blue",
    },
    {
      label: "Highest modeled exit",
      value: `₹${estimatedExitValue.toLocaleString("en-IN")}`,
      description: "The highest exit scenario saved",
      eyebrow: "UPPER SCENARIO",
      icon: Rocket,
      tone: "emerald",
    },
  ];

  return (
    <section aria-label="Workspace summary" className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const toneClasses =
          stat.tone === "violet"
            ? "bg-violet-50 text-violet-700 ring-violet-100"
            : stat.tone === "blue"
            ? "bg-blue-50 text-blue-700 ring-blue-100"
            : "bg-emerald-50 text-emerald-700 ring-emerald-100";

        return (
          <Card
            key={stat.label}
            className="group rounded-[24px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-2xl p-3 ring-1 ${toneClasses}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                {stat.eyebrow}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                {stat.label}
              </p>
              <h2 className="mt-1 break-all text-3xl font-black tracking-tight text-slate-950">
                {stat.value}
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
