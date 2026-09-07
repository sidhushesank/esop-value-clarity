"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Coins,
  Eye,
  Landmark,
  Percent,
  Trash2,
  TrendingUp,
} from "lucide-react";

interface HistoryCardProps {
  id: string;

  esopsGranted: number;
  vestedPercentage: number;
  vestedShares: number;

  currentValuation: number;
  dilutionPercentage: number;
  exitValuation: number;

  valueToday: number;
  afterDilution: number;
  exitValue: number;

  createdAt: string;

  onDelete: (id: string) => void;
}

export default function HistoryCard({
  id,
  esopsGranted,
  vestedPercentage,
  vestedShares,
  currentValuation,
  dilutionPercentage,
  exitValuation,
  valueToday,
  afterDilution,
  exitValue,
  createdAt,
  onDelete,
}: HistoryCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);

      const response = await fetch(`/api/calculator/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      onDelete(id);
    } catch (error) {
      console.error(error);
      alert("Unable to delete calculation.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="group rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Saved scenario
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {new Date(createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Ready to review
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">
                Scenario inputs
              </p>
              <h3 className="mt-1 text-base font-black text-slate-950">
                Assumptions captured
              </h3>
            </div>
            <ChartNoAxesCombined className="h-5 w-5 text-slate-300" />
          </div>

          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <InfoRow
              icon={<Coins className="h-4 w-4" />}
              label="ESOPs granted"
              value={esopsGranted.toLocaleString("en-IN")}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label="Vested"
              value={`${vestedPercentage}%`}
            />
            <InfoRow
              icon={<TrendingUp className="h-4 w-4" />}
              label="Vested shares"
              value={vestedShares.toLocaleString("en-IN")}
            />
            <InfoRow
              icon={<Landmark className="h-4 w-4" />}
              label="Dilution"
              value={`${dilutionPercentage}%`}
            />
            <InfoRow
              icon={<CircleDollarSign className="h-4 w-4" />}
              label="Current valuation"
              value={`₹${currentValuation.toLocaleString("en-IN")}`}
            />
            <InfoRow
              icon={<BadgeIndianRupee className="h-4 w-4" />}
              label="Exit valuation"
              value={`₹${exitValuation.toLocaleString("en-IN")}`}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                Value today
              </p>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              ₹{valueToday.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500">Current modeled value</p>
          </div>

          <div className="rounded-2xl bg-[#0b1024] p-4 text-white shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-200">
                Modeled exit
              </p>
              <ArrowUpRight className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight">
              ₹{exitValue.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Scenario outcome, not guaranteed proceeds
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          After dilution: <span className="font-bold text-slate-600">₹{afterDilution.toLocaleString("en-IN")}</span>
        </p>

        <div className="flex gap-3">
          <Link href={`/history/${id}`}>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 font-black"
            >
              <Eye className="h-4 w-4" />
              View scenario
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2 rounded-xl font-black"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete calculation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This saved scenario will be permanently removed from your history.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 py-3 last:border-b-0">
      <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <span className="shrink-0 text-right text-sm font-black text-slate-950">
        {value}
      </span>
    </div>
  );
}
