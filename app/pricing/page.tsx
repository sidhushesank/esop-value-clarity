"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Coffee,
  Crown,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Minus,
  Receipt,
  Scale,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import Footer from "@/components/sections/Footer";
import { ADVISOR_PLAN } from "@/lib/advisor-pricing";
import { STARTUP_PLAN } from "@/lib/company-pricing";

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ============================================================
   PLANS AND PRICES
   Checkout amounts are decided on the server; these are display
   values and must match the server's prices.
============================================================ */

type BillingCycle = "MONTHLY" | "SIX_MONTHS" | "YEARLY";
type Audience = "individuals" | "organisations";
type PlanKey = "PRO" | "STARTUP" | "ADVISOR" | "TEAM";

const PRO_PRICES: Record<BillingCycle, { label: string; short: string; price: number; months: number; period: string }> = {
  MONTHLY: { label: "Monthly", short: "Monthly", price: 2999, months: 1, period: "month" },
  SIX_MONTHS: { label: "6 months", short: "6 months", price: 14999, months: 6, period: "6 months" },
  YEARLY: { label: "Yearly", short: "Yearly", price: 24999, months: 12, period: "year" },
};

const CYCLES = Object.keys(PRO_PRICES) as BillingCycle[];

const TEAM_PRICE = 145000;
const TEAM_MEMBERS = 20;

const CUSTOMERS = ["Ather Energy", "Revolt Motors"];

function inr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function savingPct(cycle: BillingCycle) {
  const p = PRO_PRICES[cycle];
  const full = PRO_PRICES.MONTHLY.price * p.months;
  return Math.round(((full - p.price) / full) * 100);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------- comparison tables ---------- */

type Cell = boolean | string;

const INDIVIDUAL_ROWS: { group: string; rows: { label: string; free: Cell; pro: Cell }[] }[] = [
  {
    group: "Core workspace",
    rows: [
      { label: "ESOP simulator: grant, vesting, valuation, dilution, exit", free: true, pro: true },
      { label: "Cap table builder and round modelling", free: true, pro: true },
      { label: "Saved calculations and dashboard", free: true, pro: true },
      { label: "History, search and CSV export", free: true, pro: true },
      { label: "Indian number formatting (lakhs, crores)", free: true, pro: true },
    ],
  },
  {
    group: "PRO intelligence",
    rows: [
      { label: "Offer Intelligence: what an offer is really worth", free: false, pro: true },
      { label: "Vesting intelligence: cliffs, vested and unvested", free: false, pro: true },
      { label: "Dilution after future funding rounds", free: false, pro: true },
      { label: "Exercise decision: cash needed to exercise", free: false, pro: true },
      { label: "Tax estimation: what remains after tax", free: false, pro: true },
      { label: "Exit scenarios and side-by-side comparison", free: false, pro: true },
      { label: "Reports", free: false, pro: true },
    ],
  },
];

const ORG_ROWS: { group: string; rows: { label: string; startup: Cell; advisor: Cell; team: Cell }[] }[] = [
  {
    group: "Plan",
    rows: [
      { label: "Built for", startup: "Startups and founders", advisor: "CA and CS firms", team: "HR and people teams" },
      { label: "Price", startup: `${inr(STARTUP_PLAN.priceRupees)} / year`, advisor: `${inr(ADVISOR_PLAN.priceRupees)} / year`, team: `${inr(TEAM_PRICE)} / year` },
      {
        label: "Included",
        startup: `${STARTUP_PLAN.includedOptionHolders} employees with options`,
        advisor: `${ADVISOR_PLAN.includedClients} client companies`,
        team: `${TEAM_MEMBERS} members`,
      },
      { label: "Free trial", startup: "On request", advisor: "On request", team: false },
    ],
  },
  {
    group: "Cap table and ESOPs",
    rows: [
      { label: "Cap table as of any date, fully diluted", startup: true, advisor: false, team: false },
      { label: "ESOP pool, grants and options register", startup: true, advisor: false, team: false },
      { label: "Private grant page for each employee, with Accept", startup: true, advisor: false, team: false },
      { label: "Signed grant letters, downloadable by employees", startup: true, advisor: false, team: false },
      { label: "Import cap table and grants from Excel", startup: true, advisor: false, team: false },
      { label: "Exercises and allotment: PAS-3, TDS or deferral, Form 3921", startup: true, advisor: false, team: false },
      { label: "ESOP expense report: Ind AS 102, ICAI Guidance Note, ASC 718", startup: true, advisor: false, team: false },
      { label: "India or US company setting", startup: true, advisor: false, team: false },
    ],
  },
  {
    group: "Compliance for clients",
    rows: [
      { label: "ESOP Diligence Pack: register checks, resolutions, exports", startup: false, advisor: true, team: false },
      { label: "Tax-Event Ledger: perquisite and TDS estimates", startup: false, advisor: true, team: false },
      { label: "Foreign Equity Tax Pack: RSU/ESPP gains, Schedule FA, FTC, Form 67", startup: false, advisor: true, team: false },
      { label: "SBI TT rates, share prices and splits fetched for every date", startup: false, advisor: true, team: false },
    ],
  },
  {
    group: "Deadlines and control",
    rows: [
      { label: "Compliance calendar with e-mails 30, 7 and 1 day before", startup: true, advisor: true, team: false },
      { label: "Team logins: Admin and Viewer", startup: true, advisor: true, team: false },
      { label: "Change history with export", startup: true, advisor: true, team: false },
    ],
  },
  {
    group: "Team",
    rows: [
      { label: "PRO access for every member", startup: false, advisor: false, team: true },
      { label: "Member preview, compare and analysis", startup: false, advisor: false, team: true },
      { label: "Workspace-level analytics", startup: false, advisor: false, team: true },
    ],
  },
];

/* ---------- FAQ ---------- */

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the simulator really free?",
    a: "Yes. The ESOP simulator, saved calculations, dashboard, history and CSV export are free, with no card needed. You only pay for PRO or an organisation plan.",
  },
  {
    q: "Do plans renew automatically?",
    a: "No. Every plan is a one-time payment for the period you choose. When it ends you can renew from this page, and nothing is charged without you paying again.",
  },
  {
    q: "How do I pay?",
    a: "Checkout is handled securely by Razorpay. Prices are in Indian rupees, and the plan is activated as soon as the payment is confirmed.",
  },
  {
    q: "Which plan is right for my company?",
    a: "If you want to run your own cap table and ESOP grants, and show employees what their options are worth, choose the Startup plan. If you are a CA or CS firm handling ESOP work for clients, choose the Advisor plan. If you want PRO access and analytics for a group of people, choose Team Intelligence.",
  },
  {
    q: "Can I try the Startup or Advisor plan first?",
    a: "Yes. Click “Request a free trial” on the plan and tell us about your company or firm. We set the trial up for you.",
  },
  {
    q: "We need more employees, more clients or a different billing cycle.",
    a: "Tell us what you need using the form below and we will arrange a plan that fits.",
  },
  {
    q: "You're one founder. What happens to my data if EVC shuts down?",
    a: "Every register, report, tax ledger, foreign tax workbook and change history downloads to Excel today. Your records never depend on EVC staying around.",
  },
  {
    q: "Why no monthly plan for companies and firms?",
    a: "Filings, reminders and registers run across a full year, so the company plans are annual. If you need a different cycle, use the form below and we'll arrange it.",
  },
  {
    q: "Is this financial or tax advice?",
    a: "No. EVC gives calculations and scenarios to help you decide. Tax figures are estimates. For material decisions, check your company documents and speak to a qualified professional.",
  },
];

/* ============================================================
   RAZORPAY HELPERS
============================================================ */

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);

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
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type CheckoutConfig = {
  createUrl: string;
  createBody?: Record<string, unknown>;
  verifyUrl: string;
  description: string;
  successUrl: string;
};

const CHECKOUTS: Record<PlanKey, (cycle: BillingCycle) => CheckoutConfig> = {
  PRO: (cycle) => ({
    createUrl: "/api/payments/create-order",
    createBody: { checkoutType: "PRO", billingCycle: cycle },
    verifyUrl: "/api/payments/verify",
    description: `Professional PRO · ${PRO_PRICES[cycle].label}`,
    successUrl: "/pro",
  }),
  TEAM: () => ({
    createUrl: "/api/payments/create-order",
    createBody: { checkoutType: "TEAM" },
    verifyUrl: "/api/payments/verify",
    description: "Team Intelligence · Annual Workspace",
    successUrl: "/team",
  }),
  ADVISOR: () => ({
    createUrl: "/api/advisor/billing/create-order",
    verifyUrl: "/api/advisor/billing/verify",
    description: "Advisor plan · Annual",
    successUrl: "/advisor",
  }),
  STARTUP: () => ({
    createUrl: "/api/company/billing/create-order",
    verifyUrl: "/api/company/billing/verify",
    description: "Startup plan · Annual",
    successUrl: "/company",
  }),
};

const CONTACT_MESSAGES: Record<"STARTUP" | "ADVISOR" | "TEAM", { trial: string; custom: string }> = {
  STARTUP: {
    trial:
      "Hello, I am a startup founder and would like a free trial of the Startup plan (cap table and ESOP grants). Company: \nNumber of employees with ESOPs: ",
    custom: `Hello, I would like a custom billing cycle / more than ${STARTUP_PLAN.includedOptionHolders} option holders on the Startup plan. Company: \nWhat I need: `,
  },
  ADVISOR: {
    trial:
      "Hello, I run a CA/CS practice and would like a free trial of the Advisor plan. My firm: \nNumber of client companies: ",
    custom: `Hello, I would like a custom billing cycle / more than ${ADVISOR_PLAN.includedClients} client companies on the Advisor plan. My firm: \nWhat I need: `,
  },
  TEAM: {
    trial: "Hello, I would like to discuss Team Intelligence for our team. Company: \nNumber of people: ",
    custom: `Hello, I would like Team Intelligence for more than ${TEAM_MEMBERS} members or a different billing cycle. Company: \nWhat I need: `,
  },
};

/* ============================================================
   INTERACTION HOOKS
============================================================ */

/** Adds `is-in` to every [data-reveal] inside the root once it scrolls into view.
 *  Re-scans when `rescanKey` changes (e.g. after switching tabs). */
function useReveal(root: RefObject<HTMLElement | null>, rescanKey: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      targets.forEach((t) => t.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root, rescanKey]);
}

/** Ripple on any element with the `pr-ripple` class. */
function useRipple(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    function onDown(event: PointerEvent) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(".pr-ripple");
      if (!target || prefersReducedMotion() || target.hasAttribute("disabled")) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const dot = document.createElement("span");
      dot.className = "pr-ripple-dot";
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${event.clientX - rect.left - size / 2}px`;
      dot.style.top = `${event.clientY - rect.top - size / 2}px`;
      target.appendChild(dot);
      window.setTimeout(() => dot.remove(), 700);
    }
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, [root]);
}

/** Tracks the cursor inside an element as CSS variables --mx / --my. */
function spotlight(event: ReactMouseEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/** Smoothly counts a number from its previous value to the new one. */
function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    const start = mounted.current ? from.current : value * 0.6;
    mounted.current = true;
    const t0 = performance.now();
    const duration = 750;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = start + (value - start) * eased;
      from.current = n;
      setShown(n);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="tabular-nums">{format(shown)}</span>;
}

/** A pill that slides under the active option of a segmented control. */
function useSlidingPill<T extends string>(active: T) {
  const container = useRef<HTMLDivElement | null>(null);
  const items = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const btn = items.current[active];
    const box = container.current;
    if (!btn || !box) return;
    setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const register = (key: T) => (node: HTMLButtonElement | null) => {
    items.current[key] = node;
  };

  return { container, register, pill, measure };
}

/* ============================================================
   PAGE
============================================================ */

export default function PricingPage() {
  const [audience, setAudience] = useState<Audience>("individuals");
  const [cycle, setCycle] = useState<BillingCycle>("YEARLY");

  const [checkingAccount, setCheckingAccount] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [errors, setErrors] = useState<Partial<Record<PlanKey, string>>>({});

  const pageRef = useRef<HTMLElement | null>(null);
  const plansRef = useRef<HTMLDivElement | null>(null);

  const [who, setWho] = useWho();

  const audiencePill = useSlidingPill<Audience>(audience);
  const cyclePill = useSlidingPill<BillingCycle>(cycle);

  useReveal(pageRef, audience);
  useRipple(pageRef);

  // The billing switch is re-mounted when returning to the Individuals tab.
  useLayoutEffect(() => {
    if (audience === "individuals") cyclePill.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  /* ---------- account ---------- */
  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!response.ok) return;
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
    void loadAccount();
  }, []);

  /* ---------- deep links: /pricing#startup, #advisor, #team, #pro ---------- */
  useEffect(() => {
    function applyHash() {
      const hash = window.location.hash.replace("#", "");
      if (!hash) {
        // No link target: open the tab that matches who the visitor said they are on the home page.
        const saved = readWho();
        if (saved) setAudience(saved === "employee" ? "individuals" : "organisations");
        return;
      }
      if (["startup", "advisor", "team"].includes(hash)) setAudience("organisations");
      if (hash === "pro") setAudience("individuals");
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  function setError(plan: PlanKey, message: string) {
    setErrors((prev) => ({ ...prev, [plan]: message }));
  }

  /* ---------- one checkout for every plan ---------- */
  async function checkout(plan: PlanKey) {
    if (busy) return;
    setError(plan, "");

    if (plan === "PRO") {
      if (isFounder) return setError(plan, "Your founder account already has lifetime PRO access.");
      if (isPro) return setError(plan, "Your account already has PRO access.");
    }

    const config = CHECKOUTS[plan](cycle);
    setBusy(plan);

    try {
      if (!(await loadRazorpayScript())) throw new Error("Unable to load Razorpay Checkout.");

      const orderResponse = await fetch(config.createUrl, {
        method: "POST",
        credentials: "include",
        ...(config.createBody
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(config.createBody) }
          : {}),
      });

      if (orderResponse.status === 401) {
        window.location.href = "/login";
        return;
      }

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Unable to create payment order.");
      }

      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "ESOP Value Clarity",
        description: config.description,
        order_id: orderData.order.id,
        theme: { color: "#042653" },
        handler: async (response: any) => {
          try {
            setBusy(plan);
            const verifyResponse = await fetch(config.verifyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed.");
            }
            window.location.href = config.successUrl;
          } catch (verificationError: any) {
            console.error(`${plan} payment verification error:`, verificationError);
            setError(
              plan,
              verificationError?.message ||
                "Payment was completed but verification failed. Please contact us with your payment reference."
            );
          } finally {
            setBusy(null);
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });

      razorpay.on("payment.failed", (response: any) => {
        console.error(`Razorpay ${plan} payment failed:`, response);
        setError(plan, response?.error?.description || "Payment failed. Please try again.");
        setBusy(null);
      });

      razorpay.open();
    } catch (error: any) {
      console.error(`${plan} payment error:`, error);
      setError(plan, error?.message || "Unable to start payment.");
      setBusy(null);
    }
  }

  function contact(plan: "STARTUP" | "ADVISOR" | "TEAM" | "ANY", kind: "trial" | "custom") {
    const topic = kind === "trial" && plan !== "TEAM" ? "FREE_TRIAL" : "CUSTOM_BILLING";
    const message =
      plan === "ANY"
        ? "Hello, we need a custom plan (more seats or clients, or a different billing cycle). Company: \nWhich plan: \nWhat we need: "
        : CONTACT_MESSAGES[plan][kind];
    window.dispatchEvent(new CustomEvent("evc:contact-prefill", { detail: { topic, message } }));
    document.getElementById("contact-product")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseWho(next: Who, source: string) {
    setWho(next);
    saveWho(next, source);
    setAudience(next === "employee" ? "individuals" : "organisations");
  }

  function goToPlan(target: string) {
    setAudience(target === "pro" ? "individuals" : "organisations");
    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }

  function switchAudience(next: Audience) {
    setAudience(next);
    if (plansRef.current && plansRef.current.getBoundingClientRect().top < 0) {
      plansRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const pro = PRO_PRICES[cycle];
  const proLabel = isFounder ? "Founder PRO active" : isPro ? "PRO is active" : "Upgrade to PRO";

  return (
    <main ref={pageRef} className="evc-pricing min-h-screen bg-[#F7F9FC] text-[#0b1220]">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden">
        <div className="pr-dots pointer-events-none absolute inset-0" />
        <div className="pr-orb pointer-events-none absolute left-1/2 top-[-200px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#5B9BFF]/15 blur-[140px]" />
        <div className="pr-orb pr-orb-2 pointer-events-none absolute right-[10%] top-[60px] h-[260px] w-[260px] rounded-full bg-[#F2B421]/20 blur-[110px]" />

        <div className="relative mx-auto max-w-[1200px] px-4 pb-12 pt-16 text-center sm:px-6 md:pt-24">
          <p className="pr-fade inline-flex items-center gap-2 rounded-full border border-[#042653]/10 bg-white px-3 py-1 text-xs font-semibold text-[#042653] shadow-sm">
            <Sparkles className="pr-twinkle h-3.5 w-3.5 text-[#B7800E]" />
            Pricing
          </p>
          <h1 className="pr-fade mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#042653] sm:text-6xl" style={{ animationDelay: "60ms" }}>
            Cheaper than{" "}
            <span className="relative inline-block whitespace-nowrap">
              one mistake.
              <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4">
                <path className="pr-draw" d="M3 11 C 70 3, 150 3, 297 9" fill="none" stroke="#F2B421" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="pr-fade mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600" style={{ animationDelay: "120ms" }}>
            Start free. Pay when the equity, the filing or the client is real. No auto-renewal, no hidden seats, and no
            salesperson calling you on a Sunday.
          </p>

          {/* Audience switch */}
          <div className="pr-fade mt-10 flex justify-center" style={{ animationDelay: "180ms" }}>
            <div
              ref={audiencePill.container}
              role="tablist"
              aria-label="Who is this for"
              className="relative flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_-24px_rgba(4,38,83,0.5)]"
            >
              {audiencePill.pill ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 top-1.5 rounded-xl bg-[#042653] shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ left: audiencePill.pill.left, width: audiencePill.pill.width }}
                />
              ) : null}
              {(
                [
                  ["individuals", "Individuals", User],
                  ["organisations", "Companies & firms", Building2],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  ref={audiencePill.register(key)}
                  role="tab"
                  type="button"
                  aria-selected={audience === key}
                  onClick={() => switchAudience(key)}
                  className={`group relative z-10 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-colors duration-300 sm:px-7 ${
                    audience === key ? "text-white" : "text-slate-600 hover:text-[#042653]"
                  }`}
                >
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  {label}
                  {key === "organisations" && audience !== key ? (
                    <span className="pr-bob absolute -right-1 -top-2 rounded-full bg-[#F2B421] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#020d1f] shadow">
                      New
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PLAN CARDS
      ====================================================== */}
      <section ref={plansRef} className="relative mx-auto max-w-[1200px] scroll-mt-24 px-4 pb-10 sm:px-6">
        {audience === "individuals" ? (
          <div key="ind" className="pr-swap">
            {/* Billing switch */}
            <div className="mb-8 flex justify-center">
              <div ref={cyclePill.container} className="relative inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm shadow-sm">
                {cyclePill.pill ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 top-1 rounded-full bg-slate-900 shadow transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ left: cyclePill.pill.left, width: cyclePill.pill.width }}
                  />
                ) : null}
                {CYCLES.map((c) => (
                  <button
                    key={c}
                    ref={cyclePill.register(c)}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-semibold transition-colors duration-300 sm:px-4 ${
                      cycle === c ? "text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {PRO_PRICES[c].short}
                    {c !== "MONTHLY" ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors duration-300 ${
                          cycle === c ? "bg-[#F2B421] text-[#020d1f]" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        −{savingPct(c)}%
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <PlanCard
                index={0}
                icon={User}
                name="Free"
                tagline="For anyone with an ESOP grant who wants to understand it."
                amount={0}
                period="forever"
                note="No card needed"
                features={[
                  "ESOP simulator: grant, vesting, valuation, dilution and exit",
                  "Cap table builder with round modelling",
                  "Saved calculations and dashboard",
                  "History, search and CSV export",
                  "Indian number formatting",
                ]}
                cta={{ label: "Start free", href: "/simulator" }}
              />

              <PlanCard
                id="pro"
                index={1}
                icon={Crown}
                name="PRO"
                tagline="For people who make or explain equity decisions often."
                amount={pro.price}
                period={pro.period === "month" ? "/ month" : `/ ${pro.period}`}
                note={
                  cycle === "MONTHLY"
                    ? "Pay month by month"
                    : `${inr(pro.price / pro.months)} a month · save ${inr(PRO_PRICES.MONTHLY.price * pro.months - pro.price)}`
                }
                badge="Most popular"
                highlight
                featuresTitle="Everything in Free, plus"
                features={[
                  "Offer Intelligence: what an offer is really worth",
                  "Vesting, dilution and exercise cost",
                  "Tax estimate and take-home after tax",
                  "Exit scenarios and side-by-side comparison",
                  "Reports",
                ]}
                cta={{
                  label: checkingAccount ? "Checking your account..." : proLabel,
                  onClick: () => void checkout("PRO"),
                  loading: busy === "PRO",
                  disabled: checkingAccount || isPro || isFounder,
                }}
                error={errors.PRO}
              />

              {/* Cross-sell card */}
              <div
                data-reveal
                onMouseMove={spotlight}
                className="pr-reveal pr-spot pr-spot-light group/x relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-7 hover:border-[#F2B421]/60 hover:bg-white"
                style={{ transitionDelay: "160ms" }}
              >
                <div className="pr-spot-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/x:opacity-100" />
                <div className="relative">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F2B421]/15 text-[#8A5A00] transition duration-500 group-hover/x:rotate-[-8deg] group-hover/x:scale-110">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#042653]">Buying for a company?</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Run your cap table and ESOP grants, manage ESOP work for client companies, or give a whole team PRO.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {[
                      `Startup plan · ${inr(STARTUP_PLAN.priceRupees)} / year`,
                      `Advisor plan · ${inr(ADVISOR_PLAN.priceRupees)} / year`,
                      `Team Intelligence · ${inr(TEAM_PRICE)} / year`,
                    ].map((t, i) => (
                      <li key={t} className="pr-tick flex items-center gap-2" style={{ animationDelay: `${300 + i * 90}ms` }}>
                        <BadgeCheck className="h-4 w-4 text-[#B7800E]" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => switchAudience("organisations")}
                  className="pr-ripple group relative mt-8 inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#042653]/15 bg-white text-sm font-semibold text-[#042653] transition hover:border-[#042653]/40 hover:shadow-md"
                >
                  See company plans
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div key="org" className="pr-swap">
            <p className="mb-8 text-center text-sm text-slate-500">
              Annual plans · activated as soon as you pay · free trial on request for startups and advisory firms
            </p>

            <div className="grid gap-5 lg:grid-cols-3">
              <PlanCard
                id="startup"
                index={0}
                icon={Building2}
                name="Startup"
                tagline="Run your cap table and ESOPs, and show every employee what theirs is worth."
                amount={STARTUP_PLAN.priceRupees}
                period="/ year"
                note={`Up to ${STARTUP_PLAN.includedOptionHolders} employees with options`}
                badge="New"
                highlight
                features={[
                  "Cap table as of any date, fully diluted",
                  "ESOP pool and grants, with checks before you issue",
                  "A private page for each employee: vesting, tax, take-home, Accept",
                  "Exercises → PAS-3, TDS or deferral, Form 3921",
                  "ESOP expense report: Ind AS 102 / ASC 718",
                  "Compliance calendar with e-mail reminders",
                  "Admin and Viewer logins, change history",
                ]}
                cta={{ label: "Get the Startup plan", onClick: () => void checkout("STARTUP"), loading: busy === "STARTUP", disabled: busy !== null && busy !== "STARTUP" }}
                secondary={{ label: "Request a free trial", onClick: () => contact("STARTUP", "trial") }}
                error={errors.STARTUP}
              />

              <PlanCard
                id="advisor"
                index={1}
                icon={Briefcase}
                name="Advisor"
                tagline="For CA and CS firms running ESOP compliance for client companies."
                amount={ADVISOR_PLAN.priceRupees}
                period="/ year"
                note={`Up to ${ADVISOR_PLAN.includedClients} client companies`}
                features={[
                  "One console for every client company",
                  "ESOP Diligence Pack: register checks, resolutions, exports",
                  "Tax-Event Ledger: perquisite and TDS estimates",
                  "Foreign Equity Tax Pack: RSU/ESPP gains, Schedule FA, Form 67",
                  "SBI TT rates and share prices for every date",
                  "Compliance calendar across all clients",
                  "Team logins and change history",
                ]}
                cta={{ label: "Get the Advisor plan", onClick: () => void checkout("ADVISOR"), loading: busy === "ADVISOR", disabled: busy !== null && busy !== "ADVISOR" }}
                secondary={{ label: "Request a free trial", onClick: () => contact("ADVISOR", "trial") }}
                error={errors.ADVISOR}
              />

              <PlanCard
                id="team"
                index={2}
                icon={Users}
                name="Team Intelligence"
                tagline="One workspace that gives a whole team PRO, with analytics for the admin."
                amount={TEAM_PRICE}
                period="/ year"
                note={`Up to ${TEAM_MEMBERS} members`}
                features={[
                  `PRO access for up to ${TEAM_MEMBERS} existing EVC users`,
                  "Member preview, compare and analysis",
                  "Workspace-level analytics",
                  "One admin, 12 months",
                ]}
                cta={{ label: "Get Team Intelligence", onClick: () => void checkout("TEAM"), loading: busy === "TEAM", disabled: busy !== null && busy !== "TEAM" }}
                secondary={{ label: "Talk to us first", onClick: () => contact("TEAM", "trial") }}
                error={errors.TEAM}
              />
            </div>

            {/* Custom strip */}
            <div
              data-reveal
              onMouseMove={spotlight}
              className="pr-reveal pr-spot group/c relative mt-5 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[24px] bg-[#042653] p-7 text-white sm:flex-row sm:items-center"
            >
              <div className="pr-spot-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/c:opacity-100" />
              <div className="pr-grid pointer-events-none absolute inset-0 opacity-[0.08]" />
              <div className="relative">
                <p className="text-lg font-semibold tracking-[-0.02em]">Need more seats, more clients or a different billing cycle?</p>
                <p className="mt-1 text-sm text-slate-300">Tell us what you need and we&apos;ll set up a plan that fits.</p>
              </div>
              <button
                type="button"
                onClick={() => contact("ANY", "custom")}
                className="pr-ripple pr-btn-gold group relative inline-flex h-11 shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-[#F2B421] px-5 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5 hover:bg-[#ffc43d] hover:shadow-[0_12px_30px_-10px_rgba(242,180,33,0.8)]"
              >
                <span className="relative">Talk to us</span>
                <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* Trust row */}
        <div data-reveal className="pr-reveal mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            In use at
            <span className="font-semibold text-[#042653]">{CUSTOMERS.join(" · ")}</span>
          </span>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" />
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-4 w-4" /> Secure checkout by Razorpay
          </span>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" />
          <span>Prices in INR · no auto-renewal</span>
        </div>
      </section>

      {/* =====================================================
          TALK ME OUT OF IT
      ====================================================== */}
      <TalkMeOutOfIt who={who} onWho={(w) => chooseWho(w, "pricing_chat")} />

      {/* =====================================================
          THE RECEIPT
      ====================================================== */}
      <Receipt />

      {/* =====================================================
          THE PRICE OF NOT PAYING
      ====================================================== */}
      <PriceOfNotPaying />

      {/* =====================================================
          COMPARISON TABLE
      ====================================================== */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
        <div data-reveal className="pr-reveal text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#042653] sm:text-4xl">Compare plans</h2>
          <p className="mt-3 text-slate-600">
            {audience === "individuals" ? "Free and PRO, feature by feature." : "Startup, Advisor and Team Intelligence, side by side."}
          </p>
        </div>

        <div
          key={audience}
          data-reveal
          className="pr-reveal mt-10 overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_80px_-60px_rgba(4,38,83,0.5)]"
        >
          {audience === "individuals" ? (
            <CompareTable
              columns={["Free", "PRO"]}
              highlight={1}
              groups={INDIVIDUAL_ROWS.map((g) => ({ group: g.group, rows: g.rows.map((r) => ({ label: r.label, cells: [r.free, r.pro] })) }))}
            />
          ) : (
            <CompareTable
              columns={["Startup", "Advisor", "Team"]}
              highlight={0}
              groups={ORG_ROWS.map((g) => ({ group: g.group, rows: g.rows.map((r) => ({ label: r.label, cells: [r.startup, r.advisor, r.team] })) }))}
            />
          )}
        </div>
      </section>

      {/* =====================================================
          FAQ
      ====================================================== */}
      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div data-reveal className="pr-reveal">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#042653] sm:text-4xl">Questions, answered</h2>
          <p className="mt-3 max-w-sm text-slate-600">Can&apos;t find what you need? Send us a message and the founder will reply.</p>
          <button
            type="button"
            onClick={() => document.getElementById("contact-product")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="pr-ripple group relative mt-6 inline-flex items-center gap-2 overflow-hidden rounded-xl border border-[#042653]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#042653] transition hover:border-[#042653]/40 hover:shadow-md"
          >
            Contact us
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
        <div data-reveal className="pr-reveal divide-y divide-slate-200 rounded-[24px] border border-slate-200 bg-white px-6" style={{ transitionDelay: "100ms" }}>
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      <div id="contact-product">
        <Footer />
      </div>

      <PricingStickyBar who={who} onWho={(w) => chooseWho(w, "pricing_bar")} onGo={goToPlan} />

      <style jsx global>{`
        /* ---------- entrance ---------- */
        .evc-pricing .pr-fade {
          animation: pr-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .evc-pricing .pr-swap {
          animation: pr-swap 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pr-up {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes pr-swap {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* ---------- scroll reveal ---------- */
        .evc-pricing .pr-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.5s ease,
            background-color 0.5s ease,
            box-shadow 0.5s ease;
        }
        .evc-pricing .pr-reveal.is-in {
          opacity: 1;
          transform: none;
        }

        /* ticks pop in once their block is visible */
        .evc-pricing .pr-tick {
          opacity: 0;
          transform: translateX(-8px);
        }
        .evc-pricing .is-in .pr-tick {
          animation: pr-tick 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes pr-tick {
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* ---------- hero ---------- */
        .evc-pricing .pr-dots {
          background-image: radial-gradient(rgba(4, 38, 83, 0.08) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(to bottom, black, transparent 85%);
          animation: pr-dots 30s linear infinite;
        }
        @keyframes pr-dots {
          to {
            background-position: 22px 44px;
          }
        }
        .evc-pricing .pr-orb {
          animation: pr-drift 14s ease-in-out infinite alternate;
        }
        .evc-pricing .pr-orb-2 {
          animation-duration: 18s;
          animation-delay: -5s;
        }
        @keyframes pr-drift {
          to {
            translate: 40px -24px;
            scale: 1.12;
          }
        }
        .evc-pricing .pr-draw {
          stroke-dasharray: 320;
          stroke-dashoffset: 320;
          animation: pr-draw 1.2s 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        @keyframes pr-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .evc-pricing .pr-twinkle {
          animation: pr-twinkle 2.6s ease-in-out infinite;
        }
        @keyframes pr-twinkle {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.25) rotate(20deg);
            opacity: 0.7;
          }
        }
        .evc-pricing .pr-bob {
          animation: pr-bob 2.2s ease-in-out infinite;
        }
        @keyframes pr-bob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        /* ---------- cards ---------- */
        .evc-pricing .pr-tilt {
          transform-style: preserve-3d;
          transition:
            transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.5s ease,
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .evc-pricing .pr-spot-glow {
          background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(242, 180, 33, 0.14), transparent 60%);
        }
        .evc-pricing .pr-spot-light .pr-spot-glow {
          background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(4, 38, 83, 0.06), transparent 60%);
        }

        /* rotating gold border on the highlighted card */
        .evc-pricing .pr-border {
          position: absolute;
          inset: -1px;
          border-radius: 25px;
          padding: 1.5px;
          background: conic-gradient(from var(--pr-angle), transparent 0deg, #f2b421 70deg, transparent 140deg, transparent 220deg, #5b9bff 290deg, transparent 360deg);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: pr-spin 6s linear infinite;
          pointer-events: none;
        }
        @property --pr-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes pr-spin {
          to {
            --pr-angle: 360deg;
          }
        }

        /* badge shimmer */
        .evc-pricing .pr-badge-shine {
          background-image: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%);
          background-size: 250% 100%;
          animation: pr-shine 3.2s linear infinite;
        }
        @keyframes pr-shine {
          from {
            background-position: 150% 0;
          }
          to {
            background-position: -150% 0;
          }
        }

        /* ---------- buttons ---------- */
        .evc-pricing .pr-btn-gold::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.55) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }
        .evc-pricing .pr-btn-gold:hover::before {
          transform: translateX(120%);
        }
        .evc-pricing .pr-ripple {
          position: relative;
          overflow: hidden;
        }
        .evc-pricing .pr-ripple-dot {
          position: absolute;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.25;
          transform: scale(0);
          pointer-events: none;
          animation: pr-ripple 0.65s ease-out forwards;
        }
        @keyframes pr-ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }

        /* ---------- table ---------- */
        .evc-pricing .pr-check {
          transform: scale(0);
        }
        .evc-pricing .is-in .pr-check {
          animation: pr-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes pr-pop {
          to {
            transform: scale(1);
          }
        }
        .evc-pricing .pr-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: linear-gradient(to left, black, transparent 75%);
          animation: pr-grid 16s linear infinite;
        }
        @keyframes pr-grid {
          to {
            background-position: 32px 32px;
          }
        }

        /* ---------- talk me out of it ---------- */
        .evc-pricing .pr-msg {
          animation: pr-msg 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes pr-msg {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .evc-pricing .pr-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: #020d1f;
          opacity: 0.35;
          animation: pr-dot 1s ease-in-out infinite;
        }
        @keyframes pr-dot {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-4px);
            opacity: 0.9;
          }
        }

        /* ---------- receipt ---------- */
        .evc-pricing .pr-print {
          animation: pr-print 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top;
        }
        @keyframes pr-print {
          from {
            clip-path: inset(0 0 100% 0);
            transform: translateY(-18px);
          }
          to {
            clip-path: inset(0 0 0 0);
            transform: none;
          }
        }
        .evc-pricing .pr-line {
          animation: pr-line 0.35s ease-out both;
        }
        @keyframes pr-line {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .evc-pricing .pr-zigzag {
          background:
            linear-gradient(135deg, #fff 50%, transparent 50%) 0 0 / 14px 14px repeat-x,
            linear-gradient(-135deg, #fff 50%, transparent 50%) 0 0 / 14px 14px repeat-x;
          filter: drop-shadow(0 6px 6px rgba(4, 38, 83, 0.12));
        }
        .evc-pricing .pr-barcode {
          background: repeating-linear-gradient(
            90deg,
            #0b1220 0 2px,
            transparent 2px 4px,
            #0b1220 4px 5px,
            transparent 5px 8px,
            #0b1220 8px 11px,
            transparent 11px 12px
          );
          opacity: 0.85;
        }

        /* ---------- price of not paying ---------- */
        .evc-pricing .pr-bar {
          transform-origin: left;
          transform: scaleX(0);
        }
        .evc-pricing .is-in .pr-bar {
          animation: pr-bar 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pr-bar {
          to {
            transform: scaleX(1);
          }
        }

        /* ---------- reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .evc-pricing *,
          .evc-pricing *::before {
            animation: none !important;
            transition: none !important;
          }
          .evc-pricing .pr-reveal,
          .evc-pricing .pr-tick,
          .evc-pricing .pr-check,
          .evc-pricing .pr-bar {
            opacity: 1 !important;
            transform: none !important;
          }
          .evc-pricing .pr-draw {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   SHARED AUDIENCE (same key as the home page, so a visitor who
   said "I'm a CA firm" there lands on the right plans here)
============================================================ */

type Who = "employee" | "startup" | "firm";

const WHO_KEY = "evc-audience";
const WHO_EVENT = "evc-audience";

function isWho(v: unknown): v is Who {
  return v === "employee" || v === "startup" || v === "firm";
}

function readWho(): Who | null {
  try {
    const v = window.sessionStorage.getItem(WHO_KEY);
    return isWho(v) ? v : null;
  } catch {
    return null;
  }
}

function saveWho(who: Who, source: string) {
  try {
    window.sessionStorage.setItem(WHO_KEY, who);
  } catch {
    /* storage blocked: the choice still applies on this page */
  }
  window.dispatchEvent(new CustomEvent<Who>(WHO_EVENT, { detail: who }));
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("event", "audience_select", { audience: who, source });
}

function useWho() {
  const [who, setWho] = useState<Who | null>(null);
  useEffect(() => {
    setWho(readWho());
    function listener(event: Event) {
      const d = (event as CustomEvent<Who>).detail;
      if (isWho(d)) setWho(d);
    }
    window.addEventListener(WHO_EVENT, listener);
    return () => window.removeEventListener(WHO_EVENT, listener);
  }, []);
  return [who, setWho] as const;
}

const WHO_LABEL: Record<Who, string> = { employee: "Employee", startup: "Startup", firm: "CA / CS firm" };

/* ============================================================
   TALK ME OUT OF IT
   Every answer must stay true. Funny is fine; invented is not.
============================================================ */

const OBJECTIONS: Record<Who, { q: string; a: string }[]> = {
  employee: [
    {
      q: "₹24,999 for a calculator?",
      a: "The calculator is free. Forever. PRO is for when the decision is real: exercise now or later, which regime, what lands in your account after tax.",
    },
    {
      q: "My ESOPs are probably worth nothing.",
      a: "Possibly. Then EVC tells you before you spend lakhs exercising them. Cheapest bad news you’ll ever buy.",
    },
    {
      q: "HR already sent me an Excel sheet.",
      a: "Lovely. Does it know your slab, the new regime, surcharge with marginal relief and 4% cess? Put HR’s numbers in EVC and see if they agree.",
    },
    {
      q: "I’ll just ask ChatGPT.",
      a: "Ask it twice. If both answers match to the rupee, keep your money. We’ll wait.",
    },
    {
      q: "I’m an NRI. This won’t apply to me.",
      a: "It applies, just differently. EVC handles Resident, RNOR and NRI, including the share of your perquisite India can actually tax.",
    },
    {
      q: "Can I try it before I pay?",
      a: "You already can. Simulator, cap table builder, saved calculations and history are free. No card, no trial timer.",
    },
  ],
  startup: [
    {
      q: "We run the cap table in Excel.",
      a: "Everyone does, until an investor’s lawyer asks for the register as of last March. EVC gives you the cap table as of any date, fully diluted.",
    },
    {
      q: "₹14,999 is a lot for a startup.",
      a: `It’s ${inr(Math.round(STARTUP_PLAN.priceRupees / STARTUP_PLAN.includedOptionHolders))} per option holder for the whole year. A late PAS-3 can cost ₹1,000 a day.`,
    },
    {
      q: "Our CS handles the filings.",
      a: "Good. EVC gives them the allotment data, the due dates and an email 30, 7 and 1 day before. They’ll start replying to you faster.",
    },
    {
      q: "Employees never read their grant letters anyway.",
      a: "Exactly. So each one gets a private page with vesting, tax and take-home in rupees, and an Accept button. Fewer “what is my ESOP worth?” Slack messages.",
    },
    {
      q: "What about the auditor and Ind AS 102?",
      a: "The expense report does Ind AS 102, the ICAI Guidance Note or ASC 718, graded or straight-line, with the journal entry. Excel and PDF.",
    },
    {
      q: "Can we try it first?",
      a: "Yes. Click “Request a free trial” and I’ll set it up for you myself.",
    },
  ],
  firm: [
    {
      q: "We’ve done this in Excel for years.",
      a: "And it works, until client fifteen and RSU lot two hundred. EVC reads the broker file, applies the SBI rate for each date and hands you the working paper.",
    },
    {
      q: "₹60,000 is steep for a small practice.",
      a: `It’s ${inr(Math.round(ADVISOR_PLAN.priceRupees / ADVISOR_PLAN.includedClients))} per client company a year, about ${inr(Math.round(ADVISOR_PLAN.priceRupees / ADVISOR_PLAN.includedClients / 12))} a month. If it saves your team 40 hours in a year at ₹1,500 an hour, it has paid for itself.`,
    },
    {
      q: "Which broker files does it read?",
      a: "Excel or CSV exports from Morgan Stanley at Work (E*TRADE), Schwab and Fidelity, matched by column names. Others work through our template. PDFs, not yet.",
    },
    {
      q: "Our clients’ data is sensitive.",
      a: "So we treat it that way: hashed passwords, private storage, Admin and Viewer logins, a log of every change, and a privacy policy written for the DPDP Act.",
    },
    {
      q: "What if you shut down?",
      a: "Then you open Excel. Every register, ledger and tax workbook already downloads, in formats your team uses today.",
    },
    {
      q: "Can we try it before paying?",
      a: "Yes. Ask for a free trial and I’ll set it up for your firm myself.",
    },
  ],
};

type ChatLine = { id: number; from: "you" | "evc"; text: string };

function TalkMeOutOfIt({ who, onWho }: { who: Who | null; onWho: (w: Who) => void }) {
  const tab: Who = who ?? "firm";
  const [log, setLog] = useState<ChatLine[]>([]);
  const [typing, setTyping] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setLog([]);
    setAsked([]);
    setTyping(false);
    if (timer.current) window.clearTimeout(timer.current);
  }, [tab]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [log, typing]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function ask(item: { q: string; a: string }) {
    if (typing) return;
    idRef.current += 1;
    setLog((l) => [...l, { id: idRef.current, from: "you", text: item.q }]);
    setAsked((a) => [...a, item.q]);
    setTyping(true);
    const delay = prefersReducedMotion() ? 0 : Math.min(1600, 500 + item.a.length * 6);
    timer.current = window.setTimeout(() => {
      idRef.current += 1;
      setLog((l) => [...l, { id: idRef.current, from: "evc", text: item.a }]);
      setTyping(false);
    }, delay);
  }

  const remaining = OBJECTIONS[tab].filter((o) => !asked.includes(o.q));

  return (
    <section id="talk-me-out-of-it" className="relative overflow-hidden bg-[#020d1f] py-20 text-white md:py-28">
      <div className="pr-grid pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="pr-orb pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-[#5B9BFF]/15 blur-[120px]" />
      <div className="pr-orb pr-orb-2 pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-[#F2B421]/15 blur-[120px]" />

      <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div data-reveal className="pr-reveal">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#F2B421]/30 bg-[#F2B421]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2B421]">
            <MessageCircle className="h-3.5 w-3.5" /> Go on, haggle
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Try to talk yourself out of it.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">
            Every reason not to buy, answered honestly. If one of these answers is wrong for you, don’t pay. Pick who you
            are, then tap an objection.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            {(["employee", "startup", "firm"] as Who[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onWho(w)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === w ? "bg-white text-[#042653]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {WHO_LABEL[w]}
              </button>
            ))}
          </div>
        </div>

        <div data-reveal className="pr-reveal overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur" style={{ transitionDelay: "100ms" }}>
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/evc-mark.png" alt="" className="h-full w-full object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#020d1f] bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-semibold">Sheshank, founder</p>
              <p className="text-xs text-slate-400">{typing ? "typing…" : "Replies with the truth, not a discount"}</p>
            </div>
          </div>

          <div ref={scrollRef} className="h-[340px] space-y-3 overflow-y-auto px-5 py-5">
            {log.length === 0 && !typing ? (
              <div className="grid h-full place-items-center text-center">
                <p className="max-w-xs text-sm text-slate-400">
                  Your objections go here. Tap one below. Be as rude as you like.
                </p>
              </div>
            ) : null}
            {log.map((line) =>
              line.from === "you" ? (
                <div key={line.id} className="pr-msg flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-[15px] leading-6 text-slate-100">{line.text}</p>
                </div>
              ) : (
                <div key={line.id} className="pr-msg flex justify-start">
                  <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#F2B421] px-4 py-2.5 text-[15px] font-medium leading-6 text-[#020d1f]">
                    {line.text}
                  </p>
                </div>
              )
            )}
            {typing ? (
              <div className="flex justify-start">
                <span className="inline-flex gap-1 rounded-2xl rounded-bl-md bg-[#F2B421]/90 px-4 py-3.5">
                  <span className="pr-dot" />
                  <span className="pr-dot" style={{ animationDelay: "120ms" }} />
                  <span className="pr-dot" style={{ animationDelay: "240ms" }} />
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 p-4">
            {remaining.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {remaining.map((o) => (
                  <button
                    key={o.q}
                    type="button"
                    disabled={typing}
                    onClick={() => ask(o)}
                    className="pr-ripple rounded-full border border-white/15 px-3.5 py-2 text-left text-sm text-slate-100 transition hover:border-[#F2B421] hover:bg-[#F2B421]/10 disabled:opacity-50"
                  >
                    {o.q}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-300">Out of objections? That’s usually a good sign.</p>
                <a
                  href={tab === "employee" ? "#pro" : tab === "startup" ? "#startup" : "#advisor"}
                  className="pr-btn-gold relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-[#F2B421] px-4 text-sm font-semibold text-[#020d1f]"
                >
                  <span className="relative">See the plan</span>
                  <ArrowRight className="relative h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THE RECEIPT
   Line items are features that exist today. Totals are the real
   prices from the same constants checkout uses.
============================================================ */

type ReceiptKey = "PRO" | "STARTUP" | "ADVISOR" | "TEAM";

const RECEIPTS: Record<ReceiptKey, { title: string; price: number; per: string; lines: string[]; jokes: [string, string][] }> = {
  PRO: {
    title: "PRO · Yearly",
    price: 24999,
    per: "for 12 months",
    lines: [
      "Grant letter read, every field confirmed by you",
      "Vesting and cliff timeline",
      "Cash needed to exercise",
      "Tax: old vs new regime, surcharge, marginal relief, cess",
      "Resident, RNOR and NRI",
      "Exit scenarios, side by side",
      "Offer Intelligence: compare job offers",
      "One-page PDF report",
    ],
    jokes: [
      ["2 a.m. ESOP anxiety", "−90%"],
      ["Calls from a salesperson", "0"],
    ],
  },
  STARTUP: {
    title: "Startup plan · Annual",
    price: STARTUP_PLAN.priceRupees,
    per: `${STARTUP_PLAN.includedOptionHolders} option holders`,
    lines: [
      "Cap table as of any date, fully diluted",
      "ESOP schemes, pool and grants",
      "Private employee page with Accept",
      "Grant letters employees can download",
      "Exercises → PAS-3, TDS or deferral, Form 3921",
      "ESOP expense report: Ind AS 102 / ASC 718",
      "Compliance calendar, emails 30·7·1 days before",
      "Admin and Viewer logins, full change history",
    ],
    jokes: [
      ["“What is my ESOP worth?” messages", "fewer"],
      ["Rebuilding the register before a round", "0"],
    ],
  },
  ADVISOR: {
    title: "Advisor plan · Annual",
    price: ADVISOR_PLAN.priceRupees,
    per: `${ADVISOR_PLAN.includedClients} client companies`,
    lines: [
      "ESOP Diligence Pack, readiness score, PDF/Excel",
      "Tax-Event Ledger: perquisite, TDS, deferral clock",
      "Foreign Equity Tax Pack for individuals",
      "SBI TT rates for every date since 2020",
      "Schedule FA (A2, A3, daily peak), CG buckets",
      "Dividends, foreign tax credit, Form 67",
      "9-sheet Excel working paper per client",
      "Calendar across all clients, team logins",
    ],
    jokes: [
      ["Tab five quietly breaking", "0"],
      ["Junior’s weekend in Excel", "returned"],
    ],
  },
  TEAM: {
    title: "Team Intelligence · Annual",
    price: TEAM_PRICE,
    per: `${TEAM_MEMBERS} members`,
    lines: [
      `PRO for up to ${TEAM_MEMBERS} people`,
      "Member preview, compare and analysis",
      "Workspace-level analytics",
      "One admin, 12 months",
    ],
    jokes: [["Same ESOP question asked 20 times", "once"]],
  },
};

function Receipt() {
  const [key, setKey] = useState<ReceiptKey>("ADVISOR");
  const [run, setRun] = useState(0);
  const r = RECEIPTS[key];
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  function pick(k: ReceiptKey) {
    setKey(k);
    setRun((n) => n + 1);
  }

  return (
    <section id="receipt" className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div data-reveal className="pr-reveal">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">
            <Receipt className="h-3.5 w-3.5" /> Itemised
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#042653] sm:text-5xl">
            Here’s exactly what your money buys.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
            No “and much more”. Every line on the receipt is something EVC does today. Pick a plan and watch it print.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {(Object.keys(RECEIPTS) as ReceiptKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => pick(k)}
                className={`pr-ripple rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  key === k ? "bg-[#042653] text-white shadow-md" : "border border-slate-200 bg-white text-slate-600 hover:border-[#042653]/40 hover:text-[#042653]"
                }`}
              >
                {k === "PRO" ? "PRO" : k === "STARTUP" ? "Startup" : k === "ADVISOR" ? "Advisor" : "Team"}
              </button>
            ))}
          </div>
        </div>

        <div data-reveal className="pr-reveal relative mx-auto w-full max-w-[420px]">
          <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[#F2B421]/15 blur-3xl" />
          <div className="relative h-3 rounded-t-xl bg-[#042653] shadow-inner" />
          <div key={`${key}-${run}`} className="pr-print relative mx-3 overflow-hidden bg-white px-6 pb-8 pt-6 font-mono text-[13px] text-slate-700 shadow-[0_30px_60px_-30px_rgba(4,38,83,0.6)]">
            <div className="text-center">
              <p className="text-base font-bold tracking-widest text-[#042653]">ESOP VALUE CLARITY</p>
              <p className="text-[11px] text-slate-500">Hyderabad · esopvalueclarity.com</p>
              <p className="mt-1 text-[11px] text-slate-500">{today}</p>
            </div>
            <p className="my-3 border-t border-dashed border-slate-300" />
            <p className="font-bold text-[#042653]">{r.title}</p>
            <p className="text-[11px] text-slate-500">{r.per}</p>
            <ul className="mt-3 space-y-1.5">
              {r.lines.map((line, i) => (
                <li key={line} className="pr-line flex justify-between gap-3" style={{ animationDelay: `${200 + i * 110}ms` }}>
                  <span>{line}</span>
                  <span className="shrink-0 text-emerald-600">incl.</span>
                </li>
              ))}
            </ul>
            <p className="my-3 border-t border-dashed border-slate-300" />
            <ul className="space-y-1.5 text-slate-500">
              {r.jokes.map(([label, value]: [string, string], i: number) => (
                <li key={label} className="pr-line flex justify-between gap-3" style={{ animationDelay: `${200 + (r.lines.length + i) * 110}ms` }}>
                  <span>{label}</span>
                  <span className="shrink-0">{value}</span>
                </li>
              ))}
            </ul>
            <p className="my-3 border-t-2 border-double border-slate-400" />
            <div className="pr-line flex items-end justify-between" style={{ animationDelay: `${300 + (r.lines.length + r.jokes.length) * 110}ms` }}>
              <span className="font-bold">TOTAL</span>
              <span className="text-2xl font-bold text-[#042653]">{inr(r.price)}</span>
            </div>
            <p className="pr-line mt-1 text-right text-[11px] text-slate-500" style={{ animationDelay: `${350 + (r.lines.length + r.jokes.length) * 110}ms` }}>
              {inr(r.price / 365)} a day · no auto-renewal
            </p>
            <p className="my-3 border-t border-dashed border-slate-300" />
            <p className="text-center text-[11px] leading-5 text-slate-500">
              Cashier: Sheshank (also the developer)
              <br />
              Thank you for not doing this in Excel.
            </p>
            <div className="pr-barcode mx-auto mt-3 h-8 w-48" />
          </div>
          <div className="pr-zigzag relative mx-3 h-3" />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THE PRICE OF NOT PAYING
   Penalty figures and their sources match the home page.
============================================================ */

const STAKES: { label: string; amount: number; kind: "plan" | "fine"; note: string; href?: string }[] = [
  { label: "Startup plan, a whole year", amount: STARTUP_PLAN.priceRupees, kind: "plan", note: "With a receipt" },
  { label: "Advisor plan, a whole year, 25 clients", amount: ADVISOR_PLAN.priceRupees, kind: "plan", note: "With a receipt" },
  {
    label: "Late PAS-3: maximum for the company, and again for each officer",
    amount: 100000,
    kind: "fine",
    note: "Companies Act s.39(5)",
    href: "https://www.taxclue.in/tools/pas-3-late-filing-penalty-calculator",
  },
  {
    label: "Late MGT-14: maximum for the company",
    amount: 200000,
    kind: "fine",
    note: "Companies Act s.117(2)",
    href: "https://www.taxscan.in/top-stories/delay-of-215-days-in-filing-board-resolution-in-form-mgt-14-mca-imposes-penalty-1437235",
  },
  {
    label: "Foreign shares left out of Schedule FA",
    amount: 1000000,
    kind: "fine",
    note: "Black Money Act s.43",
    href: "https://taxguru.in/?p=925008",
  },
];

function PriceOfNotPaying() {
  const max = Math.max(...STAKES.map((s) => s.amount));
  const perClientDay = ADVISOR_PLAN.priceRupees / ADVISOR_PLAN.includedClients / 365;

  return (
    <section id="price-of-not-paying" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
        <div data-reveal className="pr-reveal max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
            <Scale className="h-3.5 w-3.5" /> The other price list
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#042653] sm:text-5xl">
            One of these comes with a receipt. The rest come with a notice.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            You’re not choosing between EVC and ₹0. You’re choosing between EVC and the risk of a missed date or a wrong
            schedule.
          </p>
        </div>

        <div data-reveal className="pr-reveal mt-12 space-y-4">
          {STAKES.map((s, i) => {
            const pct = Math.max(3, (s.amount / max) * 100);
            const plan = s.kind === "plan";
            return (
              <div key={s.label} className="grid grid-cols-1 gap-2 md:grid-cols-[280px_minmax(0,1fr)] md:items-center md:gap-6">
                <div>
                  <p className={`text-sm font-semibold ${plan ? "text-[#042653]" : "text-slate-700"}`}>{s.label}</p>
                  {s.href ? (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 underline-offset-2 hover:underline">
                      {s.note}
                    </a>
                  ) : (
                    <p className="text-xs text-emerald-700">{s.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 flex-1 overflow-hidden rounded-xl bg-slate-100">
                    <div
                      className={`pr-bar h-full rounded-xl ${plan ? "bg-gradient-to-r from-[#042653] to-[#2a5ba8]" : "bg-gradient-to-r from-red-500 to-orange-400"}`}
                      style={{ width: `${pct}%`, animationDelay: `${i * 140}ms` }}
                    />
                  </div>
                  <span className={`w-28 shrink-0 text-right font-semibold tabular-nums ${plan ? "text-[#042653]" : "text-red-600"}`}>{inr(s.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div data-reveal className="pr-reveal mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Coffee,
              big: `${inr(perClientDay)}`,
              small: "per client company per day on the Advisor plan. Less than the office chai.",
            },
            {
              icon: Users,
              big: inr(STARTUP_PLAN.priceRupees / STARTUP_PLAN.includedOptionHolders),
              small: "per option holder for a whole year on the Startup plan.",
            },
            {
              icon: Crown,
              big: inr(24999 / 365),
              small: "a day for PRO yearly, to get a decision worth lakhs right.",
            },
          ].map((c) => (
            <div key={c.small} className="rounded-2xl border border-slate-200 bg-[#F7F9FC] p-5">
              <c.icon className="h-5 w-5 text-[#B7800E]" />
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#042653]">{c.big}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{c.small}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STICKY BAR (follows who the visitor said they are)
============================================================ */

const BAR: Record<Who, { line: string; cta: string; target: string }> = {
  employee: { line: `PRO yearly works out to ${inr(24999 / 365)} a day. The calculator stays free.`, cta: "See PRO", target: "pro" },
  startup: {
    line: `${inr(STARTUP_PLAN.priceRupees / STARTUP_PLAN.includedOptionHolders)} per option holder a year. Cap table, ESOPs, PAS-3 dates.`,
    cta: "See the Startup plan",
    target: "startup",
  },
  firm: {
    line: `${inr(ADVISOR_PLAN.priceRupees / ADVISOR_PLAN.includedClients / 12)} per client a month. Foreign RSU tax and ESOP compliance.`,
    cta: "See the Advisor plan",
    target: "advisor",
  },
};

function PricingStickyBar({ who, onWho, onGo }: { who: Who | null; onWho: (w: Who) => void; onGo: (target: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [chooser, setChooser] = useState(false);

  useEffect(() => {
    function onScroll() {
      const end = document.getElementById("contact-product");
      const past = window.scrollY > window.innerHeight * 0.8;
      const nearEnd = end ? end.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(past && !nearEnd);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;
  const current = who && !chooser ? BAR[who] : null;

  return (
    <div
      className={`fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-[#020d1f]/90 p-2 pl-3 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/evc-mark.png" alt="" className="h-full w-full object-contain" />
        </span>
        {current && who ? (
          <>
            <p key={who} className="pr-swap min-w-0 flex-1 truncate text-sm font-semibold">
              {current.line}
            </p>
            <button
              type="button"
              onClick={() => setChooser(true)}
              className="hidden shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white sm:block"
            >
              Not you?
            </button>
            <button
              type="button"
              onClick={() => onGo(current.target)}
              className="pr-btn-gold relative inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden rounded-xl bg-[#F2B421] px-4 text-sm font-semibold text-[#020d1f]"
            >
              <span className="relative">{current.cta}</span>
              <ArrowRight className="relative h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <p className="hidden shrink-0 text-sm font-semibold md:block">Which one are you?</p>
            <div className="flex min-w-0 flex-1 gap-1.5">
              {(["employee", "startup", "firm"] as Who[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setChooser(false);
                    onWho(w);
                    onGo(BAR[w].target);
                  }}
                  className="h-10 min-w-0 flex-1 truncate rounded-xl border border-white/15 px-2 text-xs font-semibold text-slate-100 transition hover:border-[#F2B421] hover:bg-[#F2B421] hover:text-[#020d1f] sm:text-sm"
                >
                  {w === "employee" ? (
                    <>
                      <span className="hidden sm:inline">I’m an employee</span>
                      <span className="sm:hidden">Employee</span>
                    </>
                  ) : w === "startup" ? (
                    <>
                      <span className="hidden sm:inline">I run a startup</span>
                      <span className="sm:hidden">Startup</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">I’m a CA/CS firm</span>
                      <span className="sm:hidden">CA/CS firm</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PIECES
============================================================ */

function PlanCard({
  id,
  index,
  icon: Icon,
  name,
  tagline,
  amount,
  period,
  note,
  badge,
  highlight = false,
  featuresTitle,
  features,
  cta,
  secondary,
  error,
}: {
  id?: string;
  index: number;
  icon: ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
  amount: number;
  period: string;
  note?: string;
  badge?: string;
  highlight?: boolean;
  featuresTitle?: string;
  features: string[];
  cta: { label: string; href?: string; onClick?: () => void; loading?: boolean; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  error?: string;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  /* 3D tilt + spotlight (mouse only) */
  function onMove(event: ReactMouseEvent<HTMLDivElement>) {
    spotlight(event);
    const el = cardRef.current;
    if (!el || prefersReducedMotion() || !el.classList.contains("is-in")) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transitionDelay = "0ms";
    el.style.transform = `perspective(1100px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
  }
  function onLeave() {
    if (cardRef.current) cardRef.current.style.transform = "";
  }

  const ctaClass = `pr-ripple pr-btn-gold group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold transition duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${
    highlight
      ? "bg-[#F2B421] text-[#020d1f] shadow-[0_12px_30px_-12px_rgba(242,180,33,0.8)] hover:-translate-y-0.5 hover:bg-[#ffc43d] hover:shadow-[0_18px_40px_-12px_rgba(242,180,33,0.9)]"
      : "bg-[#042653] text-white hover:-translate-y-0.5 hover:bg-[#06306a] hover:shadow-[0_14px_30px_-14px_rgba(4,38,83,0.8)]"
  }`;

  const ctaInner: ReactNode = cta.loading ? (
    <>
      <Loader2 className="relative h-4 w-4 animate-spin" />
      <span className="relative">Opening secure checkout...</span>
    </>
  ) : (
    <>
      <span className="relative">{cta.label}</span>
      {!cta.disabled ? <ArrowRight className="relative h-4 w-4 transition duration-300 group-hover:translate-x-1" /> : null}
    </>
  );

  return (
    <div
      id={id}
      ref={cardRef}
      data-reveal
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`pr-reveal pr-tilt pr-spot group/card relative flex scroll-mt-28 flex-col rounded-[24px] p-7 ${
        highlight
          ? "bg-[#020d1f] text-white shadow-[0_40px_90px_-40px_rgba(2,13,31,0.9)]"
          : "pr-spot-light border border-slate-200 bg-white shadow-[0_20px_60px_-50px_rgba(4,38,83,0.6)] hover:shadow-[0_40px_80px_-45px_rgba(4,38,83,0.55)]"
      }`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      {highlight ? <span className="pr-border" aria-hidden="true" /> : null}

      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
        <div className="pr-spot-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />
        {highlight ? (
          <>
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F2B421]/20 blur-[70px] transition duration-700 group-hover/card:scale-125" />
            <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#5B9BFF]/15 blur-[70px] transition duration-700 group-hover/card:translate-x-6" />
          </>
        ) : null}
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl transition duration-500 group-hover/card:rotate-[-8deg] group-hover/card:scale-110 ${
            highlight ? "bg-[#F2B421] text-[#042653]" : "bg-[#042653] text-[#F2B421]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge ? (
          <span
            className={`pr-badge-shine rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              highlight ? "bg-[#F2B421]/15 text-[#FFD877] ring-1 ring-[#F2B421]/30" : "bg-[#FFF4D6] text-[#8A5A00]"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className={`relative mt-5 text-xl font-semibold tracking-[-0.02em] ${highlight ? "text-white" : "text-[#042653]"}`}>{name}</h3>
      <p className={`relative mt-2 min-h-[48px] text-sm leading-6 ${highlight ? "text-slate-300" : "text-slate-600"}`}>{tagline}</p>

      <div className="relative mt-6 flex items-end gap-1.5">
        <span className={`text-4xl font-semibold tracking-[-0.04em] ${highlight ? "text-white" : "text-[#0b1220]"}`}>
          {amount === 0 ? "₹0" : <AnimatedNumber value={amount} format={inr} />}
        </span>
        <span className={`pb-1.5 text-sm ${highlight ? "text-slate-400" : "text-slate-500"}`}>{period}</span>
      </div>
      <p key={note} className={`pr-swap relative mt-1 min-h-[20px] text-xs ${highlight ? "text-[#FFD877]" : "text-slate-500"}`}>
        {note}
      </p>

      <div className="relative mt-6 space-y-2">
        {cta.href ? (
          <Link href={cta.href} className={ctaClass}>
            {ctaInner}
          </Link>
        ) : (
          <button type="button" onClick={cta.onClick} disabled={cta.disabled || cta.loading} className={ctaClass}>
            {ctaInner}
          </button>
        )}
        {secondary ? (
          <button
            type="button"
            onClick={secondary.onClick}
            className={`pr-ripple group inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition ${
              highlight ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-slate-50 hover:text-[#042653]"
            }`}
          >
            {secondary.label}
            <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="pr-swap relative mt-3 rounded-xl border border-red-300/40 bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-500">
          {error}
        </div>
      ) : null}

      <div className={`relative mt-6 border-t pt-6 ${highlight ? "border-white/10" : "border-slate-100"}`}>
        {featuresTitle ? (
          <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.12em] ${highlight ? "text-slate-400" : "text-slate-500"}`}>
            {featuresTitle}
          </p>
        ) : null}
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li
              key={f}
              className={`pr-tick flex items-start gap-3 text-sm leading-6 ${highlight ? "text-slate-200" : "text-slate-700"}`}
              style={{ animationDelay: `${index * 90 + 250 + i * 70}ms` }}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  highlight ? "bg-[#F2B421]/15 text-[#F2B421]" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CompareTable({
  columns,
  highlight,
  groups,
}: {
  columns: string[];
  highlight: number;
  groups: { group: string; rows: { label: string; cells: Cell[] }[] }[];
}) {
  // The hovered column lights up; otherwise the recommended column stays lit.
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const lit = hoverCol ?? highlight;
  const starts = groups.reduce<number[]>((acc, g, i) => [...acc, i === 0 ? 0 : acc[i - 1] + groups[i - 1].rows.length], []);

  return (
    <table className="w-full min-w-[640px] border-collapse text-left text-sm" onMouseLeave={() => setHoverCol(null)}>
      <thead>
        <tr className="border-b border-slate-200">
          <th className="w-[40%] px-6 py-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Features</th>
          {columns.map((c, i) => (
            <th
              key={c}
              onMouseEnter={() => setHoverCol(i)}
              className={`px-4 py-5 text-center text-sm font-semibold transition-colors duration-300 ${
                i === lit ? "bg-[#042653]/[0.05] text-[#042653]" : "text-slate-700"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {c}
                {i === highlight ? <span className="h-1.5 w-1.5 rounded-full bg-[#F2B421]" /> : null}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map((g, gi) => (
          <GroupRows key={g.group} group={g} columns={columns.length} lit={lit} onHoverCol={setHoverCol} startIndex={starts[gi]} />
        ))}
      </tbody>
    </table>
  );
}

function GroupRows({
  group,
  columns,
  lit,
  onHoverCol,
  startIndex,
}: {
  group: { group: string; rows: { label: string; cells: Cell[] }[] };
  columns: number;
  lit: number;
  onHoverCol: (i: number) => void;
  startIndex: number;
}) {
  return (
    <>
      <tr>
        <td colSpan={columns + 1} className="bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#042653]">
          {group.group}
        </td>
      </tr>
      {group.rows.map((r, ri) => (
        <tr key={r.label} className="group/row border-b border-slate-100 transition-colors last:border-0 hover:bg-[#F7F9FC]">
          <td className="px-6 py-4 text-slate-700 transition-colors group-hover/row:text-[#042653]">{r.label}</td>
          {r.cells.map((cell, i) => (
            <td
              key={i}
              onMouseEnter={() => onHoverCol(i)}
              className={`px-4 py-4 text-center transition-colors duration-300 ${i === lit ? "bg-[#042653]/[0.04]" : ""}`}
            >
              {cell === true ? (
                <span
                  className="pr-check inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600"
                  style={{ animationDelay: `${Math.min(900, (startIndex + ri) * 45 + i * 30)}ms` }}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : cell === false ? (
                <Minus className="mx-auto h-4 w-4 text-slate-300" />
              ) : (
                <span className="text-sm font-medium text-slate-700">{cell}</span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold text-[#0b1220] transition hover:text-[#042653]"
      >
        <span className="transition-transform duration-300 group-hover:translate-x-1">{q}</span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition duration-300 ${
            open ? "rotate-180 border-[#042653] bg-[#042653] text-white" : "border-slate-200 text-slate-500 group-hover:border-[#042653]/40 group-hover:text-[#042653]"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className={`pb-5 pr-10 text-sm leading-7 text-slate-600 transition duration-500 ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}>{a}</p>
        </div>
      </div>
    </div>
  );
}
