"use client";

import { useState } from "react";

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
  CalendarDays,
  TrendingUp,
  Trash2,
  Eye,
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-slate-500">
          <CalendarDays className="h-4 w-4" />

          <span className="text-sm">
            {new Date(createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Saved
        </div>

      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">

        <div className="space-y-4">

          <InfoRow
            label="ESOPs Granted"
            value={esopsGranted.toLocaleString()}
          />

          <InfoRow
            label="Vested"
            value={`${vestedPercentage}%`}
          />

          <InfoRow
            label="Current Valuation"
            value={`₹${currentValuation.toLocaleString("en-IN")}`}
          />

          <InfoRow
            label="Exit Valuation"
            value={`₹${exitValuation.toLocaleString("en-IN")}`}
          />

        </div>

        <div className="space-y-4">

          <div className="rounded-2xl bg-slate-100 p-4">

            <div className="flex items-center gap-2 text-slate-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                Value Today
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold">
              ₹{valueToday.toLocaleString("en-IN")}
            </p>

          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-white">

            <div className="text-sm text-slate-300">
              Estimated Exit
            </div>

            <p className="mt-2 text-2xl font-bold">
              ₹{exitValue.toLocaleString("en-IN")}
            </p>

          </div>

        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">

  <Link href={`/history/${id}`}>
  <Button
    variant="outline"
    className="gap-2"
  >
    <Eye className="h-4 w-4" />
    View
  </Button>
</Link>

        <AlertDialog>

          <AlertDialogTrigger asChild>

            <Button
              variant="destructive"
              className="gap-2"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>

          </AlertDialogTrigger>

          <AlertDialogContent>

            <AlertDialogHeader>

              <AlertDialogTitle>
                Delete Calculation?
              </AlertDialogTitle>

              <AlertDialogDescription>
                This action cannot be undone. This calculation will be permanently removed from your history.
              </AlertDialogDescription>

            </AlertDialogHeader>

            <AlertDialogFooter>

              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>

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
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}