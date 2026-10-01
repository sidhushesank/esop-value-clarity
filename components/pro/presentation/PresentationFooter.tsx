"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Layers3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

function formatGeneratedAt(value?: string | Date) {
  if (!value) return "Live model";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Live model";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PresentationFooter({
  companyName,
  grantName,
  analysisBasis,
  scenario,
  currency,
  generatedAt,
  onClose,
}: {
  companyName: string;
  grantName: string;
  analysisBasis: string;
  scenario: string;
  currency: string;
  generatedAt?: string | Date;
  onClose: () => void;
}) {
  return (
    <footer className="evc-footer-rise overflow-hidden border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-[#07111f] px-6 py-6 text-white sm:px-7">
          <div className="absolute right-[-90px] top-[-130px] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-130px] left-[38%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="evc-footer-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center border border-white/10 bg-white/[0.06] text-blue-200">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">
                      ESOP Value Clarity
                    </span>
                    <span className="border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      Presentation mode
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-white">
                    Professional equity intelligence report
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                    A connected view of grant facts, scenario assumptions, model outputs and take-home consequences for one active ESOP analysis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="group inline-flex items-center gap-2 border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-200 transition hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.1]"
              >
                <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
                Return to reports
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <TrustPillar
                icon={<ShieldCheck size={15} />}
                label="Source connected"
                text="Built from the current EVC Pro equity model."
              />
              <TrustPillar
                icon={<LockKeyhole size={15} />}
                label="Assumptions visible"
                text="Scenario inputs stay separate from confirmed facts."
              />
              <TrustPillar
                icon={<BadgeCheck size={15} />}
                label="Decision ready"
                text="Designed for explanation, not blind prediction."
              />
            </div>
          </div>
        </div>

        <div className="grid border-l border-slate-200 bg-slate-50/70 sm:grid-cols-2">
          <FooterMetric label="Company" value={companyName || "Company"} />
          <FooterMetric label="Grant" value={grantName || "Employee Stock Option Grant"} />
          <FooterMetric label="Scenario" value={scenario || "Base"} accent="emerald" />
          <FooterMetric label="Analysis" value={analysisBasis || "Full grant"} />
          <FooterMetric label="Currency" value={currency || "INR"} />
          <FooterMetric label="Generated" value={formatGeneratedAt(generatedAt)} />
        </div>
      </div>

      <div className="grid gap-0 border-t border-slate-200 bg-white lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4 text-xs font-semibold text-slate-500 sm:px-7">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Model synced
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers3 size={14} className="text-blue-600" />
            Connected grant → vesting → exercise → dilution → tax → exit
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarClock size={14} className="text-slate-500" />
            {formatGeneratedAt(generatedAt)}
          </span>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 lg:border-l lg:border-t-0 sm:px-7">
          EVC Pro · Equity Intelligence
        </div>
      </div>

      <FooterMotionStyles />
    </footer>
  );
}

function TrustPillar({
  icon,
  label,
  text,
}: {
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="group border border-white/10 bg-white/[0.055] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.08]">
      <div className="flex items-center gap-2 text-blue-200">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}

function FooterMetric({
  label,
  value,
  accent = "blue",
}: {
  label: string;
  value: string;
  accent?: "blue" | "emerald";
}) {
  return (
    <div className="min-h-[112px] border-b border-r border-slate-200 bg-white px-5 py-4 transition duration-300 hover:bg-slate-50">
      <p
        className={`text-[9px] font-black uppercase tracking-[0.16em] ${
          accent === "emerald" ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-5 text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FooterMotionStyles() {
  return (
    <style jsx global>{`
      @keyframes evcFooterRise {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes evcFooterScan {
        0% {
          transform: translateX(-70%);
          opacity: 0;
        }
        18% {
          opacity: 1;
        }
        100% {
          transform: translateX(70%);
          opacity: 0;
        }
      }

      .evc-footer-rise {
        animation: evcFooterRise 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      .evc-footer-scan {
        animation: evcFooterScan 6s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .evc-footer-rise,
        .evc-footer-scan {
          animation: none !important;
        }
      }
    `}</style>
  );
}
