"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Footer from "@/components/sections/Footer";
import StartupDeskSection from "@/components/home/StartupDeskSection";
import CapTableToolSection from "@/components/home/CapTableToolSection";
import { STARTUP_PLAN } from "@/lib/company-pricing";
import { ADVISOR_PLAN } from "@/lib/advisor-pricing";
import { calculateAdvancedTax } from "@/lib/esop/tax";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  Building2,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  Cpu,
  Download,
  FileSpreadsheet,
  FileCheck2,
  FileSearch,
  FileText,
  Landmark,
  Layers3,
  LockKeyhole,
  Mail,
  Minus,
  MonitorPlay,
  Play,
  Plus,
  ReceiptIndianRupee,
  Scale,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserRound,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";

/* ============================================================
   HONESTY RULES FOR THIS PAGE

   1. CUSTOMERS lists only companies that pay for EVC. Plain
      text, not logos, until each gives written permission.
   2. CUSTOMER_QUOTES holds only real quotes from named people
      who approved their use (keep the email). Never invented
      people, altered photos or paraphrased praise. The section
      is hidden while the list is empty.
   3. Every number on this page comes from the SAMPLE grant
      below, run through EVC's real tax engine, and is labelled
      as a sample. No fake "live" counters or invented stats.
============================================================ */

const CUSTOMERS = ["Ather Energy", "Revolt Motors"];

type CustomerQuote = {
  quote: string;
  name: string;
  role: string;
  company: string;
  photo?: string; // their own photo, e.g. "/customers/name.jpg"
};

const CUSTOMER_QUOTES: CustomerQuote[] = [];

/* Brand (from the EVC logo) */
const NAVY = "#042653";
const GOLD = "#F2B421";
const SKY = "#5B9BFF";
const SLATE = "#94A3B8";

/* ============================================================
   SAMPLE GRANT (illustrative company)
============================================================ */

const SAMPLE = {
  company: "Northstar Analytics",
  totalOptions: 12_500,
  vestedOptions: 6_250,
  strike: 18.5,
  companyShares: 1_000_000,
  dilution: 26.1,
  exerciseFMV: 100,
  otherAnnualIncome: 1_200_000,
  holdingPeriodMonths: 24,
  vestingMonths: 48,
  cliffMonths: 12,
};

const CRORE = 10_000_000;

function runModel(options: number, exitValuation: number) {
  const keep = 1 - SAMPLE.dilution / 100;
  const gross = (options / SAMPLE.companyShares) * keep * exitValuation;
  const salePrice = (exitValuation / SAMPLE.companyShares) * keep;
  const exerciseCost = options * SAMPLE.strike;

  const tax = calculateAdvancedTax({
    vestedShares: options,
    strikePrice: SAMPLE.strike,
    exerciseFMV: SAMPLE.exerciseFMV,
    salePrice,
    otherAnnualIncome: SAMPLE.otherAnnualIncome,
    holdingPeriodMonths: SAMPLE.holdingPeriodMonths,
    equityType: "UNLISTED",
    taxRegime: "NEW",
  });

  return {
    gross,
    exerciseCost,
    tax: tax.totalEstimatedTax,
    taxAtExercise: tax.estimatedIncomeTax,
    taxAtSale: tax.capitalGainsTax,
    takeHome: Math.max(0, tax.netTakeHome),
  };
}

/* ============================================================
   CONTENT
============================================================ */

const CAPABILITIES = [
  "Grant letter extraction",
  "Field-by-field confirmation",
  "Vesting & cliff",
  "Exercise cost",
  "Dilution across rounds",
  "Perquisite tax",
  "Capital gains",
  "Resident, RNOR & NRI tax",
  "Bear / Base / Bull exits",
  "Offer comparison",
  "One-page PDF report",
  "Cap table",
  "ESOP pool & grants",
  "Exercises & allotment",
  "PAS-3, TDS & Form 3921 tracking",
  "ESOP expense report (Ind AS 102)",
  "Compliance calendar & reminders",
  "Employee grant links",
  "Team logins & change history",
  "Advisor Console",
  "Tax-event ledger",
  "Foreign RSU / ESPP tax pack",
  "Schedule FA, CG & Form 67",
  "SBI TT rates (Rule 115)",
  "Excel import",
  "Free cap table builder",
]

const STORY = [
  {
    icon: Upload,
    kicker: "Upload",
    title: "Start from the grant letter.",
    text: "Drop in the PDF. EVC reads options, strike price, vesting, expiry and exit clauses straight from the document.",
    meta: "Reads the grant document itself",
  },
  {
    icon: FileCheck2,
    kicker: "Confirm",
    title: "Every field checked before it counts.",
    text: "Nothing is calculated until each extracted term is confirmed against the source. Clauses that matter on exit are flagged for review.",
    meta: "9 grant fields · clause flags",
  },
  {
    icon: SlidersHorizontal,
    kicker: "Model",
    title: "One model, every consequence.",
    text: "Vesting, exercise cost, dilution and tax run as one connected chain. Move one assumption and the whole answer moves with it.",
    meta: "Bear · Base · Bull exits",
  },
  {
    icon: FileText,
    kicker: "Share",
    title: "A page people actually read.",
    text: "Export a one-page report that ends in a plain sentence: what is on paper, and what is left in hand.",
    meta: "PDF · CSV · Excel",
  },
];

const REPORT_FACTS = [
  { value: 1, suffix: "", label: "grant letter in" },
  { value: 9, suffix: "", label: "fields confirmed against source" },
  { value: 3, suffix: "", label: "exit scenarios modelled" },
  { value: 1, suffix: " page", label: "report out" },
];

const AUDIENCES = [
  {
    key: "employees",
    icon: UserRound,
    label: "Employees",
    title: "Know what your grant is worth in hand.",
    text: "Before you sign an offer, exercise, or resign, see the cash it costs and the money it could become, after tax.",
    points: [
      "Vested today, and what lapses if you leave",
      "Cash needed to exercise, before any exit",
      "Take-home across Bear, Base and Bull exits",
      "Two offers compared on the same basis",
      "Resident, RNOR or NRI: tax follows your status",
    ],
    cta: { label: "Model your grant free", href: "/simulator" },
  },
  {
    key: "startups",
    icon: Layers3,
    label: "Startups & founders",
    title: "Your cap table, your ESOPs, and employees who value them.",
    text: "Keep the cap table and every grant in one place, and give each employee a page that shows what their grant is worth after tax.",
    points: [
      "Cap table as of any date, fully diluted",
      "Grants from your approved ESOP pool",
      "A private page per employee, with Accept",
      "Exercises tracked to PAS-3, TDS and Form 3921",
      "ESOP expense report and a compliance calendar",
      "Import your existing Excel cap table and grants",
    ],
    cta: { label: "See the Startup plan", href: "/pricing#startup" },
  },
  {
    key: "hr",
    icon: Building2,
    label: "Companies & HR",
    title: "Stop answering the same ESOP questions one by one.",
    text: "Give every employee a clear report built from their own grant, so equity is valued because it is understood.",
    points: [
      "One report per employee, from their own grant",
      "Fewer one-off emails to founders and finance",
      "Consistent numbers across the whole team",
      "Team Intelligence for company-wide rollouts",
    ],
    cta: { label: "Talk to us about your team", href: "/meeting" },
  },
  {
    key: "advisors",
    icon: Landmark,
    label: "CA & advisory firms",
    title: "Replace the spreadsheet behind every ESOP client.",
    text: "Manage client companies and their grants in one console, and hand clients reports without rebuilding models.",
    points: [
      "Client companies and grants in one place",
      "Diligence checks across grant registers",
      "Tax-event ledger for exercises and sales",
      "Foreign RSU / ESPP gains to Schedule FA, CG, Form 67",
      "One compliance calendar across every client",
      "Client-ready reports in one click",
    ],
    cta: { label: "Book an advisor walkthrough", href: "/meeting" },
  },
];

/* Videos on the home page. `uploadDate` must be the real YouTube upload
   date in full ISO 8601 with a time zone, e.g. "2026-11-10T18:00:00+05:30"
   (YouTube Studio → Content → Date). VideoObject schema is only emitted
   for videos where it is filled in, so Google never sees a bad date. */
const VIDEOS = [
  {
    key: "advisor",
    id: "KM8xuPqDL_w",
    duration: "6:30",
    durationISO: "PT6M30S",
    uploadDate: "2026-11-13T18:00:00+05:30",
    icon: Landmark,
    label: "For CA & CS firms",
    title: "ESOP compliance checks and ESOP tax for CA and CS firms: EVC Advisor Console",
    heading: "ESOP compliance and tax, for every client.",
    description:
      "How CA and CS firms run ESOP work across client companies in the Advisor Console: grant registers, compliance checks and the tax-event ledger.",
    points: [
      "Client companies and grant registers in one console",
      "Compliance checks across every grant",
      "Tax-event ledger for exercises and sales",
      "Client-ready reports without rebuilding models",
    ],
    cta: { label: "Book an advisor walkthrough", href: "/meeting" },
  },
  {
    key: "employee",
    id: "QfBgHBeGIXA",
    duration: "4:52",
    durationISO: "PT4M52S",
    uploadDate: "2026-11-12T12:00:00+05:30",
    icon: UserRound,
    label: "For employees",
    title: "What is your ESOP grant worth after tax?",
    heading: "What your grant is worth, after tax.",
    description:
      "From the number of options in a grant letter to the rupees you actually keep: vesting, exercise cost, perquisite tax and capital gains.",
    points: [
      "What is vested, and what lapses if you leave",
      "Cash needed to exercise, before any exit",
      "Perquisite tax at exercise, capital gains at sale",
      "Take-home across Bear, Base and Bull exits",
    ],
    cta: { label: "Model your grant free", href: "/simulator" },
  },
  {
    key: "walkthrough",
    id: "TMNxdmn4uJM",
    duration: "3:44",
    durationISO: "PT3M44S",
    uploadDate: "2026-10-15T12:00:00+05:30",
    icon: MonitorPlay,
    label: "Product walkthrough",
    title: "ESOP Value Clarity product walkthrough",
    heading: "Every screen, on a real workflow.",
    description:
      "A screen-by-screen walk through EVC, the way an employee, founder or advisor would actually use it.",
    points: [
      "Uploading and confirming a grant",
      "Vesting, exercise and dilution",
      "Tax under the old and new regimes",
      "Exporting the one-page report",
    ],
    cta: { label: "Book a 20-minute walkthrough", href: "/meeting" },
  },
];

const FAQ_GROUPS = [
  {
    key: "product",
    label: "Product",
    items: [
      {
        q: "Is EVC a valuation service?",
        a: "No. EVC does not value the company. It shows what a grant could mean for the holder under exit values you choose or review, after exercise cost and estimated tax.",
      },
      {
        q: "What can I model?",
        a: "Grant size, vesting and cliff, ownership, dilution, exercise cost, Bear / Base / Bull exits, estimated tax, offer comparisons and a one-page report, all as one connected model.",
      },
      {
        q: "What is not modelled yet?",
        a: "In exit scenarios: liquidation preferences and buyback-specific tax treatment. The Startup Equity Desk records multiple share classes on the cap table, but exit take-home does not yet apply preferences. Every report lists what is excluded, so nobody mistakes an estimate for a payout.",
      },
      {
        q: "Can EVC run our cap table and ESOP grants?",
        a: "Yes, with the Startup plan. Record or import your cap table, your ESOP pool and every grant, and give each employee a private page that explains their grant. EVC does not draft your ESOP scheme or grant letters: your CS or lawyer does, and you can upload the signed letter for the employee to download.",
      },
    ],
  },
  {
    key: "tax",
    label: "Tax",
    items: [
      {
        q: "How is tax estimated?",
        a: "EVC models perquisite tax at exercise and capital gains at sale, with surcharge (including marginal relief) and 4% cess where they apply.",
      },
      {
        q: "Does it handle the old and new regimes?",
        a: "Yes. You can switch regimes and the whole model, including take-home at every exit, recalculates.",
      },
      {
        q: "Does EVC handle NRI and RNOR ESOP tax?",
        a: "Yes. Choose Resident, RNOR or Non-resident, or let EVC work it out from your days in India under section 6. For a non-resident, only the share of the perquisite earned while working in India is taxed in India, and the section 87A rebate does not apply.",
      },
      {
        q: "How are foreign RSUs and ESPP taxed in India?",
        a: "The value at vest (or the ESPP discount) is taxed as salary and becomes the cost. On sale, the gain is converted at the SBI TT buying rate: long-term after 24 months at 12.5% without indexation, short-term at slab rates. Holdings go in Schedule FA every calendar year, and US tax withheld on dividends is claimed through Form 67.",
      },
      {
        q: "Is this tax advice?",
        a: "No. EVC gives planning estimates for decision support. For filing, or for a decision with large tax consequences, speak to a qualified CA.",
      },
    ],
  },
  {
    key: "firms",
    label: "Startups & CA firms",
    items: [
      {
        q: "Is there ESOP software for CA and CS firms in India?",
        a: "Yes. EVC's Advisor Console manages ESOP work across client companies: registers, approvals and valuations, a diligence report, the perquisite and TDS ledger, foreign RSU capital gains for individual clients, and one compliance calendar for every client.",
      },
      {
        q: "Which broker files does the Foreign Equity Tax Pack read?",
        a: "Excel or CSV downloads of either a transaction history or a realised gains report, from any broker: Morgan Stanley at Work (E*TRADE), Charles Schwab and Fidelity are the most common. Columns are matched by name. PDF statements and contract notes are not read.",
      },
      {
        q: "Does EVC prepare Schedule FA?",
        a: "It computes the Schedule FA A3 and A2 figures for each calendar year: initial value, peak value (checked every trading day), closing value and sale proceeds, each at the SBI TT buying rate of its own date. Country, address and cash balances are filled from the statement.",
      },
      {
        q: "Does EVC calculate the ESOP expense under Ind AS 102?",
        a: "Yes. The Startup plan's expense report follows Ind AS 102, the ICAI Guidance Note and ASC 718: Black-Scholes or your valuer's value, graded or straight-line, leaver reversals, quarterly figures and the journal entry, in Excel and PDF.",
      },
      {
        q: "Which ESOP filings does the compliance calendar track?",
        a: "PAS-3 within 30 days of allotment, MGT-14 for the scheme resolution, TDS on the perquisite, quarterly TDS returns, Form 16, deferred TDS for eligible startups, leavers' exercise windows, option expiries and valuation age, plus advance tax, ITR and Form 67 for individuals. Reminders go out at 30, 7 and 1 day before, and on the day.",
      },
      {
        q: "Does EVC file PAS-3, MGT-14 or TDS returns?",
        a: "No. EVC computes, tracks and reminds. Filing stays with your CS or CA on the MCA and TRACES portals; the filing date entered in EVC closes the item.",
      },
    ],
  },
  {
    key: "data",
    label: "Data & trust",
    items: [
      {
        q: "What happens to my grant document?",
        a: "It is used to build your model. Our privacy policy sets out exactly how data is stored and handled.",
      },
      {
        q: "Who uses EVC today?",
        a: "Employees modelling their own grants, and companies including Ather Energy and Revolt Motors. The Advisor Console lets CA and advisory firms manage ESOP work across client companies.",
      },
    ],
  },
  {
    key: "plans",
    label: "Plans",
    items: [
      {
        q: "What does the free plan include?",
        a: "The free simulator models a grant from numbers you enter. PRO adds grant-document upload with field confirmation, the full connected model, Offer Intelligence and the one-page report.",
      },
      {
        q: "What is the Startup plan?",
        a: "₹14,999 a year for a startup managing its own cap table and ESOPs, with up to 25 employees holding options. More employees or a custom term are available on request, and so is a free trial.",
      },
      {
        q: "How does pricing work for teams, startups and advisory firms?",
        a: "See the pricing page for current plans, or book a 20-minute call and we will walk through what fits your team, startup or client base.",
      },
    ],
  },
];

/* ============================================================
   FORMATTING
============================================================ */

const inr = (value: number) =>
  `₹${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-IN")}`;

function short(value: number) {
  if (Math.abs(value) >= CRORE) return `₹${(value / CRORE).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(1)} L`;
  return inr(value);
}

function axisShort(value: number) {
  if (value >= CRORE) return `₹${Number((value / CRORE).toFixed(1))}Cr`;
  if (value >= 100_000) return `₹${Math.round(value / 100_000)}L`;
  return `₹${Math.round(value / 1000)}k`;
}

const TOOLTIP_STYLE: CSSProperties = {
  background: "rgba(2,13,31,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 18px 40px -16px rgba(0,0,0,0.6)",
};

/* ============================================================
   HOOKS
============================================================ */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  return reduced;
}

function useAnimatedNumber(target: number, duration = 650) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return value;
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ============================================================
   PAGE
============================================================ */

type Slot = { date: string; label: string };

export default function HomePage() {
  const reduced = useReducedMotion();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Hero "Employees" window: the sample grant run through the real tax engine.
  const heroSample = useMemo(() => {
    const exitCr = 50;
    const model = runModel(SAMPLE.vestedOptions, exitCr * CRORE);
    return {
      company: SAMPLE.company,
      totalOptions: SAMPLE.totalOptions,
      vestedOptions: SAMPLE.vestedOptions,
      strike: SAMPLE.strike,
      vestingYears: SAMPLE.vestingMonths / 12,
      cliffYears: SAMPLE.cliffMonths / 12,
      exitCr,
      gross: model.gross,
      exerciseCost: model.exerciseCost,
      tax: model.tax,
      takeHome: model.takeHome,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/meetings/availability?days=21", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));

        const data = (await response.json()) as {
          availability?: Array<{ date: string; slots: Array<{ label: string }> }>;
        };

        if (cancelled) return;

        setSlots(
          (data.availability ?? [])
            .flatMap((day) =>
              day.slots.map((slot) => ({
                date: day.date,
                label: slot.label.replace(/\s+IST$/i, "").trim(),
              }))
            )
            .slice(0, 4)
        );
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="evc-home overflow-x-clip bg-white text-[#042653] antialiased">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* ======================= HERO ======================= */}
      <HeroShowcase employee={heroSample} />

      {/* ======================= PROBLEM ======================= */}
      <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <Reveal>
            <Eyebrow>The problem</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              A grant letter says how many options.{" "}
              <span className="text-slate-400">Nobody tells you how much money that is.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-lg leading-8 text-slate-600">
              Employees guess. HR answers the same questions in one-off emails.
              Advisors rebuild the same spreadsheet for every client. The
              numbers exist, but the answer people actually need is scattered
              across a PDF, a cap table and a tax slab.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock3, q: "How much is vested today?", sub: "And what lapses if I leave next month?" },
            { icon: Landmark, q: "What does exercising cost?", sub: "Cash out of pocket, long before any exit." },
            { icon: ScanLine, q: "How much does dilution take?", sub: "Every funding round shrinks the stake." },
            { icon: Scale, q: "What do I keep after tax?", sub: "Taxed at exercise, and again at sale." },
          ].map((item, index) => (
            <Reveal key={item.q} delay={index * 90}>
              <TiltCard className="h-full rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#042653] text-[#F2B421]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-300">0{index + 1}</span>
                </div>
                <p className="mt-6 text-lg font-semibold leading-snug">{item.q}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.sub}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ======================= THREE ENGINES ======================= */}
      <Engines />

      {/* ======================= HOW IT WORKS ======================= */}
      <ScrollStory />

      {/* ======================= DATA FLOW ======================= */}
      <DataFlow />

      {/* ======================= REPORT FACTS ======================= */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 divide-x divide-slate-200 px-4 sm:px-6 lg:grid-cols-4">
          {REPORT_FACTS.map((fact, index) => (
            <Reveal key={fact.label} delay={index * 80}>
              <div className="px-4 py-10 text-center sm:px-8">
                <CountUp value={fact.value} suffix={fact.suffix} className="text-4xl font-semibold tracking-tight text-[#042653] sm:text-5xl" />
                <p className="mt-2 text-sm text-slate-500">{fact.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ======================= OUTPUT ======================= */}
      <section id="output" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <Reveal>
            <Eyebrow>The output</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Where the money actually goes.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Paper value is the number people remember. Take-home is the
              number that matters. EVC shows every rupee in between.
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-slate-700">
              {[
                "Built from the employee’s own confirmed grant",
                "Bear, Base and Bull exits side by side",
                "Every assumption listed, with what is not modelled",
                "Export as PDF, CSV or Excel",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#F2B421] text-[#020d1f]">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <WaterfallCard />
          </Reveal>
        </div>
      </section>

      {/* ======================= PLATFORM ======================= */}
      <section className="relative overflow-hidden bg-[#020d1f] py-24 text-white md:py-32">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="evc-aurora pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <Reveal>
              <EyebrowDark>The platform</EyebrowDark>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Everything between the grant letter and the decision.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <Link href="/pricing" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#F2B421] hover:text-white">
                Compare Free and PRO
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-6">
            <Bento className="lg:col-span-4" tag="Vesting" title="See what is vested on any date." text="Cliff, monthly schedule, and what lapses if you leave, on one timeline.">
              <VestingChart />
            </Bento>
            <Bento className="lg:col-span-2" tag="Tax" title="Both tax events, split." text="Perquisite at exercise, capital gains at sale, for residents, RNORs and NRIs.">
              <TaxDonut />
            </Bento>
            <Bento className="lg:col-span-3" tag="Dilution" title="Ownership, round by round." text="Watch the stake shrink before it surprises anyone.">
              <DilutionChart />
            </Bento>
            <Bento className="lg:col-span-3" tag="Offer Intelligence" title="Two offers, one basis." text="Guaranteed cash and equity opportunity, compared honestly.">
              <OfferChart />
            </Bento>
            <Bento className="lg:col-span-3" tag="Advisor Console" title="Every client, one console." text="Client companies, grant registers, tax events, foreign RSU gains and one compliance calendar.">
              <AdvisorTable />
            </Bento>
            <Bento className="lg:col-span-3" tag="Team Intelligence" title="Reports for the whole team." text="Roll clear reports out from each employee’s own grant.">
              <TeamRollout />
            </Bento>
          </div>
        </div>
      </section>

      {/* ======================= PRODUCTS (what EVC does, in full) ======================= */}
      <ProductsSection />

      {/* ======================= COMPLIANCE CALENDAR ======================= */}
      <ComplianceSection />

      {/* ======================= STARTUP EQUITY DESK ======================= */}
      <CapTableToolSection />
      <StartupDeskSection
        companyName={SAMPLE.company}
        employeeOptions={SAMPLE.totalOptions}
        vestedOptions={SAMPLE.vestedOptions}
        strike={SAMPLE.strike}
        baseTakeHome={runModel(SAMPLE.totalOptions, 50 * CRORE).takeHome}
      />

      {/* ======================= AUDIENCES ======================= */}
      <Audiences />

      {/* ======================= CUSTOMER VOICES (real only) ======================= */}
      {CUSTOMER_QUOTES.length > 0 && <CustomerVoices reduced={reduced} />}

      {/* ======================= WHY EVC ======================= */}
      <WhyChooseUs />

      {/* ======================= WHY NOT JUST BUILD IT WITH AI ======================= */}
      <BuildWithAiSection />

      {/* ======================= WORTH THE MONEY ======================= */}
      <WorthItSection />

      {/* ======================= OBJECTIONS ======================= */}
      <Objections />

      {/* ======================= BUILT TO BE CHECKED ======================= */}
      <TrustSection />

      {/* ======================= SEE IT WORKING ======================= */}
      <VideoSection />

      {/* ======================= WHY TRUST A ONE-FOUNDER COMPANY ======================= */}
      <FounderTrustSection />

      {/* ======================= PARTNER PROGRAMME ======================= */}
      <PartnerProgram />

      {/* ======================= TALK TO US ======================= */}
      <TalkToUs slots={slots} loading={slotsLoading} />

      {/* ======================= FAQ ======================= */}
      <FaqSection />

      {/* ======================= FINAL CTA ======================= */}
      <FinalCta />

      <StickyCta />

      <div id="contact-form">
        <Footer />
      </div>
    </main>
  );
}

type HeroEmployeeSample = {
  company: string;
  totalOptions: number;
  vestedOptions: number;
  strike: number;
  vestingYears: number;
  cliffYears: number;
  exitCr: number;
  gross: number;
  exerciseCost: number;
  tax: number;
  takeHome: number;
};

type ModeKey = "startups" | "employees" | "firms";

const CYCLE_MS = 9000;

/* Shipped in November 2026; the hero badge cycles through these. */
const WHATS_NEW = [
  "Compliance calendar with reminders",
  "ESOP expense report · Ind AS 102",
  "Exercises → PAS-3, TDS, Form 3921",
  "Foreign RSU / ESPP tax pack for CAs",
  "Resident, RNOR and NRI tax",
  "Team logins and change history",
];
const TICK_MS = 50;

const MODES: {
  key: ModeKey;
  tab: string;
  icon: typeof Building2;
  product: string;
  line: string;
  points: string[];
  cta: { label: string; href: string };
  second: { label: string; href: string };
  url: string;
}[] = [
  {
    key: "startups",
    tab: "Startups",
    icon: Building2,
    product: "Startup Equity Desk",
    line: "Your cap table, ESOP pool and every grant, kept current, with the filings tracked for you.",
    points: [
      "Cap table and ESOP pool update as you grant",
      "Exercise → allotment → PAS-3, TDS, Form 3921 tracked",
      "ESOP expense report (Ind AS 102 / ICAI) in Excel and PDF",
      "Compliance calendar with email reminders and .ics export",
      "Team logins (owner, admin, view only) and full change history",
    ],
    cta: { label: "See the Startup Desk", href: "#startups" },
    second: { label: "Book a founder walkthrough", href: "/meeting" },
    url: "esopvalueclarity.com/company",
  },
  {
    key: "employees",
    tab: "Employees",
    icon: UserRound,
    product: "EVC PRO",
    line: "Upload your grant letter. See what you hold, what exercising costs, and what you keep after tax.",
    points: [
      "Every field read from the letter and confirmed by you",
      "Vesting, exercise cost, perquisite tax and capital gains in one model",
      "Resident, RNOR or NRI: the tax changes with your status",
      "Compare offers; one-page PDF report",
    ],
    cta: { label: "Model your grant free", href: "/simulator" },
    second: { label: "Book a 20-minute walkthrough", href: "/meeting" },
    url: "esopvalueclarity.com/pro",
  },
  {
    key: "firms",
    tab: "CA firms",
    icon: Landmark,
    product: "Advisor Console",
    line: "Every client's ESOPs, tax events and deadlines in one console, including foreign RSUs and ESPP.",
    points: [
      "Client grants, exercises and tax-event ledger",
      "One compliance calendar across clients: TDS, PAS-3, MGT-14, ITR",
      "Foreign RSUs / ESPP: Schwab, E*TRADE, Fidelity exports → Schedule FA, CG, Form 67",
      "Team logins and change history per client",
    ],
    cta: { label: "Book a demo", href: "/meeting" },
    second: { label: "See pricing", href: "/pricing" },
    url: "esopvalueclarity.com/advisor/foreign",
  },
];

/* ---------- helpers ---------- */

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const seg = (t: number, a: number, b: number) => ease((t - a) / (b - a));

const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function inrShort(value: number) {
  const v = Math.max(0, value);
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${nf.format(v)}`;
}

function Appear({ t, at, children, className = "" }: { t: number; at: number; children: ReactNode; className?: string }) {
  const on = t >= at;
  return (
    <div
      className={`transition-all duration-500 ease-out ${on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/* ============================================================
   HERO: three products, each shown working (sample data).
   Tabs cycle on their own; hovering the window pauses it.
============================================================ */

function HeroShowcase({ employee }: { employee: HeroEmployeeSample }) {
  const customers = CUSTOMERS;
  const reduced = useReducedMotion();
  const [state, setState] = useState<{ index: number; p: number }>({ index: 0, p: 0 });
  const [paused, setPaused] = useState(false);
  const [newIndex, setNewIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setNewIndex((i) => (i + 1) % WHATS_NEW.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setState((s) => {
        const p = s.p + TICK_MS / CYCLE_MS;
        return p >= 1 ? { index: (s.index + 1) % MODES.length, p: 0 } : { index: s.index, p };
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const mode = MODES[state.index];
  // The demo plays in the first ~85% of the cycle and then holds.
  const t = reduced ? 1 : clamp(state.p / 0.85);

  return (
    <section className="relative isolate overflow-hidden bg-[#020d1f] text-white">
      <style dangerouslySetInnerHTML={{ __html: HERO_CSS }} />
      <div className="evc-aurora pointer-events-none absolute inset-0 -z-10" />
      <div className="evc-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="evc-beam pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2" />

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:pb-20">
        {/* ---------------- copy ---------------- */}
        <div>
          <p
            className="evc-rise inline-flex max-w-full items-center gap-2 rounded-full border border-[#F2B421]/30 bg-[#F2B421]/[0.08] py-1 pl-1 pr-3 text-xs text-[#FCE3A3] backdrop-blur"
            style={{ animationDelay: "0ms" }}
          >
            <span className="shrink-0 rounded-full bg-[#F2B421] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#020d1f]">
              New
            </span>
            <span key={newIndex} className="evh-swap truncate">
              {WHATS_NEW[newIndex]}
            </span>
          </p>

          <h1
            className="evc-rise mt-6 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[3.4rem] lg:text-[3.9rem]"
            style={{ animationDelay: "80ms" }}
          >
            ESOP grants, cap table, tax and filings.{" "}
            <span className="evc-gold-text">In one place.</span>
          </h1>

          <p className="evc-rise mt-5 max-w-xl text-lg leading-8 text-slate-300" style={{ animationDelay: "160ms" }}>
            EVC is software, built in India for Indian tax and company law, for the three people every ESOP
            touches: the startup that grants it, the employee who holds it, and the CA who files the tax on it.
          </p>

          {/* tabs */}
          <div
            role="tablist"
            aria-label="Who EVC is for"
            className="evc-rise mt-8 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur"
            style={{ animationDelay: "220ms" }}
          >
            {MODES.map((m, i) => {
              const active = i === state.index;
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setState({ index: i, p: 0 });
                    setAudience(MODE_TO_AUDIENCE[m.key]);
                    trackAudience(MODE_TO_AUDIENCE[m.key], "hero_tab");
                  }}
                  className={`relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-white text-[#042653]" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{m.tab}</span>
                  {active && !reduced && (
                    <span
                      className="absolute bottom-0 left-0 h-[3px] bg-[#F2B421]"
                      style={{ width: `${state.p * 100}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* per-mode detail */}
          <div key={mode.key} className="evh-swap mt-6 min-h-[292px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F2B421]">{mode.product}</p>
            <p className="mt-2 text-lg font-medium leading-7 text-white">{mode.line}</p>
            <ul className="mt-4 space-y-2">
              {mode.points.map((point, i) => (
                <li
                  key={point}
                  className="evh-item flex items-start gap-2.5 text-[15px] leading-6 text-slate-300"
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#F2B421]/15">
                    <Check className="h-3 w-3 text-[#F2B421]" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={mode.cta.href}
                className="evc-btn-gold group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
              >
                {mode.cta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={mode.second.href}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/[0.08]"
              >
                <CalendarDays className="h-4 w-4" />
                {mode.second.label}
              </Link>
            </div>
          </div>

          {customers.length > 0 && (
            <div
              className="evc-rise mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6"
              style={{ animationDelay: "400ms" }}
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">In use at</span>
              {customers.map((name) => (
                <span key={name} className="text-lg font-semibold tracking-tight text-white/90">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- product window ---------------- */}
        <div
          className="evc-rise"
          style={{ animationDelay: "240ms" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[#F2B421]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              {/* chrome */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-black/30 px-3 py-1 text-[11px] text-slate-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span key={mode.url} className="evh-swap truncate">
                    {mode.url}
                  </span>
                </div>
                <span className="hidden shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
                  {paused ? "Paused" : "Sample data"}
                </span>
              </div>

              <div key={mode.key} className="evh-swap flex flex-col p-5 sm:min-h-[520px] sm:p-6">
                {mode.key === "startups" && <StartupDemo t={t} company={employee.company} />}
                {mode.key === "employees" && <EmployeeDemo t={t} s={employee} />}
                {mode.key === "firms" && <FirmDemo t={t} />}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Illustrative sample. Hover to pause · click a tab above to switch.
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-5">
        <div className="evc-marquee-mask overflow-hidden">
          <div className={`flex w-max gap-3 ${reduced ? "" : "evc-marquee"}`}>
            {[...CAPABILITIES, ...CAPABILITIES].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#F2B421]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STARTUPS: cap table, pool, new grant, calendar, expense
============================================================ */

const CAP = [
  { label: "Founders", pct: 68, color: "#F2B421" },
  { label: "Seed fund", pct: 14, color: "#5B9BFF" },
  { label: "ESOP pool", pct: 12, color: "#34D399" },
  { label: "Angels", pct: 6, color: "#94A3B8" },
];

const POOL = 120_000;
const GRANTED_BEFORE = 62_000;
const NEW_GRANT = 12_000;

function StartupDemo({ t, company }: { t: number; company: string }) {
  const grow = seg(t, 0.02, 0.25);
  const granted = GRANTED_BEFORE + NEW_GRANT * seg(t, 0.38, 0.5);
  const expense = 684_000 * seg(t, 0.78, 0.92);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Cap table · fully diluted</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{company} Pvt Ltd</p>
        </div>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">10,00,000 shares</span>
      </div>

      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
          {CAP.map((c) => (
            <span key={c.label} className="h-full" style={{ width: `${c.pct * grow}%`, background: c.color }} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-slate-400">
          {CAP.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="truncate">
                {c.label} <span className="text-slate-200 tabular-nums">{Math.round(c.pct * grow)}%</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">ESOP pool</p>
          <p className="mt-1 text-sm text-slate-300 tabular-nums">
            <span className="text-lg font-semibold text-white">{nf.format(granted)}</span> of {nf.format(POOL)} granted
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${(granted / POOL) * 100 * seg(t, 0.05, 0.25)}%` }} />
          </div>
          <Appear t={t} at={0.36} className="mt-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              <BadgeCheck className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">New grant · Priya (Eng) · {nf.format(NEW_GRANT)} options</span>
            </div>
          </Appear>
          <Appear t={t} at={0.54} className="mt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Mail className="h-3.5 w-3.5 text-[#F2B421]" />
              Private grant page sent to Priya
            </div>
          </Appear>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Compliance calendar</p>
          <div className="mt-2 space-y-2">
            {[
              { at: 0.58, title: "PAS-3 · return of allotment", due: "due in 12 days", tone: "amber" },
              { at: 0.64, title: "TDS on perquisite", due: "due 7 Dec", tone: "amber" },
              { at: 0.7, title: "MGT-14 · scheme resolution", due: "filed", tone: "green" },
            ].map((row) => (
              <Appear key={row.title} t={t} at={row.at}>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs">
                  <span className="min-w-0 truncate text-slate-200">{row.title}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      row.tone === "green" ? "bg-emerald-400/15 text-emerald-300" : "bg-[#F2B421]/15 text-[#FCE3A3]"
                    }`}
                  >
                    {row.due}
                  </span>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </div>

      <Appear t={t} at={0.76} className="mt-auto">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#F2B421]/25 bg-[#F2B421]/[0.07] p-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#FCE3A3]/80">ESOP expense · FY 2025-26</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-white">{inrShort(expense)}</p>
            <p className="text-[11px] text-slate-400">Ind AS 102 / ICAI Guidance Note · graded vesting</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1 text-[11px] text-slate-200">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1 text-[11px] text-slate-200">
              <FileText className="h-3.5 w-3.5" /> PDF
            </span>
          </div>
        </div>
      </Appear>
    </div>
  );
}

/* ============================================================
   EMPLOYEES: grant letter -> confirmed fields -> after tax
============================================================ */

const RESIDENCY = ["Resident", "RNOR", "NRI"];

function EmployeeDemo({ t, s }: { t: number; s: HeroEmployeeSample }) {
  const fields = [
    { label: "Options granted", value: nf.format(s.totalOptions) },
    { label: "Vested today", value: nf.format(s.vestedOptions) },
    { label: "Exercise price", value: `₹${s.strike.toFixed(2)}` },
    { label: "Vesting", value: `${s.vestingYears} yrs · ${s.cliffYears}-yr cliff` },
  ];
  const k = seg(t, 0.5, 0.72);
  const residency = t < 0.86 ? 0 : t < 0.93 ? 1 : 2;
  const scanning = t < 0.42;

  const bars = [
    { label: "On paper", value: s.gross, color: "#94A3B8" },
    { label: "Exercise cost", value: s.exerciseCost, color: "#64748B" },
    { label: "Tax", value: s.tax, color: "#5B9BFF" },
    { label: "You keep", value: s.takeHome, color: "#F2B421" },
  ];
  const max = Math.max(1, s.gross);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 sm:grid-cols-[124px_minmax(0,1fr)]">
        {/* letter */}
        <div className="relative h-[150px] overflow-hidden rounded-xl bg-white p-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#042653]">Grant letter</p>
          <div className="mt-2 space-y-1.5">
            {[90, 70, 84, 60, 78, 50, 88, 66].map((w, i) => (
              <span key={i} className="block h-1.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="absolute bottom-2 left-3 text-[8px] text-slate-400">{s.company}.pdf</p>
          {scanning && (
            <span className="evh-scan pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-[#F2B421]/50 to-transparent" />
          )}
        </div>

        {/* fields */}
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            <ScanLine className="h-3.5 w-3.5 text-[#F2B421]" />
            {scanning ? "Reading the letter…" : "Fields confirmed"}
          </p>
          <div className="mt-2 space-y-1">
            {fields.map((f, i) => (
              <Appear key={f.label} t={t} at={0.08 + i * 0.08}>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs">
                  <span className="truncate text-slate-400">{f.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5 font-semibold text-white tabular-nums">
                    {f.value}
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                </div>
              </Appear>
            ))}
          </div>
        </div>
      </div>

      <Appear t={t} at={0.46} className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">What you keep after tax</p>
            <p className="mt-1 text-[2.1rem] font-semibold leading-none tracking-tight text-[#F2B421] tabular-nums">
              {inrShort(s.takeHome * k)}
            </p>
          </div>
          <p className="text-right text-[11px] leading-4 text-slate-400">
            ₹{s.exitCr} Cr exit
            <br />
            {nf.format(s.vestedOptions)} vested options
          </p>
        </div>
        <div className="mt-3 space-y-1.5">
          {bars.map((b) => (
            <div key={b.label} className="grid grid-cols-[84px_minmax(0,1fr)_64px] items-center gap-2 text-[11px]">
              <span className="text-slate-400">{b.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <span className="block h-full rounded-full" style={{ width: `${(b.value / max) * 100 * k}%`, background: b.color }} />
              </span>
              <span className="text-right text-slate-200 tabular-nums">{inrShort(b.value * k)}</span>
            </div>
          ))}
        </div>
      </Appear>

      <Appear t={t} at={0.8} className="mt-auto">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="text-[11px] text-slate-400">Tax residency</span>
          <div className="flex gap-1">
            {RESIDENCY.map((r, i) => (
              <span
                key={r}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                  i === residency ? "bg-white text-[#042653]" : "text-slate-400"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </Appear>
    </div>
  );
}

/* ============================================================
   CA FIRMS: broker files -> lots -> ITR schedules + Excel
============================================================ */

const FILES = [
  { name: "Schwab · Realized gains.csv", at: 0.02 },
  { name: "E*TRADE · Gains & Losses.xlsx", at: 0.1 },
  { name: "Fidelity · ESPP purchases.csv", at: 0.18 },
];

const LOTS = [
  { what: "RSU vest → sold", qty: "40 sh", tag: "LTCG", tone: "gold" },
  { what: "ESPP buy → sold", qty: "25 sh", tag: "STCG", tone: "sky" },
  { what: "RSU vest → held", qty: "60 sh", tag: "Sch. FA", tone: "green" },
  { what: "Dividend · US tax withheld", qty: "", tag: "FTC", tone: "sky" },
];

const OUTPUTS = ["Schedule FA", "Schedule CG", "FSI / TR", "Form 67"];

function FirmDemo({ t }: { t: number }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Foreign Equity Tax Pack</p>
          <p className="mt-0.5 text-sm font-semibold text-white">Client: A. Mehta · FY 2025-26</p>
        </div>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">3 brokers</span>
      </div>

      <div className="space-y-1.5">
        {FILES.map((f) => (
          <div
            key={f.name}
            className={`flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs transition-all duration-500 ${
              t >= f.at ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-200">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[#5B9BFF]" />
              <span className="truncate">{f.name}</span>
            </span>
            <span className={`shrink-0 text-[10px] font-semibold ${t >= f.at + 0.1 ? "text-emerald-300" : "text-slate-500"}`}>
              {t >= f.at + 0.1 ? "read ✓" : "reading…"}
            </span>
          </div>
        ))}
      </div>

      <Appear t={t} at={0.36} className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="px-1 text-[11px] text-slate-400">Lots matched · SBI TT rate (Rule 115) applied · splits adjusted</p>
        <div className="mt-2 space-y-1">
          {LOTS.map((l, i) => (
            <Appear key={l.what} t={t} at={0.4 + i * 0.06}>
              <div className="grid grid-cols-[minmax(0,1fr)_48px_64px] items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs">
                <span className="truncate text-slate-200">{l.what}</span>
                <span className="text-right text-slate-400 tabular-nums">{l.qty}</span>
                <span
                  className={`justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    l.tone === "gold"
                      ? "bg-[#F2B421]/15 text-[#FCE3A3]"
                      : l.tone === "green"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-[#5B9BFF]/15 text-[#BFD7FF]"
                  }`}
                >
                  {l.tag}
                </span>
              </div>
            </Appear>
          ))}
        </div>
      </Appear>

      <div className="mt-auto space-y-3">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {OUTPUTS.map((o, i) => (
            <Appear key={o} t={t} at={0.68 + i * 0.04}>
              <span className="flex items-center justify-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-200">
                <Check className="h-3 w-3" /> {o}
              </span>
            </Appear>
          ))}
        </div>
        <Appear t={t} at={0.86}>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F2B421] px-4 py-2.5 text-[#020d1f]">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Download className="h-4 w-4" /> Excel working paper ready
            </span>
            <span className="text-[11px] font-medium">Advance tax + ITR dates in calendar</span>
          </div>
        </Appear>
      </div>
    </div>
  );
}

/* ============================================================
   CSS (scoped by class names; page CSS supplies evc-*)
============================================================ */

const HERO_CSS = `
.evh-swap { animation: evhSwap .5s cubic-bezier(.2,.7,.2,1); }
@keyframes evhSwap { from { opacity: 0; transform: translateY(8px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
.evh-item { opacity: 0; animation: evhItem .5s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes evhItem { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
.evh-scan { animation: evhScan 1.6s ease-in-out infinite; }
@keyframes evhScan { 0% { transform: translateY(-20px); } 100% { transform: translateY(150px); } }
@media (prefers-reduced-motion: reduce) {
  .evh-swap, .evh-item, .evh-scan { animation: none !important; opacity: 1 !important; }
}
`;

/* ============================================================
   HOW IT WORKS (navy, sticky product panel)
============================================================ */

function ScrollStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        });
      },
      { rootMargin: "-35% 0px -50% 0px" }
    );

    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-[#042653] to-[#020d1f] text-white">
      <div className="evc-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <Reveal>
          <EyebrowDark>How it works</EyebrowDark>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            From grant letter to decision, in four steps.
          </h2>
        </Reveal>

        <div className="mt-12 hidden grid-cols-4 gap-4 lg:grid">
          {STORY.map((step, index) => (
            <div key={step.kicker}>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#F2B421] transition-all duration-700" style={{ width: active >= index ? "100%" : "0%" }} />
              </div>
              <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${active >= index ? "text-[#F2B421]" : "text-slate-500"}`}>
                0{index + 1} · {step.kicker}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="space-y-6 lg:space-y-[34vh] lg:pb-[42vh] lg:pt-[4vh]">
            {STORY.map((step, index) => (
              <div
                key={step.title}
                data-index={index}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
              >
                <div
                  className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-500 lg:p-7 ${
                    active === index ? "lg:border-[#F2B421]/40 lg:bg-white/[0.07] lg:opacity-100" : "lg:opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-xl transition duration-500 ${
                        active === index ? "bg-[#F2B421] text-[#020d1f] shadow-[0_12px_30px_-10px_rgba(242,180,33,0.8)]" : "bg-white/10 text-[#F2B421]"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2B421]">
                      Step 0{index + 1} · {step.kicker}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-7 text-slate-300">{step.text}</p>
                  <p className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">{step.meta}</p>

                  <div className="mt-6 lg:hidden">
                    <div className="min-h-[340px] overflow-hidden rounded-2xl bg-white p-4 text-[#042653] sm:p-5">
                      <StoryPanel index={index} active />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-[16vh]">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white text-[#042653] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">esopvalueclarity.com/pro</p>
                  <span className="text-[11px] font-semibold text-[#042653]">Step 0{active + 1}/04</span>
                </div>
                <div className="relative h-[430px]">
                  {STORY.map((_, index) => (
                    <div
                      key={index}
                      className="absolute inset-0 p-7 transition-all duration-700 ease-out"
                      style={{
                        opacity: active === index ? 1 : 0,
                        transform: `translateY(${active === index ? 0 : active > index ? -24 : 24}px)`,
                        pointerEvents: active === index ? "auto" : "none",
                      }}
                    >
                      <StoryPanel index={index} active={active === index} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryPanel({ index, active }: { index: number; active: boolean }) {
  const play = active ? "evc-play" : "";

  if (index === 0) {
    return (
      <div className={`relative h-full ${play}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Upload grant document</p>
          <span className="rounded-full bg-[#FFF4D6] px-2.5 py-1 text-[11px] font-medium text-[#8A5A00]">Extracting</span>
        </div>
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#042653] text-[#F2B421]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">grant_letter_northstar.pdf</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="evc-fill h-full rounded-full bg-[#F2B421]" style={{ "--to": "86%" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {[92, 78, 85, 64, 88, 72].map((w, i) => (
              <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="evc-scan pointer-events-none absolute inset-x-4 top-20 h-10 rounded bg-gradient-to-b from-[#F2B421]/0 via-[#F2B421]/25 to-[#F2B421]/0" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          {["Options", "Vesting", "Exit clauses"].map((t, i) => (
            <span key={t} className="evc-stagger rounded-lg bg-slate-50 px-2 py-2 font-medium text-slate-600 ring-1 ring-slate-200" style={{ animationDelay: `${400 + i * 150}ms` }}>
              {t} found
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (index === 1) {
    const fields = [
      ["Options granted", "12,500", "p.1"],
      ["Exercise price", "₹18.50", "p.1"],
      ["Vesting", "48 mo · 12-mo cliff", "p.2"],
      ["Expiry", "31 Mar 2036", "p.3"],
      ["After termination", "90 days", "p.3"],
    ];
    return (
      <div className={`h-full ${play}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Confirm extracted fields</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">5 of 9 confirmed</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1.2fr_1fr_auto] bg-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>Field</span>
            <span>Value</span>
            <span>Source</span>
          </div>
          {fields.map(([label, value, page], i) => (
            <div key={label} className="evc-stagger grid grid-cols-[1.2fr_1fr_auto] items-center border-t border-slate-100 px-4 py-3 text-sm" style={{ animationDelay: `${i * 130}ms` }}>
              <span className="text-slate-500">{label}</span>
              <span className="font-medium">{value}</span>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                {page}
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-3 py-1 text-xs font-medium text-[#8A5A00]">
          3 high-priority clauses flagged for review
        </p>
      </div>
    );
  }

  if (index === 2) {
    const data = [
      { name: "Bear", cr: 25 },
      { name: "Base", cr: 50 },
      { name: "Bull", cr: 100 },
    ].map((s) => {
      const m = runModel(SAMPLE.vestedOptions, s.cr * CRORE);
      return { name: `${s.name} · ₹${s.cr}Cr`, takeHome: m.takeHome, tax: m.tax, cost: m.exerciseCost };
    });

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Take-home by exit · vested options</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">New regime</span>
        </div>
        <div className="mt-4 h-[260px] min-h-0 lg:h-auto lg:flex-1">
          {active && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="#EEF2F7" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => axisShort(v)} tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff", padding: 0 }} labelStyle={{ color: "#94A3B8" }} formatter={(value, name) => [inr(Number(value)), String(name)]} cursor={{ fill: "rgba(4,38,83,0.04)" }} />
                <Bar dataKey="takeHome" name="Take-home" stackId="a" fill={NAVY} animationDuration={900} />
                <Bar dataKey="tax" name="Tax" stackId="a" fill={GOLD} animationDuration={900} />
                <Bar dataKey="cost" name="Exercise cost" stackId="a" fill="#CBD5E1" radius={[6, 6, 0, 0]} animationDuration={900}>
                  <LabelList dataKey="takeHome" position="top" formatter={(v) => short(Number(v))} style={{ fill: NAVY, fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
          {[
            ["Take-home", NAVY],
            ["Tax", GOLD],
            ["Exercise cost", "#CBD5E1"],
          ].map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const base = runModel(SAMPLE.vestedOptions, 50 * CRORE);
  return (
    <div className={`h-full ${play}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Export report</p>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Ready</span>
      </div>
      <div className="evc-stagger mx-auto mt-4 max-w-md overflow-hidden rounded-xl border border-slate-200 shadow-[0_24px_50px_-30px_rgba(4,38,83,0.5)]">
        <div className="bg-[#042653] px-4 py-3 text-white">
          <p className="text-xs font-semibold">ESOP Value Clarity — Employee Equity Report</p>
          <p className="text-[10px] text-slate-300">Sample grant · vested options</p>
        </div>
        <div className="grid grid-cols-4 gap-px bg-slate-200 text-center">
          {[
            ["12,500", "granted"],
            ["6,250", "vested"],
            ["₹18.50", "strike"],
            [short(base.exerciseCost), "to exercise"],
          ].map(([v, l]) => (
            <div key={l} className="bg-[#F5F8FF] px-2 py-2">
              <p className="text-xs font-semibold">{v}</p>
              <p className="text-[9px] text-slate-500">{l}</p>
            </div>
          ))}
        </div>
        <div className="p-4">
          <div className="rounded-lg bg-[#FFF8E6] p-3 text-xs leading-5 text-slate-700">
            <strong className="text-[#042653]">Plain reading:</strong> in the Base case, {short(base.gross)} on paper becomes about{" "}
            <strong className="text-[#042653]">{short(base.takeHome)}</strong> in hand.
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {["PDF", "CSV", "Excel"].map((format, i) => (
          <span key={format} className="evc-stagger inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium" style={{ animationDelay: `${300 + i * 120}ms` }}>
            <FileText className="h-3 w-3 text-[#F2B421]" />
            {format}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   WATERFALL (recharts, stacked with invisible base)
============================================================ */

function WaterfallCard() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const m = runModel(SAMPLE.vestedOptions, 50 * CRORE);

  const data = [
    { name: "On paper", base: 0, value: m.gross, color: NAVY },
    { name: "Exercise cost", base: m.gross - m.exerciseCost, value: m.exerciseCost, color: SLATE },
    { name: "Tax at exercise", base: m.gross - m.exerciseCost - m.taxAtExercise, value: m.taxAtExercise, color: "#F7C95A" },
    { name: "Tax at sale", base: m.takeHome, value: m.taxAtSale, color: GOLD },
    { name: "In hand", base: 0, value: m.takeHome, color: "#1D4ED8" },
  ];

  return (
    <div ref={ref} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-50px_rgba(4,38,83,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-sm font-semibold">Base case · ₹50 Cr exit</p>
          <p className="text-xs text-slate-500">Sample grant · 6,250 vested options</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Value kept</p>
          <p className="text-lg font-semibold text-[#1D4ED8]">{((m.takeHome / m.gross) * 100).toFixed(1)}%</p>
        </div>
      </div>
      <div className="h-[300px] px-3 pt-6 sm:px-5">
        {inView && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tickFormatter={(v: number) => axisShort(v)} tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "#fff", padding: 0 }}
                labelStyle={{ color: "#94A3B8" }}
                cursor={{ fill: "rgba(4,38,83,0.04)" }}
                formatter={(value) => [inr(Number(value)), "Amount"]}
              />
              <Bar dataKey="base" stackId="w" fill="transparent" tooltipType="none" isAnimationActive={false} />
              <Bar dataKey="value" stackId="w" radius={[6, 6, 6, 6]} animationDuration={1100}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v) => short(Number(v))} style={{ fill: NAVY, fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="border-t border-slate-100 px-6 py-5 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-[#042653]">Plain reading:</span> {short(m.gross)} on paper becomes about {short(m.takeHome)} in hand, after{" "}
        {short(m.exerciseCost)} to exercise and {short(m.tax)} in estimated tax.
      </p>
    </div>
  );
}

/* ============================================================
   PLATFORM BENTO + CHARTS
============================================================ */

function Bento({
  className = "",
  tag,
  title,
  text,
  children,
}: {
  className?: string;
  tag: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  function handleMove(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`evc-spot group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition duration-700 hover:border-[#F2B421]/30 ${
        inView ? "evc-play translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      <span className="relative inline-flex w-fit rounded-full border border-[#F2B421]/30 bg-[#F2B421]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F2B421]">
        {tag}
      </span>
      <h3 className="relative mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="relative mt-1 text-sm leading-6 text-slate-400">{text}</p>
      <div className="relative mt-6 h-[200px]">{inView ? children : null}</div>
    </div>
  );
}

const DARK_AXIS = { fill: "#64748B", fontSize: 10 };

function VestingChart() {
  const data = Array.from({ length: SAMPLE.vestingMonths + 1 }, (_, month) => ({
    month,
    vested: month < SAMPLE.cliffMonths ? 0 : Math.round((SAMPLE.totalOptions * month) / SAMPLE.vestingMonths),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="evcVest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY} stopOpacity={0.5} />
            <stop offset="100%" stopColor={SKY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="month" type="number" domain={[0, 48]} ticks={[0, 12, 24, 36, 48]} tickFormatter={(v: number) => `Month ${v}`} tick={DARK_AXIS} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v: number) => v.toLocaleString("en-IN")} tick={DARK_AXIS} axisLine={false} tickLine={false} width={48} />
        <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff", padding: 0 }} labelStyle={{ color: "#94A3B8" }} labelFormatter={(v) => `Month ${v}`} formatter={(value) => [Number(value).toLocaleString("en-IN"), "Vested options"]} />
        <ReferenceLine x={12} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" label={{ value: "Cliff", fill: "#94A3B8", fontSize: 10, position: "insideTopLeft" }} />
        <ReferenceLine x={24} stroke={GOLD} strokeDasharray="3 3" label={{ value: "Today · 6,250", fill: GOLD, fontSize: 10, position: "insideTopRight" }} />
        <Area type="stepAfter" dataKey="vested" stroke={SKY} strokeWidth={2} fill="url(#evcVest)" animationDuration={1200} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TaxDonut() {
  const m = runModel(SAMPLE.vestedOptions, 50 * CRORE);
  const data = [
    { name: "Take-home", value: m.takeHome, color: SKY },
    { name: "Tax at exercise", value: m.taxAtExercise, color: "#F7C95A" },
    { name: "Tax at sale", value: m.taxAtSale, color: GOLD },
    { name: "Exercise cost", value: m.exerciseCost, color: "#475569" },
  ];

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff", padding: 0 }} formatter={(value, name) => [inr(Number(value)), String(name)]} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none" animationDuration={1100}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Total tax</p>
          <p className="text-lg font-semibold text-white">{short(m.tax)}</p>
        </div>
      </div>
    </div>
  );
}

function DilutionChart() {
  const start = (SAMPLE.vestedOptions / SAMPLE.companyShares) * 100;
  const steps = [
    { round: "Today", factor: 1 },
    { round: "Series B", factor: 0.88 },
    { round: "Series C", factor: 0.9 },
    { round: "Pre-IPO", factor: 0.933 },
  ];
  let current = start;
  const data = steps.map((s) => {
    current = current * s.factor;
    return { round: s.round, ownership: Number(current.toFixed(3)) };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <defs>
          <linearGradient id="evcDil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor="#B7800E" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="round" tick={DARK_AXIS} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v: number) => `${v}%`} tick={DARK_AXIS} axisLine={false} tickLine={false} width={44} domain={[0, 0.7]} />
        <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff", padding: 0 }} labelStyle={{ color: "#94A3B8" }} formatter={(value) => [`${value}%`, "Ownership"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="ownership" fill="url(#evcDil)" radius={[6, 6, 0, 0]} animationDuration={1100}>
          <LabelList dataKey="ownership" position="top" formatter={(v) => `${v}%`} style={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function OfferChart() {
  /* Illustrative offers: 4-year cash vs equity value at a ₹500 Cr exit (pre-tax). */
  const exit = 500 * CRORE;
  const keep = 1 - SAMPLE.dilution / 100;
  const data = [
    { name: "Offer A", cash: 24_00_000 * 4, equity: 0.0005 * keep * exit },
    { name: "Offer B", cash: 21_50_000 * 4, equity: 0.0012 * keep * exit },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => axisShort(v)} tick={DARK_AXIS} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#E2E8F0", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#fff", padding: 0 }} labelStyle={{ color: "#94A3B8" }} formatter={(value, name) => [inr(Number(value)), String(name)]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="cash" name="4-year cash" stackId="o" fill={SKY} radius={[6, 0, 0, 6]} animationDuration={1000} />
            <Bar dataKey="equity" name="Equity at ₹500 Cr exit" stackId="o" fill={GOLD} radius={[0, 6, 6, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: SKY }} />
          4-year cash
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: GOLD }} />
          Equity at ₹500 Cr exit, pre-tax
        </span>
        <span>Illustrative offers</span>
      </div>
    </div>
  );
}

function AdvisorTable() {
  const rows = [
    { name: "Client company A", grants: 24, findings: 0, progress: 100 },
    { name: "Client company B", grants: 61, findings: 2, progress: 72 },
    { name: "Client company C", grants: 9, findings: 0, progress: 100 },
    { name: "Client company D", grants: 37, findings: 1, progress: 54 },
  ];
  return (
    <div className="h-full overflow-hidden rounded-xl ring-1 ring-white/10">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-2 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span>Client</span>
        <span>Grants</span>
        <span>Diligence</span>
        <span className="text-right">Status</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.name} className="evc-stagger grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-2 border-t border-white/5 px-4 py-2.5 text-xs" style={{ animationDelay: `${i * 110}ms` }}>
          <span className="truncate text-white">{row.name}</span>
          <span className="text-slate-400">{row.grants}</span>
          <span className="pr-3">
            <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="evc-fill block h-full rounded-full bg-[#F2B421]" style={{ "--to": `${row.progress}%`, animationDelay: `${i * 110}ms` } as CSSProperties} />
            </span>
          </span>
          <span className="text-right">
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${row.findings === 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
              {row.findings === 0 ? "Ready" : `${row.findings} to check`}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamRollout() {
  const rows = [
    { team: "Engineering", sent: 42, total: 48 },
    { team: "Product & Design", sent: 17, total: 18 },
    { team: "Sales", sent: 21, total: 30 },
    { team: "Operations", sent: 9, total: 14 },
  ];
  return (
    <div className="flex h-full flex-col justify-between gap-3">
      {rows.map((row, i) => (
        <div key={row.team} className="evc-stagger" style={{ animationDelay: `${i * 120}ms` }}>
          <div className="flex justify-between text-xs">
            <span className="text-white">{row.team}</span>
            <span className="text-slate-400 tabular-nums">
              {row.sent}/{row.total} reports
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="evc-fill h-full rounded-full bg-gradient-to-r from-[#5B9BFF] to-[#F2B421]" style={{ "--to": `${(row.sent / row.total) * 100}%`, animationDelay: `${i * 120}ms` } as CSSProperties} />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-slate-500">Illustrative rollout</p>
    </div>
  );
}

/* ============================================================
   BUILT TO BE CHECKED
============================================================ */

function TrustSection() {
  const principles = [
    { icon: FileSearch, title: "Source first", text: "Every number traces back to a confirmed field and the page it came from." },
    { icon: SlidersHorizontal, title: "Assumptions in the open", text: "Dilution, exit value and tax inputs are visible and editable. Nothing hides in a formula." },
    { icon: Scale, title: "Estimates, not promises", text: "Decision support, not tax, legal or investment advice. Every report says so." },
    { icon: LockKeyhole, title: "Your data, handled carefully", text: "Grant documents are used to build your model. The privacy policy sets out exactly how." },
  ];

  const trail = [
    { label: "Field", value: "Exercise price · ₹18.50" },
    { label: "Source", value: "grant_letter.pdf · page 1, clause 3.2" },
    { label: "Status", value: "Confirmed by holder" },
    { label: "Used in", value: "Exercise cost · Tax · Take-home" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <Eyebrow>Built to be checked</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Money decisions need numbers you can verify.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
                A number you cannot trace is a number you cannot defend in front
                of a CA, a founder or your own family. EVC keeps the trail.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {principles.map((item, index) => (
                <Reveal key={item.title} delay={index * 80}>
                  <TiltCard className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF4D6] text-[#B7800E]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={150}>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[#F2B421]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_50px_100px_-50px_rgba(4,38,83,0.55)]">
                <div className="flex items-center justify-between bg-[#042653] px-6 py-4 text-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#F2B421]" />
                    <p className="text-sm font-semibold">Audit trail</p>
                  </div>
                  <span className="text-[11px] text-slate-300">Sample grant</span>
                </div>
                <div className="p-6">
                  <ol className="relative space-y-5 border-l-2 border-dashed border-slate-200 pl-6">
                    {trail.map((step, i) => (
                      <li key={step.label} className="relative">
                        <span className="absolute -left-[33px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#042653] text-[#F2B421] ring-4 ring-white">
                          <Check className="h-3 w-3" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          0{i + 1} · {step.label}
                        </p>
                        <p className="mt-1 text-sm font-medium">{step.value}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-7 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold text-slate-500">Listed on every report: not modelled</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Liquidation preferences", "Multiple share classes", "Buyback tax treatment", "Transaction costs"].map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SEE IT WORKING (video studio)
   - Thumbnail first, YouTube loads only on Play (fast page, no
     three heavy iframes on load)
   - Playlist rail: click, or use arrow keys
   - Cursor spotlight + soft tilt on the player, animated gold frame
============================================================ */

const YT_PLAYLIST_ID = "PLXeZ52MngCE4";
const YT_PLAYLIST_URL = `https://www.youtube.com/playlist?list=${YT_PLAYLIST_ID}`;

const ytThumb = (id: string, size: "maxresdefault" | "hqdefault" | "mqdefault") =>
  `https://i.ytimg.com/vi/${id}/${size}.jpg`;

const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

function VideoSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const railRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const video = VIDEOS[active];
  const next = VIDEOS[(active + 1) % VIDEOS.length];
  const totalMinutes = Math.round(
    VIDEOS.reduce((sum, v) => {
      const [m, sec] = v.duration.split(":").map(Number);
      return sum + m * 60 + sec;
    }, 0) / 60
  );

  const videoSchema = VIDEOS.filter((v) => v.uploadDate).map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [ytThumb(v.id, "hqdefault")],
    uploadDate: v.uploadDate,
    duration: v.durationISO,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
  }));

  function select(index: number, play = playing) {
    setActive(index);
    setPlaying(play);
  }

  function handleRailKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;
    event.preventDefault();
    const index = (active + (forward ? 1 : VIDEOS.length - 1)) % VIDEOS.length;
    select(index);
    railRefs.current[index]?.focus();
  }

  function handleMove(event: ReactMouseEvent<HTMLDivElement>) {
    const node = frameRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--x", `${x * 100}%`);
    node.style.setProperty("--y", `${y * 100}%`);
    if (!playing) {
      node.style.transform = `perspective(1400px) rotateX(${((0.5 - y) * 3).toFixed(2)}deg) rotateY(${((x - 0.5) * 3).toFixed(2)}deg)`;
    }
  }

  function handleLeave() {
    if (frameRef.current) frameRef.current.style.transform = "";
  }

  return (
    <section id="videos" className="relative isolate overflow-hidden bg-[#020d1f] py-24 text-white md:py-32">
      <div className="evc-aurora pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="evc-grid pointer-events-none absolute inset-0 -z-10" />

      {videoSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c") }}
        />
      )}

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Header */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Reveal>
            <EyebrowDark>See it working</EyebrowDark>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Watch the product, <span className="evc-gold-text">not a pitch.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Real screens, real workflows. Pick the video made for you: CA and
              CS firms, employees, or the full product tour.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-wrap gap-2">
              {VIDEOS.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => select(index)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    active === index
                      ? "border-[#F2B421]/60 bg-[#F2B421]/15 text-[#FCE3A3]"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.75fr)]">
          {/* Player */}
          <Reveal>
            <div
              ref={frameRef}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              className="group/frame relative rounded-[28px] p-px transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            >
              {/* animated gold border */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
                <div className="evc-orbit absolute -inset-[60%]" />
              </div>
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[48px] bg-[#F2B421]/10 blur-3xl transition-opacity duration-500 group-hover/frame:opacity-100 lg:opacity-60" />

              <div className="relative overflow-hidden rounded-[27px] bg-[#04122b] p-2 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.95)]">
                {/* window bar */}
                <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>
                  <p className="truncate text-[11px] text-slate-400">
                    {String(active + 1).padStart(2, "0")} / {String(VIDEOS.length).padStart(2, "0")} · {video.label}
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-300 ring-1 ring-white/10">
                    {playing ? (
                      <>
                        <span className="evc-eq inline-flex h-2.5 items-end gap-[2px]">
                          <span /><span /><span />
                        </span>
                        Playing
                      </>
                    ) : (
                      <>
                        <Play className="h-2.5 w-2.5 fill-current" />
                        Ready
                      </>
                    )}
                  </span>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black">
                  {playing ? (
                    <iframe
                      key={video.id}
                      className="evc-swap h-full w-full"
                      src={ytEmbed(video.id)}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setPlaying(true)}
                      aria-label={`Play video: ${video.title}`}
                      className="evc-swap group/play absolute inset-0 block h-full w-full text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ytThumb(video.id, "maxresdefault")}
                        alt=""
                        className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover/play:scale-[1.04]"
                        onLoad={(event) => {
                          // YouTube serves a 120px grey placeholder when no HD thumbnail exists
                          const img = event.currentTarget;
                          if (img.naturalWidth <= 120) img.src = ytThumb(video.id, "hqdefault");
                        }}
                        onError={(event) => {
                          event.currentTarget.src = ytThumb(video.id, "hqdefault");
                        }}
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#020d1f] via-[#020d1f]/35 to-[#020d1f]/10" />
                      <span
                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/frame:opacity-100"
                        style={{ background: "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), rgba(242,180,33,0.18), transparent 45%)" }}
                      />

                      {/* play button */}
                      <span className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
                        <span className="evc-ring absolute h-20 w-20 rounded-full border-2 border-[#F2B421]/70 sm:h-24 sm:w-24" />
                        <span className="evc-ring absolute h-20 w-20 rounded-full border-2 border-[#F2B421]/40 [animation-delay:.9s] sm:h-24 sm:w-24" />
                        <span className="relative grid h-20 w-20 place-items-center rounded-full bg-[#F2B421] text-[#020d1f] shadow-[0_20px_60px_-10px_rgba(242,180,33,0.9)] transition duration-300 group-hover/play:scale-110 sm:h-24 sm:w-24">
                          <Play className="ml-1 h-8 w-8 fill-current sm:h-9 sm:w-9" />
                        </span>
                      </span>

                      {/* caption */}
                      <span className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F2B421]/40 bg-[#020d1f]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F2B421] backdrop-blur">
                          <video.icon className="h-3 w-3" />
                          {video.label}
                        </span>
                        <span className="ml-2 inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-white backdrop-blur">
                          {video.duration}
                        </span>
                        <span className="mt-3 block max-w-xl text-xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                          {video.heading}
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Playlist rail */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center justify-between px-3 pb-3 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Playlist · {VIDEOS.length} videos · {totalMinutes} min
                </p>
                <a
                  href={YT_PLAYLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-[#F2B421] transition hover:text-white"
                >
                  View full playlist
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>

              <div onKeyDown={handleRailKey} className="relative flex flex-col gap-2">
                {/* progress spine */}
                <span className="pointer-events-none absolute bottom-8 left-[27px] top-8 hidden w-px bg-white/10 sm:block" />
                <span
                  className="pointer-events-none absolute left-[27px] top-8 hidden w-px bg-[#F2B421] transition-all duration-700 sm:block"
                  style={{ height: `calc((100% - 4rem) * ${active / Math.max(1, VIDEOS.length - 1)})` }}
                />

                {VIDEOS.map((item, index) => {
                  const isActive = active === index;
                  return (
                    <button
                      key={item.key}
                      ref={(node) => {
                        railRefs.current[index] = node;
                      }}
                      type="button"
                      aria-current={isActive}
                      onClick={() => select(index, true)}
                      className={`group/item relative flex items-center gap-3 rounded-2xl border p-2.5 text-left transition duration-300 ${
                        isActive
                          ? "border-[#F2B421]/40 bg-white/[0.08] shadow-[0_20px_50px_-30px_rgba(242,180,33,0.6)]"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span
                        className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition ${
                          isActive ? "bg-[#F2B421] text-[#020d1f]" : "bg-[#0b1d3d] text-slate-400 ring-1 ring-white/10"
                        }`}
                      >
                        {isActive && playing ? (
                          <span className="evc-eq inline-flex h-3 items-end gap-[2px]">
                            <span /><span /><span />
                          </span>
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>

                      <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ytThumb(item.id, "mqdefault")}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover/item:scale-110"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-px text-[9px] font-semibold tabular-nums text-white">
                          {item.duration}
                        </span>
                        <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover/item:opacity-100">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </span>
                      </span>

                      <span className="min-w-0">
                        <span className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${isActive ? "text-[#F2B421]" : "text-slate-500"}`}>
                          {item.label}
                        </span>
                        <span className={`mt-1 block text-sm font-semibold leading-snug ${isActive ? "text-white" : "text-slate-300"}`}>
                          {item.heading}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* In this video */}
              <div key={video.key} className="evc-panel mt-3 flex-1 rounded-2xl border border-white/10 bg-[#020d1f]/60 p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <BookOpenText className="h-3.5 w-3.5 text-[#F2B421]" />
                  In this video
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{video.description}</p>
                <ul className="mt-3 space-y-2">
                  {video.points.map((point, i) => (
                    <li key={point} className="evc-stagger flex gap-2.5 text-sm text-slate-200" style={{ animationDelay: `${i * 70}ms` }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Action bar */}
        <Reveal delay={160}>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="text-sm text-slate-400">
              Up next: <span className="font-medium text-white">{next.heading}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <a
                href={`https://www.youtube.com/watch?v=${video.id}&list=${YT_PLAYLIST_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
              >
                Watch on YouTube
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => select((active + 1) % VIDEOS.length, true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Play next
              </button>
              <Link
                href={video.cta.href}
                className="evc-btn-gold group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-5 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
              >
                {video.cta.label}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   TALK TO US
============================================================ */

function TalkToUs({ slots, loading }: { slots: Slot[]; loading: boolean }) {
  return (
    <section id="schedule" className="px-4 pb-24 sm:px-6 md:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#020d1f] text-white">
          <div className="evc-aurora pointer-events-none absolute inset-0 opacity-80" />
          <div className="evc-grid pointer-events-none absolute inset-0" />

          <div className="relative grid grid-cols-1 gap-10 p-6 sm:p-8 md:p-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div>
              <EyebrowDark>Talk to us</EyebrowDark>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                20 minutes. Your grant or your clients, on screen.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                Bring a real grant (anonymised is fine). We model it live, and
                you leave knowing exactly what the report would tell you. No
                slide deck.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Building2, title: "HR & founders", text: "Team-wide ESOP clarity" },
                  { icon: Landmark, title: "CA & advisors", text: "Client work in one console" },
                  { icon: UserRound, title: "Employees", text: "One grant, one decision" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-[#F2B421]/30 hover:bg-white/[0.08]">
                    <item.icon className="h-5 w-5 text-[#F2B421]" />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">How the 20 minutes go</p>
                <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    ["0–5 min", "Your situation and questions"],
                    ["5–15 min", "Your grant, modelled live"],
                    ["15–20 min", "What it means and next steps"],
                  ].map(([time, text]) => (
                    <li key={time} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold text-[#F2B421]">{time}</p>
                      <p className="mt-1 text-sm text-slate-200">{text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-6 text-[#042653] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] md:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F7F9FC] p-1.5 ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/evc-mark.png" alt="" className="h-full w-full object-contain" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Product walkthrough with the founder</p>
                  <p className="text-xs text-slate-500">20 minutes · online · IST</p>
                </div>
              </div>

              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Next available times</p>
              <LiveClock />
              <div className="mt-3 min-h-[120px]">
                {loading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => (
                      <Link
                        key={`${slot.date}-${slot.label}`}
                        href="/meeting"
                        className="group rounded-xl border border-slate-200 px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#F2B421] hover:bg-[#FFF8E6]"
                      >
                        <p className="text-xs text-slate-500">{formatDate(slot.date)}</p>
                        <p className="mt-0.5 text-sm font-semibold">{slot.label}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-600">
                    Open the scheduler to see current times.
                  </div>
                )}
              </div>

              <Link
                href="/meeting"
                className="evc-btn-gold group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F2B421] text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
              >
                <CalendarDays className="h-4 w-4" />
                See all times and book
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-sm">
                {["Pick a time that suits you", "Bring an anonymised grant if you have one", "No obligation to buy"].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-slate-600">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </p>
                ))}
              </div>

              <a
                href="mailto:sheshank@esopvalueclarity.com"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#F7F9FC] px-4 py-3 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-[#042653]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Prefer email? sheshank@esopvalueclarity.com</span>
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   LIVE CLOCK (India Standard Time, ticks every second)
============================================================ */

function getIstParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { h: get("hour") % 24, m: get("minute"), s: get("second") };
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    let timeout = 0;
    let interval = 0;
    // Align ticks to the start of each real second.
    timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const { h, m, s } = now ? getIstParts(now) : { h: 10, m: 10, s: 0 };
  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;
  const pad = (n: number) => String(n).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;

  const dateLabel = now
    ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now)
    : "";

  return (
    <div className="mt-3 flex items-center gap-4 rounded-2xl bg-[#042653] p-4 text-white ring-1 ring-[#042653]/10 sm:gap-5">
      {/* watch face */}
      <div className="relative h-[88px] w-[88px] shrink-0 rounded-full bg-gradient-to-b from-[#0B3A78] to-[#021a3d] shadow-[inset_0_2px_6px_rgba(255,255,255,0.15),0_10px_24px_-8px_rgba(0,0,0,0.6)] ring-2 ring-[#F2B421]/70">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(-50%, -50%) rotate(${i * 6}deg) translateY(-38px)` }}
          >
            <span className={`block rounded-full ${i % 5 === 0 ? "h-[7px] w-[2px] bg-[#F2B421]" : "h-[3px] w-px bg-white/40"}`} />
          </span>
        ))}
        {/* hour hand */}
        <span
          className="absolute bottom-1/2 left-1/2 h-[22px] w-[3.5px] origin-bottom rounded-full bg-white"
          style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
        />
        {/* minute hand */}
        <span
          className="absolute bottom-1/2 left-1/2 h-[31px] w-[2.5px] origin-bottom rounded-full bg-white/90"
          style={{ transform: `translateX(-50%) rotate(${minDeg}deg)` }}
        />
        {/* second hand (instant tick, like a quartz watch) */}
        <span
          className="absolute bottom-1/2 left-1/2 h-[36px] w-px origin-bottom bg-[#F2B421]"
          style={{ transform: `translateX(-50%) rotate(${secDeg}deg)` }}
        />
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2B421] ring-2 ring-[#021a3d]" />
      </div>

      {/* digital readout */}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F2B421]">
          <span className="evc-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live · IST
        </p>
        <p className="mt-1 whitespace-nowrap font-mono text-[1.3rem] font-semibold leading-none tracking-tight tabular-nums sm:text-[1.75rem]" aria-live="off">
          {now ? (
            <>
              {pad(h12)}
              <span className="evc-blink">:</span>
              {pad(m)}
              <span className="evc-blink">:</span>
              {pad(s)}
              <span className="ml-1 text-xs font-medium text-slate-300 sm:ml-1.5 sm:text-sm">{h < 12 ? "AM" : "PM"}</span>
            </>
          ) : (
            "--:--:--"
          )}
        </p>
        <p className="mt-1.5 truncate text-xs text-slate-300">{dateLabel}</p>
      </div>
    </div>
  );
}

/* ============================================================
   FAQ
============================================================ */

function FaqSection() {
  const [group, setGroup] = useState(0);
  const [open, setOpen] = useState(0);
  const items = FAQ_GROUPS[group].items;

  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6 md:pb-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">Straight answers.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              What EVC does, what it does not do, and how it handles your
              numbers.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative mt-10 overflow-hidden rounded-3xl bg-[#042653] p-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F2B421]/20 blur-3xl" />
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#F2B421]">
                <CircleHelp className="h-5 w-5" />
              </span>
              <p className="relative mt-4 text-lg font-semibold">Still have a question?</p>
              <p className="relative mt-1.5 text-sm leading-6 text-slate-300">
                Ask about your grant, your team or your clients. You will hear
                back from the founder directly.
              </p>
              <div className="relative mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Link href="/meeting" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-4 text-sm font-semibold text-[#020d1f]">
                  <CalendarDays className="h-4 w-4" />
                  Book a call
                </Link>
                <a href="mailto:sheshank@esopvalueclarity.com" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white">
                  <Mail className="h-4 w-4" />
                  Email us
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1" role="tablist">
            {FAQ_GROUPS.map((g, index) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={group === index}
                onClick={() => {
                  setGroup(index);
                  setOpen(0);
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  group === index ? "bg-white text-[#042653] shadow-sm" : "text-slate-500 hover:text-[#042653]"
                }`}
              >
                {g.label}
                <span className="ml-1.5 text-xs text-slate-400">{g.items.length}</span>
              </button>
            ))}
          </div>

          <div key={group} className="evc-panel mt-4 space-y-3">
            {items.map((item, index) => {
              const isOpen = open === index;
              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-2xl border transition ${
                    isOpen ? "border-[#042653]/20 bg-white shadow-[0_24px_60px_-40px_rgba(4,38,83,0.6)]" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : index)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold transition ${isOpen ? "bg-[#042653] text-[#F2B421]" : "bg-slate-100 text-slate-500"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-semibold">{item.q}</span>
                    <Plus className={`h-4 w-4 shrink-0 text-slate-400 transition duration-300 ${isOpen ? "rotate-45 text-[#042653]" : ""}`} />
                  </button>
                  <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[15px] leading-7 text-slate-600 sm:pl-[4.25rem]">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   CUSTOMER VOICES (rendered only when real quotes exist)
============================================================ */

function CustomerVoices({ reduced }: { reduced: boolean }) {
  const scroll = CUSTOMER_QUOTES.length >= 3 && !reduced;
  const items = scroll ? [...CUSTOMER_QUOTES, ...CUSTOMER_QUOTES] : CUSTOMER_QUOTES;

  return (
    <section className="pb-24 md:pb-32">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <Eyebrow>Customers</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">In their words.</h2>
        </Reveal>
      </div>
      <div className={`mt-12 ${scroll ? "evc-marquee-mask overflow-hidden" : "mx-auto max-w-[1200px] px-4 sm:px-6"}`}>
        <div className={scroll ? "evc-marquee-slow flex w-max gap-5 px-4" : "grid gap-5 md:grid-cols-2"}>
          {items.map((item, index) => (
            <figure key={`${item.name}-${index}`} className={`flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 ${scroll ? "w-[360px] shrink-0" : ""}`}>
              <blockquote className="text-[17px] leading-8 text-[#042653]">“{item.quote}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt={item.name} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {item.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.role}, {item.company}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   THREE ENGINES (numbered, codenamed)
============================================================ */

const ENGINES = [
  {
    no: "01",
    name: "Source",
    codename: "trace",
    icon: FileSearch,
    text: "Reads the grant letter and keeps every number tied to the page it came from.",
    sample: ["Options · 12,500 · p.1", "Strike · ₹18.50 · p.1", "Cliff · 12 months · p.2"],
  },
  {
    no: "02",
    name: "Model",
    codename: "chain",
    icon: Workflow,
    text: "Vesting, exercise, dilution and tax as one chain. Change a link and the rest follows.",
    sample: ["Exit ₹50 Cr → ₹100 Cr", "Dilution 26.1% applied", "Tax recalculated"],
  },
  {
    no: "03",
    name: "Report",
    codename: "plain",
    icon: FileText,
    text: "Ends every analysis in a sentence a non-finance person can repeat at dinner.",
    sample: ["“₹23.1 L on paper…", "…about ₹18.3 L in hand.”", "PDF · CSV · Excel"],
  },
];

function Engines() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6 md:pb-32">
      <Reveal>
        <p className="text-sm font-medium text-slate-500">Getting this right means mastering three things:</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ENGINES.map((engine, index) => (
          <Reveal key={engine.no} delay={index * 110}>
            <TiltCard className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#F2B421]/0 blur-2xl transition duration-500 group-hover:bg-[#F2B421]/20" />
              <div className="relative flex items-start justify-between">
                <span className="text-5xl font-semibold tracking-tight text-slate-200 transition group-hover:text-[#F2B421]">{engine.no}</span>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#042653] text-[#F2B421]">
                  <engine.icon className="h-5 w-5" />
                </span>
              </div>
              <h3 className="relative mt-6 text-2xl font-semibold tracking-[-0.02em]">{engine.name}</h3>
              <p className="relative mt-1 font-mono text-xs text-slate-400">codename: {engine.codename}</p>
              <p className="relative mt-4 text-[15px] leading-7 text-slate-600">{engine.text}</p>
              <div className="relative mt-6 space-y-1.5 rounded-2xl bg-[#F7F9FC] p-4 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200">
                {engine.sample.map((line) => (
                  <p key={line} className="truncate">
                    <span className="mr-2 text-[#B7800E]">›</span>
                    {line}
                  </p>
                ))}
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   DATA FLOW (how grant data moves through EVC)
============================================================ */

const FLOW = [
  {
    icon: Upload,
    title: "Grant letter",
    sub: "Uploaded by holder, HR or advisor",
    detail: "The original document is the starting point. Nothing is typed in from memory.",
    packet: [["file", "grant_letter.pdf"], ["uploaded_by", "holder"], ["status", "received"]],
  },
  {
    icon: ScanLine,
    title: "Extraction",
    sub: "Terms read from the text",
    detail: "Options, strike price, grant and vesting dates, expiry, post-exit window and key clauses are pulled from the document.",
    packet: [["options", "12,500"], ["strike", "₹18.50"], ["source", "page 1"]],
  },
  {
    icon: FileCheck2,
    title: "Confirmation",
    sub: "Every field accepted or corrected",
    detail: "Each extracted value is confirmed against its source before it is allowed into a calculation.",
    packet: [["field", "strike"], ["value", "₹18.50"], ["status", "confirmed"]],
  },
  {
    icon: Cpu,
    title: "Connected model",
    sub: "Vesting · Exercise · Dilution · Tax",
    detail: "Confirmed terms run through one chain, so a change to any assumption flows to every downstream number.",
    packet: [["vested", "6,250"], ["exercise_cost", "₹1,15,625"], ["regime", "new"]],
  },
  {
    icon: Layers3,
    title: "Scenarios",
    sub: "Bear · Base · Bull exits",
    detail: "Three exit valuations side by side, each with exercise cost and estimated tax taken out.",
    packet: [["bear", "₹25 Cr"], ["base", "₹50 Cr"], ["bull", "₹100 Cr"]],
  },
  {
    icon: FileText,
    title: "Outputs",
    sub: "Report · Team view · Advisor console",
    detail: "The same model becomes a one-page report, a team rollout, or a client file for an advisor.",
    packet: [["report", "employee_report.pdf"], ["formats", "PDF, CSV, Excel"], ["status", "ready"]],
  },
];

function DataFlow() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!inView || reduced || paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % FLOW.length), 2200);
    return () => window.clearInterval(id);
  }, [inView, reduced, paused]);

  const node = FLOW[active];

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-[#F7F9FC]">
      <div className="evc-dots pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Reveal>
            <Eyebrow>Under the hood</Eyebrow>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              How your grant data moves through EVC.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Six stages, one direction. Nothing reaches a calculation until a
              person has confirmed it, and every output can be traced back to
              the page it started on.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="mt-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* pipeline */}
          <div className="relative">
            <div className="absolute left-[8%] right-[8%] top-7 hidden h-[2px] bg-slate-200 lg:block">
              <div className="h-full bg-gradient-to-r from-[#042653] to-[#F2B421] transition-all duration-700" style={{ width: `${(active / (FLOW.length - 1)) * 100}%` }} />
              {!reduced && <span className="evc-packet absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#F2B421] shadow-[0_0_0_6px_rgba(242,180,33,0.2)]" />}
            </div>
            <div className="absolute bottom-6 left-7 top-6 w-[2px] bg-slate-200 lg:hidden">
              <div className="w-full bg-gradient-to-b from-[#042653] to-[#F2B421] transition-all duration-700" style={{ height: `${(active / (FLOW.length - 1)) * 100}%` }} />
            </div>

            <ol className="relative grid grid-cols-1 gap-3 lg:grid-cols-6 lg:gap-4">
              {FLOW.map((step, index) => {
                const isActive = index === active;
                const done = index < active;
                return (
                  <li key={step.title}>
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      className="group flex w-full items-center gap-4 text-left lg:flex-col lg:items-center lg:text-center"
                    >
                      <span
                        className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition duration-500 ${
                          isActive
                            ? "scale-110 border-[#F2B421] bg-[#042653] text-[#F2B421] shadow-[0_18px_40px_-14px_rgba(4,38,83,0.7)]"
                            : done
                              ? "border-[#042653]/20 bg-white text-[#042653]"
                              : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"
                        }`}
                      >
                        <step.icon className="h-5 w-5" />
                        {isActive && !reduced && <span className="evc-ring absolute inset-0 rounded-2xl ring-2 ring-[#F2B421]/50" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Stage 0{index + 1}</span>
                        <span className={`mt-0.5 block font-semibold transition ${isActive ? "text-[#042653]" : "text-slate-600"}`}>{step.title}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.sub}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* inspector */}
          <div key={active} className="evc-panel mt-12 grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-60px_rgba(4,38,83,0.6)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="p-7 md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B7800E]">
                Stage 0{active + 1} of 0{FLOW.length}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">{node.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{node.detail}</p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActive((i) => (i - 1 + FLOW.length) % FLOW.length)}
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-slate-300"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i + 1) % FLOW.length)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#042653] px-3 text-xs font-medium text-white"
                >
                  Next stage
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-[#020d1f] p-7 font-mono text-[13px] text-slate-300 md:border-l md:border-t-0 md:p-9">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Data at this stage · sample</p>
              <div className="mt-4 space-y-2">
                <p className="text-slate-500">{"{"}</p>
                {node.packet.map(([k, v], i) => (
                  <p key={k} className="evc-stagger pl-4" style={{ animationDelay: `${i * 120}ms` }}>
                    <span className="text-[#5B9BFF]">&quot;{k}&quot;</span>
                    <span className="text-slate-500">: </span>
                    <span className="text-[#F2B421]">&quot;{v}&quot;</span>
                    {i < node.packet.length - 1 && <span className="text-slate-500">,</span>}
                  </p>
                ))}
                <p className="text-slate-500">{"}"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCTS: what EVC does, in full (answer-first for search
   and AI answer engines: plain sentences, real features only)
============================================================ */

const nfIN = new Intl.NumberFormat("en-IN");

const PRODUCTS: {
  key: string;
  icon: typeof Building2;
  name: string;
  forWho: string;
  price: string;
  summary: string;
  features: string[];
  cta: { label: string; href: string };
  second: { label: string; href: string };
}[] = [
  {
    key: "startups",
    icon: Building2,
    name: "Startup Equity Desk",
    forWho: "For founders and finance teams",
    price: `₹${nfIN.format(STARTUP_PLAN.priceRupees)} / year · ${STARTUP_PLAN.includedOptionHolders} option holders`,
    summary:
      "Runs a startup's ESOP programme end to end: the cap table, the ESOP pool, every grant, exercises through to allotment, the ESOP expense for the accounts and every filing date.",
    features: [
      "Cap table with share classes and an ESOP pool that updates with every grant",
      "Grants with vesting schedules and a private page for each employee, with online Accept",
      "Exercises recorded through allotment, with PAS-3, TDS on the perquisite (including startup deferral) and Form 3921 for US companies tracked",
      "ESOP expense report under Ind AS 102, the ICAI Guidance Note and ASC 718: Black-Scholes or valuer value, graded or straight-line, leaver reversals, journal entry, Excel and PDF",
      "Compliance calendar with email reminders for PAS-3, MGT-14, TDS, leaver windows, option expiries and valuation age",
      "Import your existing Excel cap table and grants",
      "Team logins (owner, admin, view only) and a full change history",
      "Indian or US company: rupees or dollars, Indian or US rules",
    ],
    cta: { label: "See the Startup plan", href: "/pricing#startup" },
    second: { label: "Book a founder walkthrough", href: "/meeting" },
  },
  {
    key: "employees",
    icon: UserRound,
    name: "ESOP calculator and EVC PRO",
    forWho: "For employees holding ESOPs or RSUs",
    price: "Free calculator · PRO from ₹2,999 a month",
    summary:
      "Shows what an ESOP grant is really worth: what has vested, what exercising costs, the tax at exercise and at sale, and what you keep in rupees.",
    features: [
      "Upload the grant letter: every field is read from it and confirmed by you",
      "Vesting and cliff on one timeline, and what lapses if you leave",
      "Exercise cost, perquisite tax and capital gains, old or new regime, with surcharge, marginal relief and cess",
      "Resident, RNOR or NRI: the tax follows your status, with a days-in-India check and the India share of the perquisite for NRIs",
      "Dilution across funding rounds and Bear, Base and Bull exit values",
      "Offer Intelligence: two job offers compared on the same basis",
      "A one-page PDF report",
    ],
    cta: { label: "Model your grant free", href: "/simulator" },
    second: { label: "Compare Free and PRO", href: "/pricing#pro" },
  },
  {
    key: "firms",
    icon: Landmark,
    name: "Advisor Console",
    forWho: "For CA and CS firms",
    price: `₹${nfIN.format(ADVISOR_PLAN.priceRupees)} / year · ${ADVISOR_PLAN.includedClients} client companies`,
    summary:
      "Runs a firm's ESOP practice across clients: company registers and approvals, a diligence report, the employer's perquisite and TDS ledger, and capital gains on foreign RSUs and ESPP for individual clients.",
    features: [
      "Client companies with grant, exercise and cap table registers imported from Excel",
      "Approvals and valuations: special resolution, MGT-14, merchant banker value within 180 days of exercise",
      "ESOP Diligence Pack: checks against the Companies Act and tax rules, a readiness score, PDF and Excel, and passcode-protected client links",
      "Tax-Event Ledger: perquisite and TDS for every exercise, net-pay shortfall, the startup deferral clock, sale and buyback gains, and exports for the 24Q return and Form 16",
      "Foreign Equity Tax Pack: Morgan Stanley (E*TRADE), Schwab or Fidelity exports become lots, converted at SBI TT buying rates, split into STCG and LTCG with Schedule CG date buckets",
      "Schedule FA A3 and A2 for each calendar year, with the peak value checked every trading day; dividends, US tax withheld and the credit for Form 67",
      "One compliance calendar across every client, with email reminders and a Google or Outlook (.ics) export",
      "Team logins and change history for every client",
    ],
    cta: { label: "Book a demo", href: "/meeting" },
    second: { label: "See Advisor pricing", href: "/pricing#advisor" },
  },
];

function ProductsSection() {
  return (
    <section id="products" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
      <Reveal>
        <Eyebrow>What EVC does</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
          Three products. One ESOP system for India.
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          ESOP Value Clarity (EVC) is ESOP software built in India for Indian tax and company law. Startups use it to
          run their cap table, ESOP grants and filings. Employees use it to see what a grant is worth after tax. CA and
          CS firms use it to run ESOP compliance and foreign share taxation for their clients.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {PRODUCTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <Reveal key={p.key} delay={i * 90}>
              <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_40px_90px_-70px_rgba(4,38,83,0.7)]">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#042653] text-[#F2B421]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#B7800E]">{p.forWho}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#020d1f]">{p.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{p.price}</p>
                <p className="mt-4 text-[15px] leading-7 text-slate-700">{p.summary}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#B7800E]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row lg:flex-col xl:flex-row">
                  <Link
                    href={p.cta.href}
                    className="evc-btn-gold group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-5 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
                  >
                    {p.cta.label}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href={p.second.href}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#042653] transition hover:border-[#042653]"
                  >
                    {p.second.label}
                  </Link>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   COMPLIANCE CALENDAR: what it tracks and why it matters
   (penalties stated with their source; "verify" where needed)
============================================================ */

const TRACKED: { group: string; items: { title: string; due: string }[] }[] = [
  {
    group: "Company filings (MCA)",
    items: [
      { title: "PAS-3, return of allotment", due: "30 days after shares are allotted on exercise" },
      { title: "MGT-14 for the ESOP scheme's special resolution", due: "30 days after the resolution" },
    ],
  },
  {
    group: "Employer tax",
    items: [
      { title: "TDS on the ESOP perquisite", due: "7th of the next month (30 April for March)" },
      { title: "Quarterly salary TDS return", due: "31 Jul, 31 Oct, 31 Jan, 31 May" },
      { title: "Form 16 with the perquisite", due: "15 June after the year" },
      { title: "Deferred TDS for eligible startups", due: "14 days after the window ends, a sale or leaving" },
    ],
  },
  {
    group: "ESOP events",
    items: [
      { title: "Leaver's exercise window ends", due: "Leaving date + the scheme's window" },
      { title: "Options expire", due: "Expiry date in the grant" },
      { title: "Valuation too old for exercises", due: "180 days after the valuation date" },
    ],
  },
  {
    group: "Individuals with foreign shares",
    items: [
      { title: "Advance tax instalments", due: "15 Jun, 15 Sep, 15 Dec, 15 Mar" },
      { title: "Income tax return with Schedule FA", due: "31 July (non-audit cases)" },
      { title: "Form 67 for foreign tax credit", due: "With the return" },
    ],
  },
];

const RISKS: { text: string; source: { label: string; href: string } }[] = [
  {
    text: "A late PAS-3 costs the company and each officer in default ₹1,000 a day, up to ₹1 lakh each, plus MCA additional fees of up to 12 times the normal fee.",
    source: { label: "Companies Act s.39(5)", href: "https://www.taxclue.in/tools/pas-3-late-filing-penalty-calculator" },
  },
  {
    text: "A late MGT-14 costs ₹10,000 plus ₹100 a day, up to ₹2 lakh for the company, with separate penalties on officers.",
    source: { label: "Companies Act s.117(2)", href: "https://www.taxscan.in/top-stories/delay-of-215-days-in-filing-board-resolution-in-form-mgt-14-mca-imposes-penalty-1437235" },
  },
  {
    text: "Foreign assets left out of Schedule FA can draw a ₹10 lakh penalty, except where foreign movable assets total up to ₹20 lakh.",
    source: { label: "Black Money Act s.43", href: "https://taxguru.in/?p=925008" },
  },
];

function ComplianceSection() {
  return (
    <section id="compliance-calendar" className="relative overflow-hidden bg-[#020d1f] py-24 text-white md:py-32">
      <div className="evc-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <Reveal>
              <EyebrowDark>Compliance calendar</EyebrowDark>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Every ESOP deadline, one list, reminders before it slips.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                EVC builds the calendar from the records you already keep: allotments, resolutions, valuations, grants,
                exercises and foreign share sales. Nobody types a date twice.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                  One email digest at 30 days, 7 days and 1 day before, and on the due date.
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                  Mark done, or enter the filing date, and the reminders stop. Every mark is logged.
                </li>
                <li className="flex gap-3">
                  <Download className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                  Add every open date to Google or Outlook with one .ics file.
                </li>
                <li className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                  For a startup in the Startup Equity Desk, and across every client in the Advisor Console.
                </li>
              </ul>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2B421]">Why it matters</p>
                <ul className="mt-3 space-y-3">
                  {RISKS.map((r) => (
                    <li key={r.source.label} className="text-sm leading-6 text-slate-300">
                      {r.text}{" "}
                      <a href={r.source.href} target="_blank" rel="noopener" className="whitespace-nowrap text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white">
                        {r.source.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  Amounts as published; confirm the current position with your CS or CA. EVC computes, tracks and
                  reminds; it does not file on the MCA or TRACES portals.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TRACKED.map((g) => (
                <div key={g.group} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{g.group}</p>
                  <ul className="mt-3 space-y-3">
                    {g.items.map((it) => (
                      <li key={it.title}>
                        <p className="text-sm font-semibold text-white">{it.title}</p>
                        <p className="text-xs leading-5 text-slate-400">{it.due}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AUDIENCES WITH WORKFLOWS (tabs)
============================================================ */

const WORKFLOWS: Record<string, { step: string; detail: string }[]> = {
  employees: [
    { step: "Upload your grant letter", detail: "Or enter the numbers for a quick free estimate." },
    { step: "Confirm the fields", detail: "Options, strike, vesting and expiry, checked against the letter." },
    { step: "See today’s position", detail: "Vested options and the cash needed to exercise them." },
    { step: "Test the futures", detail: "Bear, Base and Bull exits, after tax, in both regimes." },
    { step: "Decide with a report", detail: "Exercise, wait, negotiate or walk away, with the numbers in hand." },
  ],
  startups: [
    { step: "Bring in your cap table", detail: "Import it from Excel, or record founders, investors and allotments." },
    { step: "Record your ESOP pool", detail: "Pool size and the dates the board and shareholders approved it." },
    { step: "Grant options", detail: "Draft, check what is flagged, then issue from the pool." },
    { step: "Share each employee’s page", detail: "A private link: vesting, exercise cost, tax and take-home." },
    { step: "Employees accept", detail: "You see who has opened, downloaded and accepted their grant." },
  ],
  hr: [
    { step: "Set up the team workspace", detail: "Invite employees to one shared EVC workspace." },
    { step: "Each grant comes in", detail: "Employees add their own grant letter." },
    { step: "Fields confirmed per grant", detail: "Every report is built from that person’s own terms." },
    { step: "Reports go out", detail: "Each employee gets a clear, one-page view of their equity." },
    { step: "Fewer one-off questions", detail: "Founders and finance stop rebuilding the same answer." },
  ],
  advisors: [
    { step: "Add a client company", detail: "One console for every client you handle." },
    { step: "Bring in the grant register", detail: "Load the client’s grants in one batch." },
    { step: "Run diligence checks", detail: "Surface gaps and inconsistencies across the register." },
    { step: "Track tax events", detail: "Exercises and sales in a tax-event ledger." },
    { step: "Send client-ready reports", detail: "Hand over clear outputs without rebuilding models." },
  ],
};

function Audiences() {
  const [tab, setTab] = useState(0);
  const audience = AUDIENCES[tab];
  const flow = WORKFLOWS[audience.key];

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <Reveal>
          <Eyebrow>Workflows</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            One model. Four ways teams work with it.
          </h2>
        </Reveal>
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1" role="tablist">
          {AUDIENCES.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === index}
              onClick={() => setTab(index)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === index ? "bg-[#042653] text-white shadow-[0_10px_30px_-12px_rgba(4,38,83,0.8)]" : "text-slate-600 hover:text-[#042653]"
              }`}
            >
              <item.icon className={`h-4 w-4 ${tab === index ? "text-[#F2B421]" : ""}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div key={audience.key} className="evc-panel mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-60px_rgba(4,38,83,0.6)]">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="p-8 md:p-12">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#042653] text-[#F2B421]">
              <audience.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold leading-snug tracking-[-0.02em] sm:text-3xl">{audience.title}</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">{audience.text}</p>
            <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {audience.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B7800E]" />
                  {point}
                </li>
              ))}
            </ul>
            <Link href={audience.cta.href} className="evc-btn-gold group mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#F2B421] px-5 text-sm font-semibold text-[#020d1f] transition hover:-translate-y-0.5">
              {audience.cta.label}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="border-t border-slate-200 bg-gradient-to-br from-[#042653] to-[#020d1f] p-8 text-white md:border-l md:border-t-0 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2B421]">The workflow</p>
            <ol className="relative mt-6 space-y-5 border-l border-white/15 pl-7">
              {flow.map((item, i) => (
                <li key={item.step} className="evc-stagger relative" style={{ animationDelay: `${i * 120}ms` }}>
                  <span className="absolute -left-[41px] top-0 grid h-7 w-7 place-items-center rounded-full bg-[#F2B421] text-[11px] font-bold text-[#020d1f] ring-4 ring-[#042653]">
                    {i + 1}
                  </span>
                  <p className="font-semibold">{item.step}</p>
                  <p className="mt-0.5 text-sm leading-6 text-slate-300">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WHY CHOOSE US (comparison)
============================================================ */

type Mark = "yes" | "no" | "partial";

const COMPARE: { row: string; sheet: Mark; calc: Mark; evc: Mark }[] = [
  { row: "Starts from the actual grant letter", sheet: "no", calc: "no", evc: "yes" },
  { row: "Every number traced to its source page", sheet: "no", calc: "no", evc: "yes" },
  { row: "Vesting, exercise, dilution and tax connected", sheet: "partial", calc: "partial", evc: "yes" },
  { row: "Indian tax at exercise and at sale, with surcharge and cess", sheet: "partial", calc: "partial", evc: "yes" },
  { row: "Bear, Base and Bull exits side by side", sheet: "partial", calc: "no", evc: "yes" },
  { row: "One-page report a non-finance person can read", sheet: "no", calc: "no", evc: "yes" },
  { row: "Works for a team or a client book, not one person", sheet: "partial", calc: "no", evc: "yes" },
  { row: "Cap table and ESOP grants kept alongside what each grant is worth", sheet: "partial", calc: "no", evc: "yes" },
];

const WHY = [
  { icon: ReceiptIndianRupee, title: "Built for India", text: "Rupees, lakhs and crores, perquisite tax, old and new regimes. Not a US tool with a currency switch." },
  { icon: FileSearch, title: "Source, not guesswork", text: "Every number starts on a page of the grant letter and stays tied to it." },
  { icon: Zap, title: "Minutes, not a week", text: "A clear answer in one sitting instead of an email chain with HR and a CA." },
  { icon: Users, title: "One model, everyone", text: "The same numbers for the employee, the HR team and the advisor." },
];

function MarkCell({ value, highlight = false }: { value: Mark; highlight?: boolean }) {
  if (value === "yes") {
    return (
      <span className={`mx-auto grid h-7 w-7 place-items-center rounded-full ${highlight ? "bg-[#F2B421] text-[#020d1f]" : "bg-emerald-50 text-emerald-600"}`}>
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === "partial") {
    return <span className="mx-auto block w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Manual</span>;
  }
  return (
    <span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-slate-50 text-slate-300">
      <Minus className="h-4 w-4" />
    </span>
  );
}

function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <Reveal>
            <Eyebrow>Why EVC</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Not another ESOP calculator.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Calculators take your guesses. Spreadsheets take your weekend.
              EVC starts from the document and shows its working.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WHY.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <TiltCard className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                  <item.icon className="h-5 w-5 text-[#B7800E]" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-60px_rgba(4,38,83,0.6)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Capability</th>
                    <th className="w-[110px] px-3 py-5 text-center text-xs font-medium text-slate-500">Spreadsheet</th>
                    <th className="w-[110px] px-3 py-5 text-center text-xs font-medium text-slate-500">Online calculator</th>
                    <th className="w-[120px] bg-[#042653] px-3 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/evc-mark.png" alt="" className="h-4 w-auto rounded-sm bg-white p-[1px]" />
                        EVC
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((r, i) => (
                    <tr key={r.row} className="evc-row border-t border-slate-100" style={{ animationDelay: `${i * 70}ms` }}>
                      <td className="px-5 py-4 font-medium text-[#042653]">{r.row}</td>
                      <td className="px-3 py-4"><MarkCell value={r.sheet} /></td>
                      <td className="px-3 py-4"><MarkCell value={r.calc} /></td>
                      <td className="bg-[#042653]/[0.04] px-3 py-4"><MarkCell value={r.evc} highlight /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
              “Manual” means possible, if you build and maintain it yourself.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   OBJECTIONS (chat-style, witty but true)
============================================================ */

const OBJECTIONS = [
  {
    q: "I’ll just use a spreadsheet.",
    a: "Lovely. Which cell handles surcharge with marginal relief? We’ll wait.",
  },
  {
    q: "My ESOPs are probably worth nothing anyway.",
    a: "Maybe. Then EVC tells you that in rupees, before you pay to exercise them.",
  },
  {
    q: "HR already explained my grant.",
    a: "Great. The report will agree with them. If it doesn’t, you’d want to know now.",
  },
  {
    q: "I’ll figure it out when we IPO.",
    a: "By then the exercise window, the tax year and the decision have been made for you.",
  },
  {
    q: "Isn’t this just a fancy calculator?",
    a: "A calculator runs on your guesses. EVC runs on your grant letter, and shows its working.",
  },
  {
    q: "We already do this for clients in Excel.",
    a: "You do. EVC is for the fifteenth client, when tab five quietly breaks.",
  },
];

function Objections() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <section className="relative overflow-hidden bg-[#020d1f] py-24 text-white md:py-32">
      <div className="evc-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="evc-aurora pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <EyebrowDark>Go on, push back</EyebrowDark>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            We’ve heard every reason not to. <span className="text-slate-400">Here are our answers.</span>
          </h2>
        </Reveal>

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {OBJECTIONS.map((item, i) => (
            <div
              key={item.q}
              className={`flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-700 hover:border-[#F2B421]/30 ${
                inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-[15px] leading-6 text-slate-100">
                {item.q}
              </div>
              <div className="flex items-end gap-2 self-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[#F2B421] px-4 py-3 text-[15px] font-medium leading-6 text-[#020d1f]">
                  {item.a}
                </div>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/evc-mark.png" alt="EVC" className="h-full w-full object-contain" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   "CAN'T WE JUST BUILD THIS WITH AI?"
   Every item below is something EVC's code already does.
   Keep it that way: add an item only after it ships.
============================================================ */

const AI_GROUPS: { icon: typeof Cpu; title: string; items: string[] }[] = [
  {
    icon: Landmark,
    title: "The law moved. Did your prompt?",
    items: [
      "Income-tax Act, 2025 in force from 1 April 2026: ESOP perquisite now s.17(1)(d), salary TDS now s.392",
      "Startup tax deferral: 60 months for allotments from 1 April 2026, 48 months before",
      "Long-term gains on unlisted and foreign shares at 12.5% after 24 months",
      "Surcharge with marginal relief, 4% cess, 87A rebate for residents only",
    ],
  },
  {
    icon: FileSpreadsheet,
    title: "Numbers a chatbot will make up",
    items: [
      "SBI TT buying rate for every transaction date since January 2020",
      "Daily closing prices and stock splits for each foreign share",
      "Rule 115 rate date: last day of the previous month, applied per sale",
    ],
  },
  {
    icon: FileSearch,
    title: "Traps hidden in broker files",
    items: [
      "A $0 cost basis on US broker files is ignored, not taxed as pure gain",
      "ESPP cost taken at market value, not the discounted price",
      "Sales matched to the named lot first, then FIFO; overselling is blocked",
      "Schedule FA peak value worked out day by day, not guessed at year end",
      "Schedule CG date buckets for advance-tax interest",
      "Resident, RNOR and NRI, with the India share of the perquisite for NRIs",
    ],
  },
  {
    icon: Workflow,
    title: "The part nobody prompts for",
    items: [
      "PAS-3, MGT-14, TDS and ITR due dates, with emails 30, 7 and 1 day before",
      "Admin and Viewer logins, and a history of who changed what",
      "Passcode share links, Excel working papers and PDF reports",
    ],
  },
];

const AI_TOTAL = AI_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

function BuildWithAiSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (shown >= AI_TOTAL) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), 140);
    return () => window.clearTimeout(id);
  }, [inView, shown]);

  let counter = 0;

  return (
    <section id="why-not-ai" className="relative overflow-hidden bg-[#020d1f] py-24 text-white md:py-32">
      <div className="evc-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="evc-aurora pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <EyebrowDark>Go on, ask it</EyebrowDark>
          <h2 className="mt-4 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Yes, AI can write this code. <span className="text-[#F2B421]">It can’t be accountable for it.</span>
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Anyone can prompt an ESOP calculator into existence in an afternoon. I use AI to build EVC too. But code was
            never what you were paying for. You pay for someone who knows the rules, keeps them right when the law changes,
            and answers when a number is questioned in front of a client, a board or the tax department.
          </p>
        </Reveal>

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          {/* Left: two tests anyone can run */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F2B421]">Try this right now</p>
              <p className="mt-3 text-[15px] leading-7 text-slate-200">
                Open any chatbot and ask:{" "}
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-white">
                  What was SBI’s TT buying rate for USD on 30 September 2024?
                </span>{" "}
                Ask again tomorrow. Then check SBI’s own published rate.
              </p>
              <p className="mt-3 text-[15px] leading-7 text-slate-300">
                EVC already holds that rate for every day since January 2020, and picks the right date for every vest, sale
                and dividend under Rule 115. A CA filing Schedule FA can’t work from a guess.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F2B421]">1 April 2026</p>
              <p className="mt-3 text-[15px] leading-7 text-slate-200">
                India replaced the Income-tax Act of 1961. The ESOP perquisite moved from section 17(2)(vi) to 17(1)(d).
                Salary TDS moved from section 192 to 392.
              </p>
              <p className="mt-3 text-[15px] leading-7 text-slate-300">
                Every spreadsheet, template and prompt written before that date now quotes the wrong law. Nobody comes back to
                fix the prompt. EVC was updated.
              </p>
            </div>

            <div className="rounded-3xl border border-[#F2B421]/30 bg-[#F2B421]/[0.07] p-6">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-[#F2B421]">70–80%</p>
              <p className="mt-2 text-[15px] leading-7 text-slate-200">
                of what software costs over its life is upkeep: fixes, security and rule changes. AI made the first build
                cheap. It didn’t touch the rest.
              </p>
              <a
                href="https://www.vanta.com/resources/why-cheaper-code-isnt-always-cheap"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Source: Vanta, “Build vs buy” <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right: what EVC already has */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/evc-mark.png" alt="" className="h-5 w-auto rounded-sm bg-white p-[1px]" />
                What your prompt doesn’t know. EVC does.
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-[#F2B421]">
                {Math.min(shown, AI_TOTAL)} / {AI_TOTAL} already built
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {AI_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    <group.icon className="h-4 w-4 text-[#F2B421]" />
                    {group.title}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {group.items.map((item) => {
                      counter += 1;
                      const on = counter <= shown;
                      return (
                        <li
                          key={item}
                          className={`flex items-start gap-2.5 text-sm leading-6 transition duration-500 ${on ? "text-slate-100 opacity-100" : "text-slate-500 opacity-40"}`}
                        >
                          <span
                            className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full transition duration-500 ${on ? "bg-[#F2B421] text-[#020d1f]" : "bg-white/10 text-transparent"}`}
                          >
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">
              A chatbot sounds just as sure when it’s wrong. A penalty notice doesn’t care which model you used. EVC gives
              the same answer every time and shows every step, so the person signing the return can check it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WORTH THE MONEY
   Prices come from the same files as checkout. The hourly cost
   is the visitor's own input; nothing here is a claimed saving.
============================================================ */

type WorthKey = "firm" | "startup" | "employee";
const WORTH_KEYS: WorthKey[] = ["firm", "startup", "employee"];

function WorthItSection() {
  const [plan, setPlan] = useState<WorthKey>("firm");
  const [hourly, setHourly] = useState(1500);

  useEffect(() => {
    const saved = readAudience();
    if (saved) setPlan(AUDIENCE_TO_WORTH[saved]);
    return onAudience((a) => setPlan(AUDIENCE_TO_WORTH[a]));
  }, []);

  const sample = runModel(SAMPLE.totalOptions, 50 * CRORE);

  const plans: Record<
    WorthKey,
    { label: string; price: number; per: string; units: number; unitLabel: string; penalty: string; href: string; cta: string }
  > = {
    firm: {
      label: "CA / CS firm",
      price: ADVISOR_PLAN.priceRupees,
      per: "per client company",
      units: ADVISOR_PLAN.includedClients,
      unitLabel: "client companies",
      penalty: "One late PAS-3 can cost the client and each officer ₹1,000 a day, up to ₹1 lakh each. Schedule FA left out can draw ₹10 lakh.",
      href: "/pricing#advisor",
      cta: "See the Advisor plan",
    },
    startup: {
      label: "Startup",
      price: STARTUP_PLAN.priceRupees,
      per: "per option holder",
      units: STARTUP_PLAN.includedOptionHolders,
      unitLabel: "option holders",
      penalty: "One late PAS-3 alone can cost ₹1,000 a day, up to ₹1 lakh for the company and each officer in default. A late MGT-14 can cost up to ₹2 lakh.",
      href: "/pricing#startup",
      cta: "See the Startup plan",
    },
    employee: {
      label: "Employee",
      price: 24999,
      per: "per year",
      units: 1,
      unitLabel: "your grants",
      penalty: `On our sample grant the estimated tax is ${inrShort(sample.tax)}. A year of PRO is ${((24999 / Math.max(1, sample.tax)) * 100).toFixed(1)}% of that one tax bill, and the free calculator costs nothing.`,
      href: "/pricing#pro",
      cta: "See PRO, or start free",
    },
  };

  const p = plans[plan];
  const perUnit = Math.round(p.price / p.units);
  const breakEvenHours = Math.ceil(p.price / hourly);

  return (
    <section id="worth-it" className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
      <Reveal>
        <Eyebrow>Worth the money?</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
          A whole year of EVC costs less than one mistake.
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          A late PAS-3 can cost up to ₹1 lakh for the company and up to ₹1 lakh for each officer in default. Foreign
          shares left out of Schedule FA can cost ₹10 lakh. The Advisor plan is ₹{nfIN.format(ADVISOR_PLAN.priceRupees)} a
          year for {ADVISOR_PLAN.includedClients} clients. No invented savings here: put in your own hourly cost and see.
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-60px_rgba(4,38,83,0.6)]">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 p-3">
            {WORTH_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPlan(key);
                  setAudience(WORTH_TO_AUDIENCE[key]);
                  trackAudience(WORTH_TO_AUDIENCE[key], "worth_tab");
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  plan === key ? "bg-[#042653] text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-[#042653]"
                }`}
              >
                {plans[key].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Price</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[#042653]">
                ₹{nfIN.format(p.price)}
                <span className="ml-2 text-base font-medium text-slate-500">a year</span>
              </p>
              {p.units > 1 && (
                <p className="mt-2 text-sm text-slate-600">
                  Covers {p.units} {p.unitLabel}: <strong>₹{nfIN.format(perUnit)}</strong> {p.per} a year, about{" "}
                  <strong>₹{nfIN.format(Math.round(perUnit / 12))}</strong> a month.
                </p>
              )}

              <label htmlFor="evc-hourly" className="mt-8 block text-sm font-semibold text-[#042653]">
                What one hour of your team’s time costs you
              </label>
              <div className="mt-3 flex items-center gap-4">
                <input
                  id="evc-hourly"
                  type="range"
                  min={250}
                  max={5000}
                  step={250}
                  value={hourly}
                  onChange={(e) => setHourly(Number(e.target.value))}
                  className="w-full accent-[#042653]"
                />
                <span className="w-24 shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-right font-mono text-sm font-semibold">
                  ₹{nfIN.format(hourly)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Move the slider to your own number. ₹1,500 is only a starting point.</p>
            </div>

            <div className="flex flex-col justify-between gap-6 bg-[#042653] p-6 text-white md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Pays for itself after</p>
                <p className="mt-2 text-6xl font-semibold tracking-[-0.04em] text-[#F2B421]">
                  {breakEvenHours}
                  <span className="ml-2 text-xl font-medium text-white">hours saved in a year</span>
                </p>
                {p.units > 1 && (
                  <p className="mt-3 text-sm text-slate-300">
                    That’s about {(breakEvenHours / p.units).toFixed(1)} hours per {plan === "firm" ? "client" : "option holder"} across
                    the year.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-100">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F2B421]">What’s at stake</p>
                <p className="mt-2">{p.penalty}</p>
              </div>

              <Link
                href={p.href}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F2B421] px-5 py-2.5 text-sm font-semibold text-[#020d1f] transition hover:brightness-110"
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      <p className="mt-4 text-xs text-slate-500">
        Penalties: Companies Act s.39(5) and s.117(2), Black Money Act s.43; see the compliance section above for sources.
        The sample grant is labelled as a sample and run through EVC’s tax engine. Prices before GST, if any.
      </p>
    </section>
  );
}

/* ============================================================
   WHY TRUST A ONE-FOUNDER COMPANY
   Every card is backed by something that exists today.
============================================================ */

function FounderTrustSection() {
  const reasons = [
    {
      icon: BadgeCheck,
      title: `${CUSTOMERS.join(" and ")} pay for it`,
      text: "Two companies already trust one founder with their ESOP data, and pay for it. You wouldn’t be the first. You’d be next.",
    },
    {
      icon: Download,
      title: "If I vanish, you lose nothing",
      text: "Every register, report, tax workbook and change log downloads to Excel today. Your records are never held hostage by EVC.",
    },
    {
      icon: FileSearch,
      title: "Don’t trust me. Check me.",
      text: "Every figure shows its working, the rule behind it and where the data came from. Your CA can verify it without ever speaking to me.",
    },
    {
      icon: Users,
      title: "I can’t afford to lose you",
      text: "A big vendor won’t notice if you leave. I will. That’s why your email gets an answer from the founder, not a ticket number.",
    },
    {
      icon: Zap,
      title: "Fixed in days, not quarters",
      text: "Six releases between 22 and 25 November, listed below. Ask a large vendor how long your feature request will take.",
    },
    {
      icon: LockKeyhole,
      title: "Your data, guarded like mine",
      text: "Hashed passwords, private document storage, Admin and Viewer roles, a log of every change, and a DPDP privacy policy with a named grievance officer: me.",
    },
  ];

  return (
    <section id="why-trust" className="border-y border-slate-200 bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <Reveal>
              <Eyebrow>Who’s behind EVC</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                One founder. No investors. Nowhere to hide.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                EVC is built by one person in Hyderabad. That is a risk, and you should weigh it. Here is the other side:
                no sales team promising what the product can’t do, no investor pushing me to lock you in, and no support
                queue. When something is wrong, the person who wrote the code reads your message and fixes it.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-[17px] leading-8 text-[#042653]">
                  “In August 2026 my internship ended in a round of budget cuts. I didn’t go looking for another job. I
                  went full-time on EVC. Equity is supposed to make people feel like owners, and most of the time it
                  makes them feel confused, while the people behind it rebuild the same answers by hand. Every rupee EVC
                  earns comes from a customer who decided it was worth it. I intend to keep earning that.”
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#042653] text-base font-semibold text-[#F2B421]">
                      S
                    </span>
                    <div>
                      <p className="font-semibold">Sheshank Sidheshwar</p>
                      <p className="text-sm text-slate-500">Founder, ESOP Value Clarity</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://www.linkedin.com/company/esop-value-clarity/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#042653] hover:border-[#042653]"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://www.youtube.com/@esopvalueclarity"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#042653] hover:border-[#042653]"
                    >
                      YouTube
                    </a>
                    <Link
                      href="/meeting"
                      className="rounded-full bg-[#042653] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a3a78]"
                    >
                      Book a call
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reasons.map((item, index) => (
                <Reveal key={item.title} delay={index * 70}>
                  <TiltCard className="h-full rounded-2xl border border-slate-200 bg-white p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF4D6] text-[#B7800E]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>

            <Reveal delay={200}>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <CalendarDays className="h-4 w-4 text-[#B7800E]" />
                  Shipped 22–25 November 2026
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {WHATS_NEW.map((item) => (
                    <span key={item} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-[#042653] ring-1 ring-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                  Udyam-registered sole proprietorship, Hyderabad · Payments through Razorpay ·{" "}
                  <Link href="/privacy" className="font-semibold text-[#042653] hover:underline">
                    How we handle your data
                  </Link>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA (split, by audience)
============================================================ */

function FinalCta() {
  const paths = [
    { icon: UserRound, who: "Employees", text: "See your grant in rupees, free.", cta: "Model your grant", href: "/simulator" },
    { icon: Building2, who: "Startups & founders", text: "Cap table, ESOPs and a page for every employee.", cta: "See the Startup plan", href: "/pricing#startup" },
    { icon: Landmark, who: "CA & advisory firms", text: "Every client’s ESOPs in one console.", cta: "See the Advisor Console", href: "/meeting" },
  ];

  return (
    <section id="get-started" className="px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#020d1f] text-white">
          <div className="evc-aurora pointer-events-none absolute inset-0" />
          <div className="evc-grid pointer-events-none absolute inset-0" />
          <div className="evc-beam pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[800px] -translate-x-1/2" />

          <div className="relative grid grid-cols-1 gap-12 p-8 md:p-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(242,180,33,0.7)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/evc-mark.png" alt="" className="h-full w-full object-contain" />
                </span>
                <span className="text-sm font-medium text-slate-300">ESOP Value Clarity</span>
              </div>
              <h2 className="mt-8 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl">
                Your grant, in rupees, <span className="evc-gold-text">before you decide.</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                Understand today. Decide better. Own tomorrow.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/simulator"
                  className="evc-btn-gold group inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-7 text-[15px] font-semibold text-[#020d1f] transition hover:-translate-y-0.5"
                >
                  Start free
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/meeting"
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-7 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/40"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book a demo
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                {["Free simulator to start", "Indian tax rules built in", "In use at Ather Energy and Revolt Motors"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-[#F2B421]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {paths.map((p, i) => (
                <Link
                  key={p.who}
                  href={p.href}
                  className="evc-stagger group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#F2B421]/40 hover:bg-white/[0.08]"
                  style={{ animationDelay: `${200 + i * 120}ms` }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F2B421]/10 text-[#F2B421] ring-1 ring-[#F2B421]/30">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{p.who}</span>
                    <span className="mt-0.5 block font-semibold">{p.text}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#F2B421] sm:inline-flex">
                    {p.cta}
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#F2B421] sm:hidden" />
                </Link>
              ))}
              <p className="pt-2 text-center text-[11px] leading-5 text-slate-500">
                EVC provides estimates for decision support. It is not tax, legal or investment advice.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
   STICKY CTA (appears after the hero, hides near the end)
============================================================ */

/* ============================================================
   AUDIENCE (shared by the hero tabs, the worth-it tabs and the
   sticky bar). It changes only when the visitor clicks, never on
   scroll. Kept for the browser tab session only.
============================================================ */

type Audience = "employee" | "startup" | "firm";

const AUDIENCE_KEY = "evc-audience";
const AUDIENCE_EVENT = "evc-audience";

const MODE_TO_AUDIENCE: Record<ModeKey, Audience> = { employees: "employee", startups: "startup", firms: "firm" };
const WORTH_TO_AUDIENCE: Record<WorthKey, Audience> = { employee: "employee", startup: "startup", firm: "firm" };
const AUDIENCE_TO_WORTH: Record<Audience, WorthKey> = { employee: "employee", startup: "startup", firm: "firm" };

function isAudience(value: unknown): value is Audience {
  return value === "employee" || value === "startup" || value === "firm";
}

function readAudience(): Audience | null {
  try {
    const v = window.sessionStorage.getItem(AUDIENCE_KEY);
    return isAudience(v) ? v : null;
  } catch {
    return null;
  }
}

function setAudience(audience: Audience) {
  try {
    window.sessionStorage.setItem(AUDIENCE_KEY, audience);
  } catch {
    /* storage blocked: the choice still applies on this page */
  }
  window.dispatchEvent(new CustomEvent<Audience>(AUDIENCE_EVENT, { detail: audience }));
}

function onAudience(handler: (audience: Audience) => void) {
  function listener(event: Event) {
    const detail = (event as CustomEvent<Audience>).detail;
    if (isAudience(detail)) handler(detail);
  }
  window.addEventListener(AUDIENCE_EVENT, listener);
  return () => window.removeEventListener(AUDIENCE_EVENT, listener);
}

/* Google Analytics: which audience is actually visiting. */
function trackAudience(audience: Audience, source: string) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("event", "audience_select", { audience, source });
}

const STICKY: Record<Audience, { line: string; sub: string; cta: string; href: string }> = {
  firm: {
    line: "Foreign RSU tax and ESOP compliance for your clients",
    sub: "",
    cta: "Book a walkthrough",
    href: "/meeting",
  },
  startup: {
    line: "Cap table, ESOPs and PAS-3 deadlines in one place",
    sub: "",
    cta: "See the Startup plan",
    href: "/pricing#startup",
  },
  employee: {
    line: "What’s your grant worth after tax?",
    sub: " Find out free.",
    cta: "Start free",
    href: "/simulator",
  },
};

const CHOOSER: { audience: Audience; label: string; short: string; target: string }[] = [
  { audience: "employee", label: "I’m an employee", short: "Employee", target: "output" },
  { audience: "startup", label: "I run a startup", short: "Startup", target: "startups" },
  { audience: "firm", label: "I’m a CA/CS firm", short: "CA/CS firm", target: "products" },
];

function StickyCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [audience, setAud] = useState<Audience | null>(null);

  useEffect(() => {
    setAud(readAudience());
    return onAudience(setAud);
  }, []);

  useEffect(() => {
    function onScroll() {
      const end = document.getElementById("get-started");
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const nearEnd = end ? end.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(pastHero && !nearEnd);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function choose(item: (typeof CHOOSER)[number]) {
    setAudience(item.audience);
    trackAudience(item.audience, "sticky_bar");
    document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (dismissed) return null;

  const current = audience ? STICKY[audience] : null;

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

        {current ? (
          <>
            <p key={audience} className="evh-swap min-w-0 flex-1 truncate text-sm">
              <span className="font-semibold">{current.line}</span>
              {current.sub && <span className="hidden text-slate-400 sm:inline">{current.sub}</span>}
            </p>
            <button
              type="button"
              onClick={() => setAud(null)}
              className="hidden shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white sm:block"
            >
              Not you?
            </button>
            <Link
              href={current.href}
              onClick={() => audience && trackAudience(audience, "sticky_cta_click")}
              className="evc-btn-gold inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#F2B421] px-4 text-sm font-semibold text-[#020d1f]"
            >
              {current.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <p className="hidden shrink-0 text-sm font-semibold md:block">Which one are you?</p>
            <div className="flex min-w-0 flex-1 gap-1.5">
              {CHOOSER.map((item) => (
                <button
                  key={item.audience}
                  type="button"
                  onClick={() => choose(item)}
                  className="h-10 min-w-0 flex-1 truncate rounded-xl border border-white/15 px-2 text-xs font-semibold text-slate-100 transition hover:border-[#F2B421] hover:bg-[#F2B421] hover:text-[#020d1f] sm:text-sm"
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
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
   SMALL PIECES
============================================================ */

/* ============================================================
   PARTNER PROGRAMME (refer a firm, earn 10% of what they pay)
   - Rate and plan prices must match lib/pricing.ts,
     lib/advisor-pricing.ts and the Team plan price (Rs 1,45,000).
   - Calculator is plain arithmetic: customers x price x rate.
   - Payout is tracked manually until referral codes are built.
============================================================ */

const PARTNER_RATE = 0.1;

type PartnerPlan = {
  key: string;
  group: "pro" | "org";
  label: string;
  price: number;
  cadence: string;
  maxCustomers: number;
};

const PARTNER_PLANS: PartnerPlan[] = [
  { key: "monthly", group: "pro", label: "PRO Monthly", price: 2999, cadence: "per month", maxCustomers: 50 },
  { key: "sixmonth", group: "pro", label: "PRO 6 months", price: 14999, cadence: "one payment", maxCustomers: 50 },
  { key: "annual", group: "pro", label: "PRO Annual", price: 24999, cadence: "per year", maxCustomers: 50 },
  { key: "team", group: "org", label: "Team Intelligence", price: 145000, cadence: "per year · up to 20 members", maxCustomers: 10 },
  { key: "advisor", group: "org", label: "Advisor Console", price: 60000, cadence: "per year · 25 client companies", maxCustomers: 10 },
  { key: "startup", group: "org", label: "Startup plan", price: 14999, cadence: "per year · 25 option holders", maxCustomers: 20 },
];

function planPayout(key: string) {
  const plan = PARTNER_PLANS.find((item) => item.key === key);
  return plan ? plan.price * PARTNER_RATE : 0;
}

const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PARTNER_WHO = [
  {
    icon: Landmark,
    title: "CA and CS firms",
    text: "Their clients ask about ESOPs every filing season. Refer the firm itself to the Advisor Console, or its clients to PRO.",
    planKey: "advisor",
  },
  {
    icon: Building2,
    title: "HR and finance teams",
    text: "Stop answering the same grant and tax questions one email at a time. Refer the company to Team Intelligence.",
    planKey: "team",
  },
  {
    icon: Users,
    title: "Consultants and communities",
    text: "Startup communities, founders’ groups and advisors. Refer founders to the Startup plan, and their people to PRO.",
    planKey: "startup",
  },
];

const PARTNER_STEPS = [
  { n: "01", title: "Apply", text: "Email us who you are and who you work with. We reply with written partner terms." },
  { n: "02", title: "Introduce", text: "Tell your people about EVC. We note your name against every customer you bring." },
  { n: "03", title: "They subscribe", text: "A customer new to EVC buys a plan: PRO, Team Intelligence, the Startup plan or the Advisor Console." },
  { n: "04", title: "You earn 10%", text: "We pay you 10% of the amount they paid, once the payment has cleared." },
];

const PARTNER_TERMS = [
  "10% of the plan amount a referred customer actually pays: PRO, Team Intelligence, the Startup plan or the Advisor Console. Refunded payments do not earn commission.",
  "The customer must be new to EVC. No self-referrals.",
  "Partners tell their audience they are an EVC partner when they recommend it.",
  "Custom or negotiated plans: commission is on the amount actually paid.",
  "Payout timing and any tax on the payout are set out in your written partner terms.",
];

function PartnerPlanButton({
  item,
  active,
  onSelect,
}: {
  item: PartnerPlan;
  active: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(item.key)}
      className={`rounded-xl border px-2 py-3 text-center transition ${
        active
          ? "border-[#F2B421] bg-[#F2B421]/10 text-white"
          : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
      }`}
    >
      <span className="block text-[11px] font-medium leading-4">{item.label}</span>
      <span className="mt-1 block text-sm font-semibold">₹{inrFmt.format(item.price)}</span>
      <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{item.cadence}</span>
    </button>
  );
}

function PartnerProgram() {
  const [planKey, setPlanKey] = useState<string>("annual");
  const [customers, setCustomers] = useState(5);

  const plan = PARTNER_PLANS.find((item) => item.key === planKey) ?? PARTNER_PLANS[2];
  const safeCustomers = Math.min(customers, plan.maxCustomers);
  const perCustomer = plan.price * PARTNER_RATE;
  const total = perCustomer * safeCustomers;
  const animatedTotal = useAnimatedNumber(total, 600);

  function choosePlan(key: string) {
    const next = PARTNER_PLANS.find((item) => item.key === key);
    setPlanKey(key);
    if (next) setCustomers((current) => Math.min(current, next.maxCustomers));
  }

  return (
    <section id="partners" className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6 md:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-[#042653] p-6 text-white sm:p-10 md:p-14">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F2B421]/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#5B9BFF]/15 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
            {/* LEFT: pitch */}
            <div>
              <EyebrowDark>Partner programme</EyebrowDark>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                Know a firm that needs EVC?{" "}
                <span className="evc-gold-text">Earn 10%.</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                If you introduce a person, firm or company to EVC, you get 10%
                of what they pay for their plan: PRO for individuals, Team
                Intelligence for companies, the Startup plan for founders, or
                the Advisor Console for CA, CS and advisory firms. No quota, no joining fee, no lock-in.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {PARTNER_WHO.map((item, index) => (
                  <Reveal key={item.title} delay={index * 80}>
                    <button
                      type="button"
                      onClick={() => choosePlan(item.planKey)}
                      className="h-full w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[#F2B421]/50 hover:bg-white/[0.07]"
                    >
                      <item.icon className="h-5 w-5 text-[#F2B421]" />
                      <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.text}</p>
                      <p className="mt-3 text-xs font-semibold text-[#F2B421]">
                        You earn ₹{inrExact.format(planPayout(item.planKey))}
                      </p>
                    </button>
                  </Reveal>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:sheshank@esopvalueclarity.com?subject=EVC%20partner%20programme&body=Hi%20Sheshank%2C%0A%0AI%20would%20like%20to%20become%20an%20EVC%20partner.%0A%0AName%3A%0AFirm%20%2F%20company%3A%0AWho%20I%20work%20with%3A%0A"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] transition hover:brightness-105"
                >
                  <Mail className="h-4 w-4" />
                  Become a partner
                </a>
                <a
                  href="#contact-form"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ask a question first
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* RIGHT: earnings calculator */}
            <div className="rounded-3xl border border-white/10 bg-[#020d1f]/70 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">What you would earn</p>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Illustration
                </span>
              </div>

              <div role="radiogroup" aria-label="Plan you refer">
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">EVC PRO · individuals</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PARTNER_PLANS.filter((item) => item.group === "pro").map((item) => (
                    <PartnerPlanButton key={item.key} item={item} active={item.key === planKey} onSelect={choosePlan} />
                  ))}
                </div>

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">For organisations · annual</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {PARTNER_PLANS.filter((item) => item.group === "org").map((item) => (
                    <PartnerPlanButton key={item.key} item={item} active={item.key === planKey} onSelect={choosePlan} />
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="partner-customers" className="text-sm text-slate-300">
                    {plan.group === "org" ? "Organisations you introduce" : "Customers you introduce"}
                  </label>
                  <span className="text-2xl font-semibold tabular-nums">{safeCustomers}</span>
                </div>
                <input
                  id="partner-customers"
                  type="range"
                  min={1}
                  max={plan.maxCustomers}
                  step={1}
                  value={safeCustomers}
                  onChange={(event) => setCustomers(Number(event.target.value))}
                  className="mt-3 w-full cursor-pointer accent-[#F2B421]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>1</span>
                  <span>{plan.maxCustomers}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#F2B421]/30 bg-[#F2B421]/[0.07] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">You would receive</p>
                <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-[#F2B421] sm:text-5xl">
                  ₹{inrExact.format(animatedTotal)}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {safeCustomers} × ₹{inrFmt.format(plan.price)} × 10% = ₹{inrExact.format(total)}. That is ₹
                  {inrExact.format(perCustomer)} for each customer who buys {plan.label}.
                </p>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-slate-500">
                Simple arithmetic on our published plan prices, not a promise
                of how many customers you will bring.
              </p>
            </div>
          </div>

          {/* steps */}
          <div className="relative mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_STEPS.map((step, index) => (
              <Reveal key={step.n} delay={index * 90}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="text-xs font-semibold tracking-[0.18em] text-[#F2B421]">{step.n}</span>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* fine print */}
          <div className="relative mt-8 rounded-2xl border border-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">The fine print, up front</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
              {PARTNER_TERMS.map((term) => (
                <li key={term} className="flex gap-2 text-xs leading-5 text-slate-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F2B421]" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function EyebrowDark({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[#F2B421]/30 bg-[#F2B421]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F2B421]">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-6 opacity-0 blur-[2px]"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* Subtle 3D tilt that follows the cursor. */
function TiltCard({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function handleMove(event: ReactMouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-3px)`;
  }

  function handleLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-[#F2B421]/50 hover:shadow-[0_30px_60px_-35px_rgba(4,38,83,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.5);
  const animated = useAnimatedNumber(inView ? value : 0, 1200);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {Math.round(animated)}
      {suffix}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateString}T12:00:00+05:30`));
}

/* ============================================================
   PAGE CSS (keyframes; all motion off under reduced-motion)
============================================================ */

const PAGE_CSS = `
.evc-home .evc-aurora {
  background:
    radial-gradient(40% 50% at 12% 8%, rgba(4,38,83,0.95), transparent 70%),
    radial-gradient(35% 45% at 88% 18%, rgba(242,180,33,0.18), transparent 70%),
    radial-gradient(45% 45% at 55% 100%, rgba(91,155,255,0.22), transparent 70%);
  animation: evcAurora 18s ease-in-out infinite alternate;
}
@keyframes evcAurora {
  0% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(-3%,2%,0) scale(1.06); }
  100% { transform: translate3d(3%,-2%,0) scale(1.02); }
}
.evc-home .evc-beam {
  background: conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(242,180,33,0.16) 50%, transparent 60%);
  filter: blur(30px);
  animation: evcBeam 9s ease-in-out infinite alternate;
}
@keyframes evcBeam { from { opacity: .55; transform: translateX(-52%) rotate(-4deg); } to { opacity: 1; transform: translateX(-48%) rotate(4deg); } }
.evc-home .evc-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 40%, transparent 100%);
}
.evc-home .evc-gold-text {
  background: linear-gradient(90deg, #F2B421, #FCE3A3, #F2B421, #D9950C, #F2B421);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: evcShimmer 7s linear infinite;
}
@keyframes evcShimmer { to { background-position: 300% 0; } }

.evc-home .evc-rise { opacity: 0; animation: evcRise 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes evcRise { from { opacity: 0; transform: translateY(18px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }

.evc-home .evc-pulse { animation: evcPulse 1.8s ease-in-out infinite; }
@keyframes evcPulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(52,211,153,0.6); } 50% { opacity: .7; box-shadow: 0 0 0 5px rgba(52,211,153,0); } }

.evc-home .evc-btn-gold { box-shadow: 0 10px 30px -10px rgba(242,180,33,0.65); }
.evc-home .evc-btn-gold:hover { box-shadow: 0 0 0 4px rgba(242,180,33,0.2), 0 16px 40px -12px rgba(242,180,33,0.85); }

.evc-home .evc-marquee { animation: evcMarquee 45s linear infinite; }
.evc-home .evc-marquee-slow { animation: evcMarquee 70s linear infinite; }
.evc-home .evc-marquee:hover, .evc-home .evc-marquee-slow:hover { animation-play-state: paused; }
@keyframes evcMarquee { to { transform: translateX(-50%); } }
.evc-home .evc-marquee-mask {
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}

.evc-home .evc-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: linear-gradient(90deg, #F2B421 var(--fill), rgba(255,255,255,0.15) var(--fill)); cursor: pointer; }
.evc-home .evc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #fff; box-shadow: 0 0 0 5px rgba(242,180,33,0.35), 0 4px 12px rgba(0,0,0,0.4); transition: transform .15s; }
.evc-home .evc-range::-webkit-slider-thumb:hover { transform: scale(1.12); }
.evc-home .evc-range::-moz-range-thumb { width: 20px; height: 20px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 0 0 5px rgba(242,180,33,0.35); }

.evc-home .evc-spot::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .4s;
  background: radial-gradient(380px circle at var(--x, 50%) var(--y, 50%), rgba(242,180,33,0.12), transparent 45%);
}
.evc-home .evc-spot:hover::before { opacity: 1; }

.evc-home .evc-stagger, .evc-home .evc-fill, .evc-home .evc-scan { animation-play-state: paused; }
.evc-home .evc-play .evc-stagger, .evc-home .evc-play .evc-fill, .evc-home .evc-play .evc-scan,
.evc-home .evc-panel .evc-stagger, .evc-home .evc-panel.evc-stagger { animation-play-state: running; }

.evc-home .evc-stagger { opacity: 0; animation: evcStagger .6s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes evcStagger { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.evc-home .evc-fill { width: 0; animation: evcFill 1.4s cubic-bezier(.2,.7,.2,1) .15s forwards; }
@keyframes evcFill { to { width: var(--to); } }

.evc-home .evc-scan { animation: evcScan 2.4s ease-in-out infinite; }
@keyframes evcScan { 0% { transform: translateY(0); } 50% { transform: translateY(110px); } 100% { transform: translateY(0); } }

.evc-home .evc-panel { animation: evcPanel .5s cubic-bezier(.2,.7,.2,1); }
@keyframes evcPanel { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.evc-home .evc-dots { background-image: radial-gradient(rgba(4,38,83,0.12) 1px, transparent 1px); background-size: 22px 22px; mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%); }
.evc-home .evc-packet { animation: evcPacket 3.2s cubic-bezier(.45,0,.2,1) infinite; }
@keyframes evcPacket { 0% { left: 0%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
.evc-home .evc-ring { animation: evcRing 1.8s ease-out infinite; }
@keyframes evcRing { from { transform: scale(1); opacity: .9; } to { transform: scale(1.45); opacity: 0; } }

.evc-home .evc-blink { animation: evcBlink 1s steps(1) infinite; }
@keyframes evcBlink { 50% { opacity: .35; } }

.evc-home .evc-orbit {
  background: conic-gradient(from 0deg, transparent 0deg, rgba(242,180,33,0.0) 200deg, rgba(242,180,33,0.9) 300deg, #FCE3A3 330deg, transparent 360deg);
  animation: evcOrbit 7s linear infinite;
}
@keyframes evcOrbit { to { transform: rotate(360deg); } }
.evc-home .evc-swap { animation: evcSwap .6s cubic-bezier(.2,.7,.2,1); }
@keyframes evcSwap { from { opacity: 0; transform: scale(1.03); filter: blur(8px); } to { opacity: 1; transform: none; filter: none; } }
.evc-home .evc-eq span { display: block; width: 2px; height: 100%; border-radius: 2px; background: currentColor; transform-origin: bottom; animation: evcEq .9s ease-in-out infinite; }
.evc-home .evc-eq span:nth-child(2) { animation-delay: .2s; }
.evc-home .evc-eq span:nth-child(3) { animation-delay: .4s; }
@keyframes evcEq { 0%,100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }

@media (prefers-reduced-motion: reduce) {
  .evc-home *, .evc-home *::before, .evc-home *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .evc-home .evc-rise, .evc-home .evc-stagger { opacity: 1; }
  .evc-home .evc-fill { width: var(--to); }
}
`;