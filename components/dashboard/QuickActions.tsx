"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";

import {
  Calculator,
  History,
  ArrowRight,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Start Simulation",
      description: "Calculate your ESOP value",
      icon: Calculator,
      route: "/simulator",
    },
    {
      title: "View History",
      description: "See all previous calculations",
      icon: History,
      route: "/history",
    },
  ];

  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="rounded-[28px]"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
            Workspace actions
          </p>
          <h2
            id="quick-actions-heading"
            className="mt-1 text-2xl font-black tracking-tight text-slate-950"
          >
            Continue your ESOP work
          </h2>
        </div>
        <p className="hidden text-sm text-slate-400 sm:block">
          Pick up where you left off.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <Card
            key={action.title}
            onClick={() => router.push(action.route)}
            role="link"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(action.route);
              }
            }}
            className="group cursor-pointer rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 md:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {action.description}
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-600" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
