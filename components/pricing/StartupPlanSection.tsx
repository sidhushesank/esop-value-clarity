"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, LockKeyhole } from "lucide-react";

import { STARTUP_PLAN } from "@/lib/company-pricing";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Startup plan (Startup Equity Desk) card for /pricing#startup.
 * Self-contained: loads Razorpay, creates the order, verifies the payment
 * and sends the founder to /company. Uses the same contact-form prefill
 * event as the Advisor plan for trial / custom requests.
 */

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function openContact(topic: "FREE_TRIAL" | "CUSTOM_BILLING") {
  const message =
    topic === "FREE_TRIAL"
      ? "Hello, I am a startup founder and would like a free trial of the Startup plan (cap table and ESOP grants). Company: \nNumber of employees with ESOPs: "
      : `Hello, I would like a custom billing cycle / more than ${STARTUP_PLAN.includedOptionHolders} option holders on the Startup plan. Company: \nWhat I need: `;

  window.dispatchEvent(new CustomEvent("evc:contact-prefill", { detail: { topic, message } }));
  document.getElementById("contact-product")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function StartupPlanSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.location.hash === "#startup") {
      document.getElementById("startup")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  async function buy() {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (!(await loadRazorpay())) throw new Error("Unable to load Razorpay Checkout.");

      const orderRes = await fetch("/api/company/billing/create-order", {
        method: "POST",
        credentials: "include",
      });

      if (orderRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      const order = await orderRes.json();
      if (!orderRes.ok || !order.success) {
        throw new Error(order.message || "Unable to start the Startup plan payment.");
      }

      const rzp = new (window as any).Razorpay({
        key: order.key,
        amount: order.order.amount,
        currency: order.order.currency,
        name: "ESOP Value Clarity",
        description: "Startup plan · Annual",
        order_id: order.order.id,
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/company/billing/verify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verify = await verifyRes.json();
            if (!verifyRes.ok || !verify.success) {
              throw new Error(verify.message || "Payment was completed but verification failed.");
            }
            window.location.href = "/company";
          } catch (e: any) {
            setError(
              e?.message ||
                "Payment was completed but verification failed. Please contact us with your payment reference."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.on("payment.failed", (response: any) => {
        setError(response?.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (e: any) {
      setError(e?.message || "Unable to start the Startup plan payment.");
      setLoading(false);
    }
  }

  return (
    <section
      id="startup"
      className="mt-8 scroll-mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_-60px_rgba(15,23,42,.5)] md:p-9"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">FOR STARTUPS</p>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-blue-700">
              ANNUAL
            </span>
          </div>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Startup plan</h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Run your cap table and ESOPs in one place, and give every employee a clear page showing
            what their options are actually worth after tax.
          </p>

          <div className="mt-6 space-y-3">
            {[
              "Cap table built from every allotment, transfer, conversion and buyback, as of any date",
              "ESOP pool and grants, with checks flagged before you issue",
              "A private page for each employee: vesting, exercise cost, tax and take-home, with an Accept button",
              "Upload signed grant letters; employees download them securely",
              `Up to ${STARTUP_PLAN.includedOptionHolders} employees with options included`,
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-xs leading-6 text-slate-600">
                <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">ONE PLAN · ONE YEAR</p>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black tracking-[-0.04em]">
              ₹{STARTUP_PLAN.priceRupees.toLocaleString("en-IN")}
            </span>
            <span className="pb-1 text-xs font-bold text-slate-400">/ year</span>
          </div>

          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Includes {STARTUP_PLAN.includedOptionHolders} option holders.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => void buy()}
            disabled={loading}
            className="group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Preparing secure checkout...
              </>
            ) : (
              <>
                Get the Startup plan
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openContact("FREE_TRIAL")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-800 transition hover:border-blue-300"
            >
              Request a free trial
            </button>
            <button
              type="button"
              onClick={() => openContact("CUSTOM_BILLING")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-800 transition hover:border-blue-300"
            >
              More employees / custom
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
            <LockKeyhole className="h-3.5 w-3.5" />
            Secure checkout via Razorpay. Taxes, if applicable, as per your invoice.
          </div>

          <p className="mt-3 text-[10px] leading-4 text-slate-400">
            A record-keeping and preparation aid. Grant letters and the ESOP scheme are prepared by
            your CS or lawyer; figures are estimates, not legal or tax advice.
          </p>
        </div>
      </div>
    </section>
  );
}
