"use client";

import {
  CircleDollarSign,
  Layers3,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";

type PresentationKpiStripProps = {
  totalOptions: number;
  vestedOptions: number;
  vestedPercentage: number;
  dilutedOwnership: number;
  exerciseCost: number;
  selectedTakeHome: number;
  selectedReturnMultiple: number;
  currency?: string;
};

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";

  return Math.round(value).toLocaleString("en-IN");
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return "0%";

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatMultiple(value: number) {
  if (!Number.isFinite(value)) return "0×";

  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}×`;
}

function formatCurrency(
  value: number,
  currency = "INR",
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  if (currency === "INR") {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function compactCurrency(
  value: number,
  currency = "INR",
) {
  if (!Number.isFinite(value)) {
    return "₹0";
  }

  if (currency === "INR") {
    const abs = Math.abs(value);

    if (abs >= 10_000_000) {
      return `₹${(value / 10_000_000).toFixed(
        abs >= 100_000_000 ? 0 : 1,
      )}Cr`;
    }

    if (abs >= 100_000) {
      return `₹${(value / 100_000).toFixed(
        abs >= 1_000_000 ? 0 : 1,
      )}L`;
    }

    if (abs >= 1_000) {
      return `₹${(value / 1_000).toFixed(
        abs >= 10_000 ? 0 : 1,
      )}K`;
    }
  }

  return formatCurrency(value, currency);
}

export default function PresentationKpiStrip({
  totalOptions,
  vestedOptions,
  vestedPercentage,
  dilutedOwnership,
  exerciseCost,
  selectedTakeHome,
  selectedReturnMultiple,
  currency = "INR",
}: PresentationKpiStripProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.05)]">
      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        <PresentationKpi
          icon={<Layers3 size={17} />}
          label="Granted"
          value={formatNumber(totalOptions)}
          suffix="options"
          detail="Confirmed grant"
          tone="slate"
        />

        <PresentationKpi
          icon={<PieChart size={17} />}
          label="Vested"
          value={formatPercentage(
            vestedPercentage,
          )}
          suffix={`${formatNumber(
            vestedOptions,
          )} options`}
          detail="Active today"
          tone="blue"
        />

        <PresentationKpi
          icon={<TrendingUp size={17} />}
          label="Ownership"
          value={formatPercentage(
            dilutedOwnership,
          )}
          suffix="after dilution"
          detail="Modeled stake"
          tone="indigo"
          featured
        />

        <PresentationKpi
          icon={<CircleDollarSign size={17} />}
          label="Exercise"
          value={compactCurrency(
            exerciseCost,
            currency,
          )}
          suffix="capital required"
          detail="Modeled outlay"
          tone="amber"
        />

        <PresentationKpi
          icon={<Wallet size={17} />}
          label="Take-home"
          value={compactCurrency(
            selectedTakeHome,
            currency,
          )}
          suffix={`${formatMultiple(
            selectedReturnMultiple,
          )} return`}
          detail="Selected scenario"
          tone="emerald"
        />
      </div>
    </section>
  );
}

function PresentationKpi({
  icon,
  label,
  value,
  suffix,
  detail,
  tone,
  featured = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  detail: string;
  tone:
    | "slate"
    | "blue"
    | "indigo"
    | "amber"
    | "emerald";
  featured?: boolean;
}) {
  const toneMap = {
    slate: {
      iconBg: "bg-slate-100",
      iconText: "text-slate-600",
      accent: "text-slate-950",
      bar: "bg-slate-300",
    },
    blue: {
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      accent: "text-blue-950",
      bar: "bg-blue-500",
    },
    indigo: {
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-600",
      accent: "text-indigo-950",
      bar: "bg-indigo-600",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      accent: "text-amber-950",
      bar: "bg-amber-500",
    },
    emerald: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      accent: "text-emerald-950",
      bar: "bg-emerald-600",
    },
  }[tone];

  return (
    <div
      className={`relative px-5 py-5 md:px-6 ${
        featured
          ? "bg-slate-950 text-white"
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            featured
              ? "bg-white/10 text-blue-300"
              : `${toneMap.iconBg} ${toneMap.iconText}`
          }`}
        >
          {icon}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
            featured
              ? "border border-white/10 bg-white/5 text-slate-500"
              : "border border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          {detail}
        </span>
      </div>

      <p
        className={`mt-4 text-[9px] font-black uppercase tracking-[0.12em] ${
          featured
            ? "text-slate-500"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black tracking-[-0.035em] ${
          featured
            ? "text-white"
            : toneMap.accent
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-[10px] ${
          featured
            ? "text-slate-500"
            : "text-slate-400"
        }`}
      >
        {suffix}
      </p>

      <div
        className={`absolute bottom-0 left-5 right-5 h-0.5 rounded-full ${
          featured
            ? "bg-blue-300"
            : toneMap.bar
        }`}
      />
    </div>
  );
}