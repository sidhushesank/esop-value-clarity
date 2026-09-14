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

import Footer from "@/components/sections/Footer";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type BillingCycle = "MONTHLY" | "SIX_MONTHS" | "YEARLY";

const PLANS: {
  cycle: BillingCycle;
  name: string;
  label: string;
  price: number;
  period: string;
  description: string;
  badge?: string;
  popular?: boolean;
}[] = [
  {
    cycle: "MONTHLY",
    name: "Professional",
    label: "Monthly",
    price: 2999,
    period: "/ month",
    description:
      "Flexible PRO access for professionals who need deeper equity and offer analysis.",
  },
  {
    cycle: "SIX_MONTHS",
    name: "Professional",
    label: "6 Months",
    price: 14999,
    period: "/ 6 months",
    description:
      "Extended PRO access at a lower effective monthly cost for recurring use.",
    badge: "6-MONTH ACCESS",
    popular: true,
  },
  {
    cycle: "YEARLY",
    name: "Professional",
    label: "Yearly",
    price: 24999,
    period: "/ year",
    description:
      "Best value for professionals making ESOP and compensation analysis part of their workflow.",
    badge: "BEST VALUE",
  },
];

const FREE_FEATURES = [
  {
    title: "ESOP Simulator",
    description:
      "Model grants, vesting, valuation, dilution and an illustrative exit scenario.",
    icon: BarChart3,
  },
  {
    title: "Saved Calculations",
    description:
      "Keep your scenarios available in your private workspace for later review.",
    icon: FileText,
  },
  {
    title: "Dashboard",
    description:
      "See your recent calculations and core equity metrics in one place.",
    icon: LineChart,
  },
  {
    title: "History & Search",
    description:
      "Review, filter, sort and revisit previously saved equity scenarios.",
    icon: Clock3,
  },
  {
    title: "CSV Export",
    description:
      "Export your scenario history with useful human-readable and numeric fields.",
    icon: Receipt,
  },
  {
    title: "Indian INR Formatting",
    description:
      "Work naturally with Indian number grouping, lakhs and crores.",
    icon: Scale,
  },
];

const PRO_FEATURES = [
  {
    title: "Offer Intelligence",
    question: "What is this offer really worth?",
    description:
      "Review compensation and equity terms from an offer letter and turn them into structured decision context.",
    icon: Crown,
  },
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
    title: "Tax Estimation",
    question: "What may remain after tax?",
    description:
      "Bring estimated tax impact into the analysis instead of stopping at gross value.",
    icon: Receipt,
  },
  {
    title: "Exit Scenarios",
    question: "What could different outcomes mean?",
    description:
      "Explore illustrative exit-value scenarios without presenting them as forecasts.",
    icon: LineChart,
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
];

export default function PricingPage() {
  const [selectedCycle, setSelectedCycle] =
    useState<BillingCycle>("YEARLY");

  const [loading, setLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = PLANS.find(
    (plan) => plan.cycle === selectedCycle,
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
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";
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
        setError("Your account already has PRO access.");
        return;
      }

      // -----------------------------------------------------
      // Load Razorpay
      // -----------------------------------------------------

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      // -----------------------------------------------------
      // Create Razorpay order
      // -----------------------------------------------------

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          billingCycle: selectedCycle,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(
          orderData.message || "Unable to create payment order.",
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
        description: `Professional Workspace - ${selectedPlan.label}`,
        order_id: orderData.order.id,

        handler: async function (response: any) {
          try {
            setLoading(true);
            setError("");

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
              },
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed.",
              );
            }

            window.location.href = "/profile";
          } catch (error: any) {
            console.error(
              "Payment verification error:",
              error,
            );

            setError(
              error?.message ||
                "Payment was completed but verification failed. Please contact support.",
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

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response,
          );

          setError(
            response?.error?.description ||
              "Payment failed. Please try again.",
          );

          setLoading(false);
        },
      );

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);

      setError(
        error?.message ||
          "Unable to start payment. Please try again.",
      );

      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Scroll to existing footer contact form
  // ---------------------------------------------------------

  function openWalkthrough() {
    const contactSection =
      document.getElementById("contact-product");

    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  // ---------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------

  if (checkingAccount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </main>
    );
  }

  // ---------------------------------------------------------
  // Already PRO / Founder
  // ---------------------------------------------------------

  if (isPro) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f6f8fc] text-slate-950">
        <div className="pricing-grid pointer-events-none fixed inset-0 opacity-35" />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
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
                    {isFounder
                      ? "FOUNDER PRO · LIFETIME ACCESS"
                      : "PROFESSIONAL · ACTIVE"}
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Your deeper equity
                  <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                    decision workspace is active.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
                  Your account already includes Offer Intelligence, vesting,
                  dilution, exercise economics, tax estimation, exit
                  scenarios, reports and comparison workflows.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {[
                    "Offer Intelligence",
                    "Vesting",
                    "Dilution",
                    "Exercise",
                    "Tax",
                    "Exit",
                    "Reports",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                  ACCESS STATUS
                </p>

                <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">
                      Professional Workspace
                    </span>

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
                  Open Professional Workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div id="contact-product">
          <Footer />
        </div>

        <style jsx global>{`
          .pricing-grid {
            background-image:
              linear-gradient(
                rgba(15, 23, 42, 0.035) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(15, 23, 42, 0.035) 1px,
                transparent 1px
              );
            background-size: 38px 38px;
          }

          .pricing-dark-grid {
            background-image:
              linear-gradient(
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px
              );
            background-size: 34px 34px;
          }

          @keyframes pricingOrb {
            0%,
            100% {
              transform: translate(0, 0) scale(1);
            }

            50% {
              transform: translate(-45px, 35px) scale(1.12);
            }
          }

          .pricing-orb {
            animation: pricingOrb 12s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .pricing-orb {
              animation: none !important;
            }
          }
        `}</style>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Pricing page
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fc] text-slate-950">
      <div className="pricing-grid pointer-events-none fixed inset-0 opacity-40" />

      <div className="pointer-events-none fixed left-1/2 top-20 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-blue-200/35 blur-[150px]" />

      <div className="relative mx-auto max-w-[1380px] px-6 py-10">
        <Link
          href="/profile"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Profile
        </Link>

        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[36px] border border-slate-800 bg-[#030817] p-8 text-white shadow-[0_45px_130px_-60px_rgba(15,23,42,.95)] md:p-12">
          <div className="pricing-dark-grid pointer-events-none absolute inset-0 opacity-60" />

          <div className="pricing-orb pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-blue-600/15 blur-[110px]" />

          <div className="pointer-events-none absolute -bottom-40 left-[25%] h-80 w-80 rounded-full bg-violet-600/10 blur-[110px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-3 py-1.5">
                <Crown className="h-3.5 w-3.5 text-blue-300" />

                <span className="text-[9px] font-black uppercase tracking-[0.17em] text-blue-200">
                  ESOP VALUE CLARITY · FREE + PRO
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] md:text-6xl">
                Start free.
                <span className="block text-slate-500">
                  Go deeper when the decision matters.
                </span>

                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  One workspace. Deeper clarity.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
                Use the core ESOP workflow for free. Upgrade to PRO when you
                need deeper offer intelligence, equity analysis and decision
                workflows.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Free simulator",
                  "Saved history",
                  "Dashboard",
                  "Offer Intelligence",
                  "Vesting",
                  "Dilution",
                  "Offer Comparison",
                ].map((item, index) => (
                  <span
                    key={item}
                    className="pricing-chip rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-400"
                    style={{
                      animationDelay: `${index * 120}ms`,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                  DECISION WORKFLOW
                </p>

                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Explainable
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  [
                    "01",
                    "Explore",
                    "Start with the core ESOP model for free.",
                  ],
                  [
                    "02",
                    "Review",
                    "Keep assumptions, history and scenarios visible.",
                  ],
                  [
                    "03",
                    "Go deeper",
                    "Unlock offer and advanced equity intelligence when needed.",
                  ],
                  [
                    "04",
                    "Decide",
                    "Compare the economics behind the alternatives.",
                  ],
                ].map(([number, label, detail], index) => (
                  <div
                    key={number}
                    className="pricing-flow group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#08111f]/90 p-4 transition duration-500 hover:translate-x-2 hover:border-blue-400/20"
                    style={{
                      animationDelay: `${index * 150}ms`,
                    }}
                  >
                    <span className="font-mono text-[9px] font-black text-blue-300">
                      {number}
                    </span>

                    <div className="flex-1">
                      <p className="text-xs font-black text-white">
                        {label}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {detail}
                      </p>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FREE WORKSPACE
        ====================================================== */}
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/90 p-7 shadow-[0_25px_80px_-50px_rgba(15,23,42,.35)] backdrop-blur md:p-9">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                FREE WORKSPACE
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-4xl">
                Start with the core equity workflow.
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-7 text-slate-500">
              You do not need PRO to understand a basic ESOP scenario. The
              core modelling and workspace experience is already available
              for free.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {FREE_FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-[22px] border border-slate-200 bg-[#f8fafc] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-emerald-600 shadow-sm transition group-hover:scale-105">
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3 className="mt-5 text-sm font-black text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col gap-4 rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-950">
                Explore before you pay.
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-900/70">
                Start with the Simulator and move into the private workspace
                when you want saved analysis and history.
              </p>
            </div>

            <Link
              href="/simulator"
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              Open Simulator
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* =====================================================
            PRO WORKSPACE
        ====================================================== */}
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/90 p-7 shadow-[0_25px_80px_-50px_rgba(15,23,42,.35)] backdrop-blur md:p-9">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                PRO WORKSPACE
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-4xl">
                When the analysis goes beyond the basics.
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-7 text-slate-500">
              PRO adds the deeper workflows required to review startup
              compensation, equity terms, exercise economics and competing
              offers.
            </p>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PRO_FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="pricing-feature group relative min-h-[220px] overflow-hidden rounded-[23px] border border-slate-200 bg-[#f8fafc] p-5 transition duration-500 hover:-translate-y-2 hover:border-blue-200 hover:bg-white hover:shadow-[0_25px_50px_-35px_rgba(37,99,235,.5)]"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
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

        {/* =====================================================
            PROFESSIONAL ACCESS
        ====================================================== */}
        <section className="mt-8">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              PRO ACCESS
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-4xl">
              Upgrade when you need deeper equity intelligence.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Every paid period unlocks the same complete PRO workspace.
              Choose the commitment period that fits your work.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const selected =
                selectedCycle === plan.cycle;

              const monthlyEquivalent =
                plan.cycle === "MONTHLY"
                  ? plan.price
                  : plan.cycle === "SIX_MONTHS"
                    ? plan.price / 6
                    : plan.price / 12;

              const savingsVsMonthly =
                plan.cycle === "MONTHLY"
                  ? 0
                  : plan.cycle === "SIX_MONTHS"
                    ? 2999 * 6 - plan.price
                    : 2999 * 12 - plan.price;

              return (
                <button
                  key={plan.cycle}
                  type="button"
                  onClick={() =>
                    setSelectedCycle(plan.cycle)
                  }
                  className={`group relative overflow-hidden rounded-[28px] border p-7 text-left transition duration-500 ${
                    selected
                      ? "border-blue-500 bg-[#061225] text-white shadow-[0_30px_70px_-40px_rgba(37,99,235,.8)] -translate-y-2"
                      : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                  }`}
                >
                  {(plan.popular || plan.badge) && (
                    <div
                      className={`absolute right-5 top-5 rounded-full border px-3 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${
                        selected
                          ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                          : "border-blue-100 bg-blue-50 text-blue-600"
                      }`}
                    >
                      {plan.badge ?? "POPULAR"}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                        selected
                          ? "border-blue-400"
                          : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-black ${
                          selected
                            ? "text-white"
                            : "text-slate-950"
                        }`}
                      >
                        {plan.name}
                      </p>

                      <p
                        className={`mt-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                          selected
                            ? "text-blue-300"
                            : "text-blue-600"
                        }`}
                      >
                        {plan.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-[-0.05em]">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>

                    <span
                      className={`mb-1 text-xs ${
                        selected
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>

                  <p
                    className={`mt-4 min-h-[60px] text-xs leading-6 ${
                      selected
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {plan.description}
                  </p>

                  {plan.cycle !== "MONTHLY" && (
                    <div
                      className={`mt-5 rounded-xl border p-3 ${
                        selected
                          ? "border-white/10 bg-white/[0.04]"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <p
                        className={`text-[8px] font-black uppercase tracking-[0.12em] ${
                          selected
                            ? "text-blue-300"
                            : "text-blue-600"
                        }`}
                      >
                        Effective monthly cost
                      </p>

                      <p className="mt-1 text-sm font-black">
                        ₹
                        {Math.round(
                          monthlyEquivalent,
                        ).toLocaleString("en-IN")}{" "}
                        / month
                      </p>

                      <p
                        className={`mt-1 text-[10px] ${
                          selected
                            ? "text-emerald-300"
                            : "text-emerald-600"
                        }`}
                      >
                        Save ₹
                        {savingsVsMonthly.toLocaleString(
                          "en-IN",
                        )}{" "}
                        versus monthly billing
                      </p>
                    </div>
                  )}

                  <div
                    className={`mt-6 border-t pt-5 ${
                      selected
                        ? "border-white/10"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-black">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          selected
                            ? "text-emerald-300"
                            : "text-emerald-600"
                        }`}
                      />
                      Full PRO workspace
                    </div>

                    <p
                      className={`mt-2 text-[10px] leading-5 ${
                        selected
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      Offer Intelligence, vesting, dilution,
                      exercise, tax estimation, exit scenarios,
                      reports and comparison.
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            PROFESSIONAL TEAMS · EARLY ACCESS
        ====================================================== */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_25px_80px_-50px_rgba(15,23,42,.25)]">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
              PROFESSIONAL USERS
            </p>

            <h3 className="mt-3 text-2xl font-black tracking-[-0.035em]">
              Built for people who repeatedly handle equity decisions.
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              The Professional workspace is designed for people who regularly
              review, explain, compare or model startup compensation and
              employee equity.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "CAs and tax professionals",
                "Startup founders",
                "HR / People teams",
                "Recruiters",
                "Startup advisors",
                "Employment lawyers",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-[#030817] p-7 text-white shadow-[0_30px_80px_-50px_rgba(15,23,42,.9)]">
            <div className="pricing-dark-grid pointer-events-none absolute inset-0 opacity-50" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                  PROFESSIONAL TEAMS
                </p>

                <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-200">
                  EARLY ACCESS
                </span>
              </div>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.035em]">
                Do you handle equity across a team or practice?
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                We are currently speaking with HR teams, advisory firms,
                recruiting operations, startup finance teams and professional
                practices to understand how they handle repeated equity and
                compensation workflows.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {[
                  "Multiple cases",
                  "Repeat workflows",
                  "Team requirements",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] leading-5 text-slate-500">
                Team workspaces, seats and organization-level billing are not
                being offered as a standard plan yet. We are validating the
                right workflow before building it.
              </p>

              <button
                type="button"
                onClick={openWalkthrough}
                className="group mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-black text-white transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-blue-500/10"
              >
                Discuss your workflow
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            PAYMENT / TRUST
        ====================================================== */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-7">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">
              PAYMENT & PRODUCT TRUST
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">
              Clear upgrade. Secure checkout.
            </h3>

            <div className="mt-5 space-y-3">
              {[
                "The core workspace remains free.",
                "PRO unlocks deeper equity and offer intelligence.",
                "Secure payment flow powered by Razorpay.",
                "Modeled outcomes are scenarios, not guaranteed future value.",
                "Offer extraction is assistance and should be reviewed before important decisions.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-xs leading-6 text-slate-500"
                >
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
                    SELECTED PRO ACCESS
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    {selectedPlan.name}
                  </h3>

                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    {selectedPlan.label}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-4xl font-black">
                    ₹
                    {selectedPlan.price.toLocaleString(
                      "en-IN",
                    )}
                  </span>

                  <span className="ml-2 text-xs text-slate-500">
                    {selectedPlan.period}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Workspace", "PRO"],
                  ["Capabilities", "8 layers"],
                  ["Checkout", "Razorpay"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
                      {label}
                    </p>

                    <p className="mt-2 text-sm font-black">
                      {value}
                    </p>
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
                    Continue with PRO
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

        {/* =====================================================
            PRODUCT DISCLAIMER
        ====================================================== */}
        <section className="mt-7 rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="text-xs font-black text-amber-950">
                Decision support, not a promise of future value.
              </p>

              <p className="mt-1 text-[11px] leading-6 text-amber-800/80">
                ESOP Value Clarity provides scenario modelling, structured
                offer review and decision-support tools. Equity values, tax
                estimates, dilution assumptions and exit outcomes can change
                and are not guarantees or financial, investment, legal or tax
                advice.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* =======================================================
          EXISTING SHARED FOOTER / CONTACT SYSTEM
      ======================================================= */}
      <div id="contact-product">
        <Footer />
      </div>

      <style jsx global>{`
        .pricing-grid {
          background-image:
            linear-gradient(
              rgba(15, 23, 42, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(15, 23, 42, 0.035) 1px,
              transparent 1px
            );
          background-size: 38px 38px;
        }

        .pricing-dark-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 34px 34px;
        }

        @keyframes pricingOrb {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(-45px, 35px) scale(1.12);
          }
        }

        @keyframes pricingFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes pricingBreathe {
          0%,
          100% {
            opacity: 0.62;
          }

          50% {
            opacity: 1;
          }
        }

        .pricing-orb {
          animation: pricingOrb 12s ease-in-out infinite;
        }

        .pricing-flow,
        .pricing-feature {
          animation: pricingFloat 6s ease-in-out infinite;
        }

        .pricing-chip {
          animation: pricingBreathe 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .pricing-orb,
          .pricing-flow,
          .pricing-feature,
          .pricing-chip {
            animation: none !important;
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  );
}