"use client";

import { useEffect, useState } from "react";

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

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalculations();
  }, []);

  async function fetchCalculations() {
    try {
      const response = await fetch("/api/calculator", {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
        return;
      }

      setCalculations(data.calculations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    setCalculations((prev) =>
      prev.filter((calculation) => calculation.id !== id)
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-12">

          <HistoryHeader />

          <div className="mt-12 flex items-center justify-center">

            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-6 py-12">

        <HistoryHeader />

        <div className="mt-10">

          {calculations.length === 0 ? (

            <EmptyHistory />

          ) : (

            <div className="space-y-6">

              {calculations.map((calculation) => (

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

    </div>
  );
}