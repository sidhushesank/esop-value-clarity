"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
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

const FEATURES = [
  "Unlimited Simulations",
  "AI Assistant",
  "Advanced Reports",
  "Scenario Comparison",
  "PDF Export",
  "Priority Support",
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
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          <div className="rounded-3xl bg-slate-950 text-white p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>

              <div>
                <p className="text-sm text-slate-400">
                  Value Clarity
                </p>

                <h1 className="text-3xl font-bold">
                  PRO Active
                </h1>
              </div>
            </div>

            <p className="text-slate-300 text-lg">
              {isFounder
                ? "You have founder-level lifetime PRO access."
                : "Your account already has active PRO access."}
            </p>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center mt-8 px-6 py-3 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-100 transition"
            >
              Return to Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // Pricing page
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 transition mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-5">
            <Sparkles className="w-4 h-4" />
            Value Clarity PRO
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
            Understand your ESOPs with
            <span className="text-blue-600">
              {" "}
              more clarity.
            </span>
          </h1>

          <p className="mt-5 text-lg text-slate-600">
            Unlock the complete Value Clarity experience
            with advanced simulations, AI-powered insights,
            reports, and more.
          </p>
        </section>

        {/* Pricing */}
        <section className="grid lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const selected =
              selectedCycle === plan.cycle;

            return (
              <button
                key={plan.cycle}
                type="button"
                onClick={() =>
                  setSelectedCycle(plan.cycle)
                }
                className={`relative text-left rounded-3xl p-7 border-2 transition-all ${
                  selected
                    ? "border-blue-600 bg-white shadow-xl shadow-blue-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-950">
                    {plan.name}
                  </h2>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected
                        ? "border-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-950">
                    ₹{plan.price}
                  </span>

                  <span className="text-slate-500 mb-1">
                    {plan.period}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-500 min-h-[40px]">
                  {plan.description}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">
                    Full PRO access
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Features */}
        <section className="mt-10 rounded-3xl bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Everything in PRO
              </h2>

              <p className="text-sm text-slate-500">
                One subscription, full access.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>

                <span className="font-medium text-slate-700">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Checkout */}
        <section className="mt-8 max-w-xl mx-auto">
          <div className="rounded-3xl bg-slate-950 text-white p-8 shadow-2xl">
            <div className="text-center">
              <p className="text-sm text-slate-400">
                Selected plan
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {selectedPlan.name}
              </h2>

              <div className="mt-3">
                <span className="text-4xl font-bold">
                  ₹{selectedPlan.price}
                </span>

                <span className="text-slate-400 ml-2">
                  {selectedPlan.period}
                </span>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={loading}
                className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Continue with ${selectedPlan.name}`
                )}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4" />
                Secure payment powered by Razorpay
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400 mt-6">
          You will be redirected to Razorpay's secure
          checkout to complete your payment.
        </p>
      </div>
    </main>
  );
}