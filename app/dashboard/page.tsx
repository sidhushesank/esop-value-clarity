"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import Footer from "@/components/sections/Footer";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentCalculations from "@/components/dashboard/RecentCalculations";

type User = {
  id: string;
  name: string;
  email: string;
};

export interface Calculation {
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

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // ---------- USER ----------

      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!userResponse.ok) {
        setUser(null);
        setCalculations([]);
        return;
      }

      const userData = await userResponse.json();

      setUser(userData.user);

      // ---------- CALCULATIONS ----------

      const calculationResponse = await fetch("/api/calculator", {
        credentials: "include",
      });

      if (calculationResponse.ok) {
        const calculationData = await calculationResponse.json();

        setCalculations(calculationData?.calculations ?? []);
      } else {
        setCalculations([]);
      }
    } catch (error) {
      console.error(error);

      setUser(null);
      setCalculations([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg font-medium text-slate-600">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div
        className={
          !user
            ? "pointer-events-none select-none blur-[2px]"
            : ""
        }
      >
        <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
                ESOP Value Clarity
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Your employee equity workspace
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Personal workspace
            </div>
          </div>

          {user && <DashboardHero name={user.name} />}

          <div className="mt-6">
            <DashboardStats calculations={calculations} />
          </div>

          <div className="mt-8">
            <QuickActions />
          </div>

          <div className="mt-8">
            <RecentCalculations calculations={calculations} />
          </div>

          <footer className="mt-10 border-t border-slate-200/80 py-6">
            <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-black uppercase tracking-[0.16em] text-slate-500">
                ESOP Value Clarity
              </p>
              <p>Clearer decisions start with clearer numbers.</p>
            </div>
          </footer>
        </div>
      </div>

      {!user && (
        <div className="absolute inset-0 z-40 flex items-start justify-center px-5 py-20 md:items-center md:px-8 md:py-12">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="bg-[#0b1024] px-6 py-8 text-white md:px-10 md:py-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/25">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                    Dashboard access
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                    Your equity workspace starts here.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                    Create a free account to save simulations, revisit your assumptions and understand your ESOP position over time.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 md:px-10 md:py-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "Save your simulation history",
                  "Keep assumptions visible",
                  "Return to your scenarios anytime",
                ].map((item) => (
                  <div key={item} className="flex gap-2 text-sm font-bold leading-5 text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
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
      <Footer />
    </main>
  );
}
