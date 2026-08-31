"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  FileText,
  LineChart,
  Loader2,
  LockKeyhole,
  Receipt,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type BillingCycle = "MONTHLY" | "SIX_MONTHS" | "YEARLY";

const PLANS: {
  cycle: BillingCycle;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
}[] = [
  {
    cycle: "MONTHLY",
    name: "Monthly",
    price: 199,
    period: "/ month",
    description: "Flexible access with monthly billing.",
  },
  {
    cycle: "SIX_MONTHS",
    name: "6 Months",
    price: 650,
    period: "/ 6 months",
    description: "Great value for consistent use.",
    popular: true,
  },
  {
    cycle: "YEARLY",
    name: "Yearly",
    price: 1200,
    period: "/ year",
    description: "Best value for long-term access.",
  },
];

const PRO_FEATURES = [
  {
    title: "Vesting Intelligence",
    question: "What is actually earned?",
    description:
      "Track vested and unvested equity, cliffs and time-based ownership.",
    icon: Clock3,
  },
  {
    title: "Dilution Intelligence",
    question: "What can change after funding?",
    description:
      "Model how future financing and share expansion can affect ownership.",
    icon: BarChart3,
  },
  {
    title: "Exercise Decision",
    question: "What cash may be required?",
    description:
      "Understand strike price, exercise cost and the economics of exercising options.",
    icon: Wallet,
  },
  {
    title: "Exit Scenarios",
    question: "What could different outcomes mean?",
    description:
      "Explore exit-value scenarios without presenting modeled outcomes as forecasts.",
    icon: LineChart,
  },
  {
    title: "Tax Estimation",
    question: "What may remain after tax?",
    description:
      "Bring estimated tax impact into the analysis instead of stopping at gross value.",
    icon: Receipt,
  },
  {
    title: "Scenario Comparison",
    question: "Which assumption changes the result?",
    description:
      "Compare scenarios side by side and identify the variables driving the difference.",
    icon: Scale,
  },
  {
    title: "Reports & History",
    question: "What did I model before?",
    description:
      "Save analyses, revisit previous decisions and create clearer equity reports.",
    icon: FileText,
  },
  {
    title: "Offer Intelligence",
    question: "Which job offer has the stronger economics?",
    description:
      "Compare salary, variable pay and equity terms without treating uncertain equity as guaranteed cash.",
    icon: Crown,
  },
];

export default function PricingPage() {
  const [selectedCycle, setSelectedCycle] =
    useState<BillingCycle>("SIX_MONTHS");

  const [loading, setLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = PLANS.find(
    (plan) => plan.cycle === selectedCycle
  )!;

  // ---------------------------------------------------------
  // Check current account
  // ---------------------------------------------------------

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.success) {
          setIsPro(data.user.account.plan === "PRO");
          setIsFounder(Boolean(data.user.account.isFounder));
        }
      } catch (error) {
        console.error("Unable to load account:", error);
      } finally {
        setCheckingAccount(false);
      }
    }

    loadAccount();
  }, []);

  // ---------------------------------------------------------
  // Load Razorpay Checkout
  // ---------------------------------------------------------

  function loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () =>
          resolve(true)
        );

        existingScript.addEventListener("error", () =>
          resolve(false)
        );

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  // ---------------------------------------------------------
  // Start payment
  // ---------------------------------------------------------

  async function handleUpgrade() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // -----------------------------------------------------
      // Founder / existing PRO protection
      // -----------------------------------------------------

      if (isFounder || isPro) {
        setError(
          "Your account already has PRO access."
        );
        return;
      }

      // -----------------------------------------------------
      // Load Razorpay
      // -----------------------------------------------------

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Unable to load Razorpay Checkout."
        );
      }

      // -----------------------------------------------------
      // Create Razorpay order
      // -----------------------------------------------------

      const orderResponse = await fetch(
        "/api/payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            billingCycle: selectedCycle,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(
          orderData.message ||
            "Unable to create payment order."
        );
      }

      // -----------------------------------------------------
      // Open Razorpay Checkout
      // -----------------------------------------------------

      const options = {
        key: orderData.key,

        amount: orderData.order.amount,

        currency: orderData.order.currency,

        name: "ESOP Value Clarity",

        description: `Value Clarity PRO - ${selectedPlan.name}`,

        order_id: orderData.order.id,

        handler: async function (response: any) {
          try {
            setLoading(true);
            setError("");

            // ---------------------------------------------
            // Verify payment on our server
            // ---------------------------------------------

            const verifyResponse = await fetch(
              "/api/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            // ---------------------------------------------
            // Payment successfully verified
            // ---------------------------------------------

            window.location.href = "/profile";
          } catch (error: any) {
            console.error(
              "Payment verification error:",
              error
            );

            setError(
              error?.message ||
                "Payment was completed but verification failed. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#2563eb",
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);

      setError(
        error?.message ||
          "Unable to start payment. Please try again."
      );

      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------

  if (checkingAccount) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </main>
    );
  }

  // ---------------------------------------------------------
  // Already PRO / Founder
  // ---------------------------------------------------------

  if (isPro) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f6f8fc] px-6 py-10 text-slate-950">
        <div className="pricing-grid pointer-events-none fixed inset-0 opacity-35" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/profile"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Profile
          </Link>

          <section className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-[#030817] p-8 text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,.95)] md:p-11">
            <div className="pricing-dark-grid pointer-events-none absolute inset-0 opacity-60" />
            <div className="pricing-orb pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-blue-600/15 blur-[100px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5">
                  <Crown className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    {isFounder ? "FOUNDER PRO · LIFETIME ACCESS" : "PRO · ACTIVE"}
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Your complete equity
                  <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                    decision workspace is active.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
                  Your account already includes the connected PRO workspace for
                  vesting, dilution, exercise economics, tax estimation, exit
                  scenarios, reports and Offer Intelligence.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {["Vesting", "Dilution", "Exercise", "Tax", "Exit", "Reports", "Offers"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-400"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                  ACCESS STATUS
                </p>
                <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">PRO Workspace</span>
                    <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      Unlocked
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    No additional purchase is required for this account.
                  </p>
                </div>

                <Link
                  href="/pro"
                  className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-blue-500"
                >
                  Open PRO workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        <style jsx global>{`
          .pricing-grid {
            background-image:
              linear-gradient(rgba(15,23,42,.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(15,23,42,.035) 1px, transparent 1px);
            background-size: 38px 38px;
          }
          .pricing-dark-grid {
            background-image:
              linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
            background-size: 34px 34px;
          }
          @keyframes pricingOrb {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(-45px,35px) scale(1.12); }
          }
          .pricing-orb { animation: pricingOrb 12s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .pricing-orb { animation: none !important; }
          }
        `}</style>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Pricing page
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fc] px-6 py-10 text-slate-950">
      <div className="pricing-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="pointer-events-none fixed left-1/2 top-20 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-blue-200/35 blur-[150px]" />

      <div className="relative mx-auto max-w-[1380px]">
        <Link
          href="/profile"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Profile
        </Link>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[36px] border border-slate-800 bg-[#030817] p-8 text-white shadow-[0_45px_130px_-60px_rgba(15,23,42,.95)] md:p-12">
          <div className="pricing-dark-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="pricing-orb pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-blue-600/15 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-40 left-[25%] h-80 w-80 rounded-full bg-violet-600/10 blur-[110px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-3 py-1.5">
                <Crown className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-[9px] font-black uppercase tracking-[0.17em] text-blue-200">
                  ESOP VALUE CLARITY · PRO
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] md:text-6xl">
                Don&apos;t pay for
                <span className="block text-slate-500">more charts.</span>
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  Pay for a clearer decision.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
                PRO connects your ESOP simulation to the questions that matter
                before you exercise, stay, leave, evaluate dilution or compare
                an employment offer.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Employee equity",
                  "Vesting",
                  "Dilution",
                  "Exercise cost",
                  "Tax estimation",
                  "Offer comparison",
                ].map((item, index) => (
                  <span
                    key={item}
                    className="pricing-chip rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                  DECISION FLOW
                </p>
                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Explainable
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ["01", "Grant", "What do I actually own?"],
                  ["02", "Risk", "What can vesting or dilution change?"],
                  ["03", "Cost", "What may exercise and tax require?"],
                  ["04", "Decision", "How does this compare with my alternatives?"],
                ].map(([number, label, detail], index) => (
                  <div
                    key={number}
                    className="pricing-flow group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#08111f]/90 p-4 transition duration-500 hover:translate-x-2 hover:border-blue-400/20"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <span className="font-mono text-[9px] font-black text-blue-300">
                      {number}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-black text-white">{label}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRO CAPABILITY MAP */}
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/90 p-7 shadow-[0_25px_80px_-50px_rgba(15,23,42,.35)] backdrop-blur md:p-9">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                ONE WORKSPACE · EIGHT DECISION LAYERS
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-4xl">
                Everything PRO connects.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500">
              These are not eight disconnected calculators. Each capability
              contributes context to the same employee-equity decision.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PRO_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="pricing-feature group relative min-h-[220px] overflow-hidden rounded-[23px] border border-slate-200 bg-[#f8fafc] p-5 transition duration-500 hover:-translate-y-2 hover:border-blue-200 hover:bg-white hover:shadow-[0_25px_50px_-35px_rgba(37,99,235,.5)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="absolute right-4 top-4 font-mono text-[9px] font-black text-slate-300">
                    0{index + 1}
                  </span>
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm transition group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-5 text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">
                    {feature.question}
                  </p>
                  <h3 className="mt-2 text-sm font-black text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* PLAN SELECTOR */}
        <section className="mt-8">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              CHOOSE ACCESS
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-4xl">
              Same PRO workspace. Choose your billing window.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Every paid plan unlocks the same PRO capabilities. Only the
              billing period changes.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const selected = selectedCycle === plan.cycle;
              const monthlyEquivalent =
                plan.cycle === "MONTHLY"
                  ? plan.price
                  : plan.cycle === "SIX_MONTHS"
                  ? plan.price / 6
                  : plan.price / 12;

              return (
                <button
                  key={plan.cycle}
                  type="button"
                  onClick={() => setSelectedCycle(plan.cycle)}
                  className={`group relative overflow-hidden rounded-[28px] border p-7 text-left transition duration-500 ${
                    selected
                      ? "border-blue-500 bg-[#061225] text-white shadow-[0_30px_70px_-40px_rgba(37,99,235,.8)] -translate-y-2"
                      : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute right-5 top-5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-violet-400">
                      Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                        selected ? "border-blue-400" : "border-slate-300"
                      }`}
                    >
                      {selected && <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />}
                    </div>
                    <p className={`text-sm font-black ${selected ? "text-white" : "text-slate-950"}`}>
                      {plan.name}
                    </p>
                  </div>

                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-[-0.05em]">
                      ₹{plan.price}
                    </span>
                    <span className={`mb-1 text-xs ${selected ? "text-slate-500" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  </div>

                  <p className={`mt-4 min-h-[40px] text-xs leading-6 ${selected ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.description}
                  </p>

                  {plan.cycle !== "MONTHLY" && (
                    <div className={`mt-5 rounded-xl border p-3 ${selected ? "border-white/10 bg-white/[0.04]" : "border-slate-100 bg-slate-50"}`}>
                      <p className={`text-[8px] font-black uppercase tracking-[0.12em] ${selected ? "text-blue-300" : "text-blue-600"}`}>
                        Effective monthly cost
                      </p>
                      <p className="mt-1 text-sm font-black">
                        ₹{monthlyEquivalent.toFixed(0)} / month
                      </p>
                    </div>
                  )}

                  <div className={`mt-6 border-t pt-5 ${selected ? "border-white/10" : "border-slate-100"}`}>
                    <div className="flex items-center gap-2 text-xs font-black">
                      <CheckCircle2 className={`h-4 w-4 ${selected ? "text-emerald-300" : "text-emerald-600"}`} />
                      Full PRO workspace
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* CHECKOUT / TRUST */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-7">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">
              PAYMENT & PRODUCT TRUST
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              Clear access. Secure checkout.
            </h3>

            <div className="mt-5 space-y-3">
              {[
                "Secure payment flow powered by Razorpay.",
                "The same PRO feature set is included in every billing cycle.",
                "Modeled equity outcomes are scenarios, not guaranteed future value.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-xs leading-6 text-slate-500">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#030817] p-7 text-white shadow-[0_30px_80px_-50px_rgba(15,23,42,.9)]">
            <div className="pricing-dark-grid pointer-events-none absolute inset-0 opacity-50" />

            <div className="relative">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                    SELECTED ACCESS
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{selectedPlan.name}</h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-4xl font-black">₹{selectedPlan.price}</span>
                  <span className="ml-2 text-xs text-slate-500">{selectedPlan.period}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Workspace", "PRO"],
                  ["Capabilities", "8 layers"],
                  ["Checkout", "Razorpay"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-black">{value}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={loading}
                className="group mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-[0_18px_40px_-18px_rgba(37,99,235,.9)] transition hover:-translate-y-1 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Preparing secure checkout...
                  </>
                ) : (
                  <>
                    Unlock PRO · {selectedPlan.name}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <LockKeyhole className="h-3.5 w-3.5" />
                You will continue to Razorpay&apos;s secure checkout.
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT DISCLAIMER */}
        <section className="mt-7 rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-black text-amber-950">Decision support, not a promise of future value.</p>
              <p className="mt-1 text-[11px] leading-6 text-amber-800/80">
                ESOP Value Clarity provides educational calculations, scenario modelling and decision-support tools.
                Equity values, tax estimates, dilution assumptions and exit outcomes can change and are not guarantees
                or financial, investment, legal or tax advice.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .pricing-grid {
          background-image:
            linear-gradient(rgba(15,23,42,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,.035) 1px, transparent 1px);
          background-size: 38px 38px;
        }

        .pricing-dark-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 34px 34px;
        }

        @keyframes pricingOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-45px,35px) scale(1.12); }
        }

        @keyframes pricingFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes pricingBreathe {
          0%,100% { opacity: .62; }
          50% { opacity: 1; }
        }

        .pricing-orb { animation: pricingOrb 12s ease-in-out infinite; }
        .pricing-flow,
        .pricing-feature { animation: pricingFloat 6s ease-in-out infinite; }
        .pricing-chip { animation: pricingBreathe 4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .pricing-orb,
          .pricing-flow,
          .pricing-feature,
          .pricing-chip {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}