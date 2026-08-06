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
        router.push("/login");
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

      setCalculations([]);

      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg font-medium">
        Loading Dashboard...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">

        <DashboardHero name={user.name} />

        <DashboardStats calculations={calculations} />

        <QuickActions />

        <RecentCalculations calculations={calculations} />

      </div>
    </div>
  );
}