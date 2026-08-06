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
    <div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Quick Actions
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        {actions.map((action) => (

          <Card
            key={action.title}
            onClick={() => router.push(action.route)}
            className="
              group
              cursor-pointer
              rounded-3xl
              border
              border-slate-200
              p-7
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-slate-300
              hover:shadow-xl
            "
          >

            <div className="flex items-start justify-between">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-slate-900">

                <action.icon className="h-7 w-7 text-slate-700 group-hover:text-white" />

              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-900" />

            </div>

            <h3 className="mt-6 text-2xl font-semibold text-slate-900">
              {action.title}
            </h3>

            <p className="mt-3 text-slate-500 leading-7">
              {action.description}
            </p>

          </Card>

        ))}

      </div>

    </div>
  );
}