"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Gauge,
  Info,
  LockKeyhole,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import Footer from "@/components/sections/Footer";

type CalculationResult = {
  vestedShares: number;
  valueToday: number;
  afterDilution: number;
  exitValue: number;
};

type GuestUsage = {
  used: number;
  remaining: number;
  limitReached: boolean;
};

type NumericFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  helper: string;
  prefix?: string;
  suffix?: string;
  icon: ComponentType<{ className?: string }>;
  percent?: boolean;
  indianFormat?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

function normalizeNumericInput(value: string) {
  const digitsOnly = value.replace(/[^0-9]/g, "");

  if (!digitsOnly) {
    return "";
  }

  const withoutLeadingZeroes = digitsOnly.replace(/^0+(?=\d)/, "");

  return withoutLeadingZeroes === "0" ? "" : withoutLeadingZeroes;
}

function normalizePercentageInput(value: string) {
  const normalized = normalizeNumericInput(value);

  if (!normalized) {
    return "";
  }

  return String(Math.min(Number(normalized), 100));
}

function formatIndianNumber(value: string) {
  const normalized = normalizeNumericInput(value);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= 3) {
    return normalized;
  }

  const lastThree = normalized.slice(-3);
  let remaining = normalized.slice(0, -3);
  const groups: string[] = [];

  while (remaining.length > 2) {
    groups.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }

  if (remaining) {
    groups.unshift(remaining);
  }

  return `${groups.join(",")},${lastThree}`;
}

function numberFromInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompactINR(value: number) {
  const amount = Math.max(Number(value) || 0, 0);

  if (amount >= 10_000_000) {
    const crores = amount / 10_000_000;
    const formatted = crores < 10
      ? crores.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : crores.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        });

    return `₹${formatted} Cr`;
  }

  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    const formatted = lakhs < 10
      ? lakhs.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : lakhs.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        });

    return `₹${formatted} L`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatNumber(value: number) {
  return Math.max(Number(value) || 0, 0).toLocaleString("en-IN");
}

function NumericField({
  label,
  value,
  placeholder,
  helper,
  prefix,
  suffix,
  icon: Icon,
  percent = false,
  indianFormat = false,
  onChange,
  onBlur,
}: NumericFieldProps) {
  const displayValue = indianFormat
    ? formatIndianNumber(value)
    : value;

  return (
    <div className="group">
      <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-900">
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-focus-within:bg-violet-100 group-focus-within:text-violet-600">
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </span>
        {percent && (
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            0–100%
          </span>
        )}
      </label>

      <div className="relative mt-2">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            {prefix}
          </span>
        )}

        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`h-12 w-full rounded-xl border border-slate-200 bg-white text-base font-semibold text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${
            prefix ? "pl-10" : "pl-4"
          } ${suffix ? "pr-14" : "pr-4"}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}

function ValueMetric({
  label,
  value,
  helper,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        highlight
          ? "border-slate-900 bg-slate-950 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.16em] ${
              highlight ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {label}
          </p>
          <p className="mt-3 break-words text-2xl font-black tracking-[-0.04em] md:text-3xl">
            {value}
          </p>
        </div>

        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            highlight
              ? "bg-white/10 text-violet-200"
              : "bg-violet-50 text-violet-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p
        className={`mt-4 text-xs leading-5 ${
          highlight ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {helper}
      </p>

      {highlight && (
        <div className="pointer-events-none absolute -bottom-14 -right-8 h-32 w-32 rounded-full bg-violet-600/20 blur-2xl" />
      )}
    </div>
  );
}

export default function SimulatorPage() {
  const router = useRouter();

  // Blank strings are intentional. A blank input represents zero to the
  // calculator, while keeping the UI free from sticky leading zeroes.
  const [esops, setEsops] = useState("");
  const [vested, setVested] = useState("100");
  const [valuation, setValuation] = useState("");
  const [dilution, setDilution] = useState("");
  const [exitValuation, setExitValuation] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [guestUsage, setGuestUsage] = useState<GuestUsage>({
    used: 0,
    remaining: 3,
    limitReached: false,
  });

  useEffect(() => {
    async function checkAccess() {
      try {
        const authRes = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const authData = await authRes.json();

        if (authData.success) {
          setIsLoggedIn(true);
          return;
        }

        const guestRes = await fetch("/api/guest/status", {
          credentials: "include",
          cache: "no-store",
        });

        const guestData = await guestRes.json();

        if (guestData.success) {
          setGuestUsage({
            used: guestData.used,
            remaining: guestData.remaining,
            limitReached: guestData.limitReached,
          });
        }
      } catch (error) {
        console.error("[SIMULATOR_ACCESS]", error);
      } finally {
        setCheckingAccess(false);
      }
    }

    void checkAccess();
  }, []);

  async function handleCalculate() {
    try {
      setLoading(true);
      setMessage("");

      const endpoint = isLoggedIn
        ? "/api/calculator"
        : "/api/guest/calculate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          esopsGranted: numberFromInput(esops),
          vestedPercentage: numberFromInput(vested),
          currentValuation: numberFromInput(valuation),
          dilutionPercentage: numberFromInput(dilution),
          exitValuation: numberFromInput(exitValuation),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.limitReached) {
          setGuestUsage((previous) => ({
            ...previous,
            limitReached: true,
            remaining: 0,
          }));
          setMessage("");
          return;
        }

        setMessage(data.message || "Unable to calculate this scenario.");
        return;
      }

      if (!isLoggedIn) {
        setGuestUsage((previous) => ({
          ...previous,
          used: previous.used + 1,
          remaining: data.remaining,
        }));
      }

      const calculation = data.calculation ?? data;

      setResult(calculation);
      setMessage(
        isLoggedIn
          ? "Scenario saved to your private workspace."
          : "Scenario calculated successfully."
      );
    } catch (error) {
      console.error("[SIMULATOR_CALCULATE]", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const calculatedVestedPercentage = numberFromInput(vested);
  const calculatedDilution = numberFromInput(dilution);
  const currentValue = result ? formatCompactINR(result.valueToday) : "—";
  const postDilutionValue = result
    ? formatCompactINR(result.afterDilution)
    : "—";
  const exitValue = result ? formatCompactINR(result.exitValue) : "—";

  return (
    <>
      <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Private calculation workspace
            </div>
          </div>

          <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-10 lg:px-12 lg:py-11">
            <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  ESOP Value Clarity · Simulator
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.065em] sm:text-5xl lg:text-6xl">
                  Free ESOP calculator: model your equity before you make the move.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Turn a grant, a vesting schedule and a valuation assumption
                  into a clear scenario you can actually reason about.
                </p>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <TrustPill icon={ShieldCheck} text="Assumptions stay visible" />
                  <TrustPill icon={LockKeyhole} text="Private by design" />
                  <TrustPill icon={TrendingUp} text="Scenario-based modelling" />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                      Scenario workspace
                    </p>
                    <p className="mt-2 text-lg font-black tracking-[-0.03em]">
                      {result ? "Scenario ready to review" : "Awaiting your assumptions"}
                    </p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-violet-200">
                    <Calculator className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <ProgressLine label="Grant inputs" value={esops ? 100 : 0} />
                  <ProgressLine label="Valuation inputs" value={valuation && exitValuation ? 100 : 0} />
                  <ProgressLine label="Output confidence" value={result ? 100 : 0} />
                </div>

                <HumanScenarioAnimation
                  active={Boolean(esops || valuation || exitValuation)}
                  ready={Boolean(result)}
                />

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-xs leading-5 text-slate-300">
                  <Info className="h-4 w-4 shrink-0 text-violet-200" />
                  Blank numeric fields are treated as zero when you calculate.
                </div>
              </div>
            </div>
          </section>

          <div className="relative mt-6">
            <div
              className={`transition duration-300 ${
                guestUsage.limitReached
                  ? "pointer-events-none select-none blur-md"
                  : ""
              }`}
            >
              {!checkingAccess && !isLoggedIn && (
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                      <Gauge className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-amber-950">Complimentary workspace access</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {guestUsage.remaining} of 3 free simulations remaining.
                      </p>
                    </div>
                  </div>
                  <div className="min-w-40">
                    <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                      <span>{guestUsage.used}/3 used</span>
                      <span>{guestUsage.remaining} left</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min((guestUsage.used / 3) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCalculate();
                }}
                className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]"
              >
                <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-8">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                        Step 01 · Inputs
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
                        Build your scenario
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Enter the terms from your offer letter or cap-table note.
                      </p>
                    </div>
                    <span className="hidden h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600 sm:grid">
                      <WalletCards className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="space-y-6 pt-6">
                    <NumericField
                      label="ESOPs granted"
                      value={esops}
                      placeholder="e.g. 1,000"
                      helper="The total number of options or shares granted to you."
                      icon={WalletCards}
                      indianFormat
                      onChange={(value) => setEsops(normalizeNumericInput(value))}
                    />

                    <NumericField
                      label="Vested percentage"
                      value={vested}
                      placeholder="e.g. 75"
                      helper="The portion of your grant that has vested or is expected to vest."
                      suffix="%"
                      icon={Percent}
                      percent
                      onChange={(value) => setVested(normalizeNumericInput(value))}
                      onBlur={() => setVested(normalizePercentageInput(vested))}
                    />

                    <div className="relative py-1">
                      <div className="border-t border-dashed border-slate-200" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Valuation assumptions
                      </span>
                    </div>

                    <NumericField
                      label="Current company valuation"
                      value={valuation}
                      placeholder="e.g. 4,50,00,00,000"
                      helper="Use the latest valuation or reference value available to you."
                      prefix="₹"
                      icon={CircleDollarSign}
                      indianFormat
                      onChange={(value) => setValuation(normalizeNumericInput(value))}
                    />

                    <NumericField
                      label="Expected dilution"
                      value={dilution}
                      placeholder="e.g. 15"
                      helper="Your estimate of ownership dilution from future fundraising."
                      suffix="%"
                      icon={Percent}
                      percent
                      onChange={(value) => setDilution(normalizeNumericInput(value))}
                      onBlur={() => setDilution(normalizePercentageInput(dilution))}
                    />

                    <NumericField
                      label="Exit company valuation"
                      value={exitValuation}
                      placeholder="e.g. 10,00,00,00,000"
                      helper="A future valuation assumption for the modeled exit scenario."
                      prefix="₹"
                      icon={TrendingUp}
                      indianFormat
                      onChange={(value) => setExitValuation(normalizeNumericInput(value))}
                    />

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-xs leading-5 text-slate-500">
                          We do not invent missing valuation inputs. Leave a field
                          blank if you do not know it; the model will treat it as
                          zero and keep the assumption visible.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || (!isLoggedIn && guestUsage.limitReached)}
                      className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_12px_22px_rgba(124,58,237,0.22)] transition hover:bg-violet-700 hover:shadow-[0_16px_28px_rgba(124,58,237,0.28)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Calculating scenario…
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4" />
                          Calculate ESOP value
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    {message && (
                      <div
                        role="status"
                        className={`flex items-start gap-3 rounded-xl border p-3 text-sm leading-5 ${
                          message.includes("successfully") || message.includes("workspace")
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {message.includes("successfully") || message.includes("workspace") ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        {message}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-8">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                        Step 02 · Readout
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">
                        Your modeled value
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                        Review current value, dilution impact and the exit assumption separately.
                      </p>
                    </div>
                    {result && (
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                        Calculated
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-3">
                    <ValueMetric
                      label="Value today"
                      value={currentValue}
                      helper="Based on vested shares and current valuation."
                      icon={CircleDollarSign}
                    />
                    <ValueMetric
                      label="After dilution"
                      value={postDilutionValue}
                      helper={`${calculatedDilution}% future dilution assumption applied.`}
                      icon={Percent}
                    />
                    <ValueMetric
                      label="Modeled exit"
                      value={exitValue}
                      helper="Illustrative value at your exit valuation."
                      icon={TrendingUp}
                      highlight
                    />
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
                    <MiniReadout
                      label="Vested shares"
                      value={result ? formatNumber(result.vestedShares) : "—"}
                      helper={`${calculatedVestedPercentage}% of the grant modeled.`}
                      icon={Check}
                    />
                    <MiniReadout
                      label="Model status"
                      value={result ? "Ready to review" : "Waiting for inputs"}
                      helper="Run the calculation after reviewing your assumptions."
                      icon={Clock3}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm">
                        <Info className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-violet-950">How to read this page</p>
                        <p className="mt-2 text-sm leading-6 text-violet-900/70">
                          The exit number is a scenario, not guaranteed cash. It depends on the valuation you enter, your vesting and future dilution. Taxes, exercise costs and liquidity are not included in this FREE model.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Want the full equity picture?</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Explore vesting, exercise cost, tax and scenario analysis in PRO.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/pricing")}
                      className="inline-flex items-center justify-center gap-2 text-sm font-black text-violet-600 transition hover:text-violet-800"
                    >
                      Explore PRO
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              </form>
            </div>

            {guestUsage.limitReached && (
              <div className="absolute inset-0 z-20 flex items-start justify-center pt-16 sm:pt-24">
                <div className="w-full max-w-lg rounded-[26px] border border-slate-200 bg-white/95 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:p-10">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
                    <LockKeyhole className="h-6 w-6" />
                  </div>

                  <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                    Complimentary access complete
                  </p>
                  <h2 className="mt-3 text-center text-3xl font-black tracking-[-0.05em]">
                    Keep your equity work in one place.
                  </h2>
                  <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                    Create a free account for unlimited simulations, saved history and a personal dashboard.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <UnlockItem text="Unlimited simulations" />
                    <UnlockItem text="Private calculation history" />
                    <UnlockItem text="Dashboard analytics" />
                    <UnlockItem text="Future product updates" />
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/signup")}
                    className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-700"
                  >
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    I already have an account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function TrustPill({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-slate-300">
      <Icon className="h-3.5 w-3.5 text-violet-200" />
      {text}
    </span>
  );
}

function HumanScenarioAnimation({
  active,
  ready,
}: {
  active: boolean;
  ready: boolean;
}) {
  const status = ready
    ? "Scenario mapped"
    : active
    ? "Reading your assumptions"
    : "Ready when you are";

  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-3">
      <div
        className="relative h-[88px] w-[92px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-400/25 via-blue-400/10 to-white/[0.04]"
        role="img"
        aria-label="Animated ESOP analyst reviewing the scenario"
      >
        <div className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-violet-400/20 blur-xl" />
        <span className="absolute right-2 top-2 rounded-md bg-white/10 px-1.5 py-1 text-[8px] font-black tracking-[0.12em] text-violet-100">
          INR
        </span>

        <div
          className={`absolute bottom-2 left-1/2 h-[66px] w-[58px] -translate-x-1/2 transition-transform duration-500 ${
            active ? "animate-bounce" : "animate-pulse"
          }`}
        >
          <span className="absolute left-[20px] top-0 h-[22px] w-[22px] rounded-full border-2 border-amber-100/80 bg-[#f5c6a5] shadow-[0_2px_10px_rgba(245,198,165,0.28)]" />
          <span className="absolute left-[18px] top-[-2px] h-[11px] w-[26px] rounded-t-full bg-slate-800" />
          <span className="absolute left-[12px] top-[21px] h-[31px] w-[34px] rounded-[14px_14px_9px_9px] bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_5px_12px_rgba(124,58,237,0.25)]" />
          <span className="absolute left-[5px] top-[26px] h-[8px] w-[24px] -rotate-[24deg] rounded-full bg-[#f5c6a5]" />
          <span className="absolute right-[4px] top-[27px] h-[8px] w-[24px] rotate-[24deg] rounded-full bg-[#f5c6a5]" />
          <span className="absolute left-[17px] top-[49px] h-[16px] w-[9px] -rotate-[6deg] rounded-full bg-slate-200" />
          <span className="absolute right-[17px] top-[49px] h-[16px] w-[9px] rotate-[6deg] rounded-full bg-slate-200" />
          <span className="absolute bottom-[-1px] left-[9px] h-[6px] w-[19px] rounded-full bg-slate-900/80" />
          <span className="absolute bottom-[-1px] right-[9px] h-[6px] w-[19px] rounded-full bg-slate-900/80" />
        </div>

        <span className="absolute bottom-2 left-1/2 h-[7px] w-[48px] -translate-x-1/2 rounded-full border border-white/20 bg-white/15" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
            Live workspace
          </p>
        </div>
        <p className="mt-2 text-sm font-black text-white">{status}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {ready
            ? "Your numbers are ready for a clear review."
            : "Enter the terms and watch the workspace come alive."}
        </p>
      </div>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-300">{label}</span>
        <span className="text-violet-200">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-blue-300 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MiniReadout({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      </div>
    </div>
  );
}

function UnlockItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-3 w-3" />
      </span>
      {text}
    </div>
  );
}
