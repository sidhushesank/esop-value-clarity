"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="relative min-h-screen bg-slate-50">

      {/* Dashboard Content */}
      <div className={!user ? "pointer-events-none blur-md select-none" : ""}>

        {user && <DashboardHero name={user.name} />}

        <DashboardStats calculations={calculations} />

        <QuickActions />

        <RecentCalculations calculations={calculations} />

      </div>

      {/* Guest Lock Overlay */}
      {!user && (
        <div className="absolute inset-0 z-40 flex items-center justify-center px-6">

          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-10 shadow-2xl">

            {/* Lock */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 shadow-xl ring-8 ring-slate-100">
              <span className="text-3xl">🔒</span>
            </div>

            {/* Heading */}
            <div className="mt-8 text-center">

              <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold tracking-wider uppercase text-slate-600">
                Dashboard Locked
              </span>

              <h2 className="mt-5 text-4xl font-bold text-slate-900">
                Your ESOP Dashboard Awaits
              </h2>

              <p className="mt-4 text-lg text-slate-600">
                Create a free account to save simulations, access dashboard
                analytics, and track your ESOP growth over time.
              </p>

            </div>

            {/* Features */}
            <div className="mt-10 space-y-5 text-lg text-slate-700">

              <div className="flex items-center gap-3">
                <span>✓</span>
                <span>Unlimited ESOP simulations</span>
              </div>

              <div className="flex items-center gap-3">
                <span>✓</span>
                <span>Saved calculation history</span>
              </div>

              <div className="flex items-center gap-3">
                <span>✓</span>
                <span>Interactive dashboard analytics</span>
              </div>

              <div className="flex items-center gap-3">
                <span>✓</span>
                <span>Future premium insights</span>
              </div>

            </div>

            {/* Buttons */}
            <div className="mt-10 space-y-4">

              <button
                onClick={() => router.push("/signup")}
                className="w-full rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white transition hover:bg-slate-800"
              >
                Create Free Account →
              </button>

              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-xl border border-slate-300 bg-white py-4 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
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