"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSearch2,
  FileText,
  Fingerprint,
  GitCompareArrows,
  Landmark,
  Layers3,
  CalendarDays,
  Quote,
  LineChart,
  LockKeyhole,
  PieChart,
  Play,
  Video,
  Radar,
  ReceiptIndianRupee,
  ScanLine,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

const INITIAL_CHART = [28, 31, 35, 33, 40, 44, 42, 49, 53, 51, 58, 66];

const productRail = [
  {
    number: "01",
    icon: Calculator,
    title: "Model",
    detail: "Grant → ownership → value",
  },
  {
    number: "02",
    icon: Clock3,
    title: "Vest",
    detail: "Time → vested position",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Dilution",
    detail: "Funding → ownership impact",
  },
  {
    number: "04",
    icon: LineChart,
    title: "Exit",
    detail: "Valuation → scenarios",
  },
  {
    number: "05",
    icon: ReceiptIndianRupee,
    title: "Tax",
    detail: "Estimate → take-home",
  },
  {
    number: "06",
    icon: GitCompareArrows,
    title: "Compare",
    detail: "Scenario → trade-off",
  },
  {
    number: "07",
    icon: FileText,
    title: "Report",
    detail: "Analysis → decision output",
  },
];

const outcomeSteps = [
  {
    number: "01",
    eyebrow: "THE OLD WAY",
    title: "The grant exists, but the decision is scattered.",
    text: "The person has an equity letter, a few numbers, a vesting schedule, a tax concern and too many separate explanations.",
    result: "The information is present, but the consequence of acting is still unclear.",
  },
  {
    number: "02",
    eyebrow: "WITH EVC",
    title: "One confirmed grant becomes one connected model.",
    text: "The same grant flows through vesting, ownership, exercise, dilution, tax, exit scenarios and reports without rebuilding the story each time.",
    result: "The user can see what is known, what is assumed and what the model is saying.",
  },
  {
    number: "03",
    eyebrow: "THE OUTCOME",
    title: "The conversation becomes easier to explain.",
    text: "Instead of only asking what the ESOPs are worth, the person can test what exercising some, all or none could mean under different futures.",
    result: "The next conversation starts with consequences, not confusion.",
  },
];

const decisionQuestions = [
  {
    question: "What did I actually receive?",
    answer: "EVC starts from the real grant or offer terms, then separates the source facts from assumptions so the person can see what is actually known.",
    signal: "Source facts",
    outcome: "The grant stops being just a PDF and becomes a structured starting point.",
  },
  {
    question: "How much is vested today?",
    answer: "The vesting layer turns time into a visible position: vested, unvested, cliff status and what can change as more months pass.",
    signal: "Vesting position",
    outcome: "The person sees what is currently theirs instead of guessing from the total option count.",
  },
  {
    question: "What happens if I leave?",
    answer: "Leaving changes timing, post-termination windows and exercise pressure. EVC keeps those consequences beside the grant instead of leaving them buried in clauses.",
    signal: "Exit timing",
    outcome: "The decision becomes a cash-and-timing question, not just an emotional one.",
  },
  {
    question: "What cash is needed to exercise?",
    answer: "Exercise cost, modeled quantity and estimated tax sit together, so a person can see the money required before committing to a decision.",
    signal: "Cash commitment",
    outcome: "The user can test all, some or none before acting.",
  },
  {
    question: "How could dilution change ownership?",
    answer: "Future funding can be tested as an assumption. The model shows how ownership may move instead of hiding dilution behind cap-table language.",
    signal: "Ownership impact",
    outcome: "The person understands how the stake can change even when the option count stays the same.",
  },
  {
    question: "What tax may appear before liquidity?",
    answer: "EVC makes the estimated tax pressure visible next to exercise and exit scenarios, so paper value does not become the only story.",
    signal: "Tax pressure",
    outcome: "The take-home conversation becomes clearer than the headline value.",
  },
  {
    question: "What could be left after cost and tax?",
    answer: "Bear, Base and Bull views connect gross value, exercise cost, estimated tax and potential take-home in one consequence chain.",
    signal: "Take-home range",
    outcome: "The person sees a range of possibilities rather than one hopeful number.",
  },
  {
    question: "Which assumptions are driving the result?",
    answer: "Important outputs can be read against their source facts, assumptions and scenarios, making the explanation easier to trust and discuss.",
    signal: "Explainability",
    outcome: "A professional can explain why the number moved instead of rebuilding the story manually.",
  },
];

const connectedFlow = [
  {
    title: "Grant",
    detail: "Start with the real equity source.",
    state: "Known",
    outcome: "The grant or offer stops being a static file and becomes the beginning of the model.",
  },
  {
    title: "Confirm",
    detail: "Review what should be trusted.",
    state: "Trusted",
    outcome: "Important fields are checked before they drive the rest of the workflow.",
  },
  {
    title: "Vesting",
    detail: "See what is actually vested.",
    state: "Time",
    outcome: "The person sees what is vested, unvested and how time changes the position.",
  },
  {
    title: "Exercise",
    detail: "Understand cash and timing.",
    state: "Cash",
    outcome: "Exercise cost, timing pressure and modeled quantity become visible before action.",
  },
  {
    title: "Dilution",
    detail: "Model ownership impact.",
    state: "Ownership",
    outcome: "Funding assumptions can show how ownership may change in future rounds.",
  },
  {
    title: "Tax",
    detail: "Estimate take-home pressure.",
    state: "Tax",
    outcome: "Estimated tax sits beside the equity outcome rather than being handled later.",
  },
  {
    title: "Exit",
    detail: "Explore Bear, Base and Bull futures.",
    state: "Scenario",
    outcome: "The user sees a range of possible outcomes, not just a single hopeful number.",
  },
  {
    title: "Report",
    detail: "Turn the work into an explanation.",
    state: "Shareable",
    outcome: "The analysis can become a human-readable output for the person or advisor.",
  },
];

const scatteredWork = [
  ["Grant PDF", "The source exists, but the meaning is trapped in clauses."],
  ["Spreadsheet", "Useful for math, weak for explaining the whole journey."],
  ["Tax notes", "Important numbers sit away from the equity story."],
  ["Advisor call", "Context is explained once, then often lost later."],
  ["Exit guess", "One hopeful number can hide the range of possible outcomes."],
];

const lifecycleMoments = [
  {
    moment: "Grant received",
    headline: "Start with the document.",
    detail: "Upload or enter the grant terms and build the first structured view of what the person actually received.",
  },
  {
    moment: "More vesting",
    headline: "See what changed with time.",
    detail: "Vested and unvested equity can be understood as the person stays, leaves, waits or plans an exercise decision.",
  },
  {
    moment: "Funding round",
    headline: "Test ownership impact.",
    detail: "Future dilution can be modeled as an assumption instead of hidden inside a vague cap-table explanation.",
  },
  {
    moment: "Exercise decision",
    headline: "Know the cash commitment.",
    detail: "Exercise cost, estimated tax and possible outcomes are shown together before the person commits money.",
  },
  {
    moment: "Exit scenario",
    headline: "Move beyond paper value.",
    detail: "Bear, Base and Bull outcomes help explain possible take-home values after cost and estimated tax.",
  },
];

const professionalLoop = [
  {
    title: "Receive",
    detail: "Employee sends grant or offer information.",
    result: "The professional starts with the real source instead of rebuilding context from memory.",
    badge: "Source captured",
  },
  {
    title: "Confirm",
    detail: "Important numbers are reviewed before being trusted.",
    result: "The workflow separates what the document says from what the user wants to model.",
    badge: "Facts checked",
  },
  {
    title: "Model",
    detail: "Vesting, exercise, dilution, tax and exit stay connected.",
    result: "The same equity story moves across assumptions, scenarios and consequences.",
    badge: "Scenario ready",
  },
  {
    title: "Explain",
    detail: "The employee sees what the numbers could mean for them.",
    result: "The conversation changes from ‘what are these ESOPs?’ to ‘what should I consider next?’",
    badge: "Explanation layer",
  },
  {
    title: "Report",
    detail: "The work becomes something reusable and shareable.",
    result: "The professional can preserve the story and repeat the workflow for the next employee.",
    badge: "Reusable output",
  },
];

const testimonials = [
  {
    quote: "Thank you, I will check it out.",
    source: "Early product feedback",
    meta: "Response after reviewing EVC",
  },
  {
    quote: "We are checking this with our team.",
    source: "Professional conversation",
    meta: "Advisory-team style review",
  },
  {
    quote: "This makes the ESOP conversation easier to understand before someone acts.",
    source: "Early conversation theme",
    meta: "Employee-side equity explanation",
  },
  {
    quote: "The useful part is seeing vesting, exercise cost, dilution and exit together instead of separately.",
    source: "Product walkthrough theme",
    meta: "Connected workflow interest",
  },
  {
    quote: "This is different from maintaining the company cap table. It is about what the holder needs to understand.",
    source: "Positioning feedback",
    meta: "Employee-side clarity",
  },
  {
    quote: "The report angle is interesting because the explanation can leave the product.",
    source: "Professional workflow theme",
    meta: "Reusable output interest",
  },
  {
    quote: "The value is not one calculation. It is keeping the grant story connected as assumptions change.",
    source: "Early product read",
    meta: "Scenario-first feedback",
  },
  {
    quote: "Useful when someone asks: what happens if I exercise now, wait, or leave?",
    source: "Decision-support theme",
    meta: "Exercise conversation",
  },
];

type HomepageMeetingSlot = {
  date: string;
  weekday: string;
  start: string;
  end: string;
  label: string;
};

function cleanMeetingLabel(label: string) {
  return label.replace(/\s+IST$/i, "").trim();
}

function formatHomepageDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${dateString}T12:00:00+05:30`));
}

const trustCards = [
  {
    icon: Radar,
    eyebrow: "SCENARIO-FIRST",
    title: "Possibilities, not predictions.",
    description: "Explore a range instead of one shiny number.",
    detail:
      "Startup equity changes with valuation, dilution, vesting, exercise cost, tax and liquidity. ESOP Value Clarity keeps those assumptions visible instead of pretending there is one guaranteed future.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "EXPLAINABLE",
    title: "Assumptions stay visible.",
    description: "Know what moved the result and why.",
    detail:
      "The product is designed around connected inputs and transparent outputs, so you can trace the financial story from grant terms through ownership, scenarios and decision outputs.",
  },
  {
    icon: GitCompareArrows,
    eyebrow: "DECISION SUPPORT",
    title: "Compare the trade-offs.",
    description: "Cash reality stays separate from equity opportunity.",
    detail:
      "PRO analysis and Offer Intelligence help compare scenarios and employment offers without treating speculative equity economics as guaranteed salary.",
  },
];

const intelligenceLayers = [
  {
    number: "01",
    icon: Calculator,
    label: "GRANT",
    title: "Start with what you actually received",
    description:
      "Model option count, strike price, valuation and the core terms that define your starting equity position.",
  },
  {
    number: "02",
    icon: Clock3,
    label: "VESTING",
    title: "Know what is actually yours",
    description:
      "See vested and unvested equity and understand how time changes the position that matters today.",
  },
  {
    number: "03",
    icon: PieChart,
    label: "OWNERSHIP",
    title: "Translate options into ownership",
    description:
      "Move beyond option count and understand the ownership percentage behind the grant.",
  },
  {
    number: "04",
    icon: Layers3,
    label: "DILUTION",
    title: "Stress-test future ownership",
    description:
      "Explore how future funding and changing share counts can affect your effective stake.",
  },
  {
    number: "05",
    icon: BarChart3,
    label: "SCENARIOS",
    title: "Explore different futures",
    description:
      "Compare Bear, Base and Bull outcomes instead of treating one exit valuation as the answer.",
  },
  {
    number: "06",
    icon: Target,
    label: "DECISION",
    title: "Turn the model into a decision",
    description:
      "Bring exercise cost, tax, comparison, reports and saved analyses into one connected workflow.",
  },
];

const faqs = [
  {
    question: "Is ESOP Value Clarity an ESOP valuation service?",
    answer:
      "No. ESOP Value Clarity is an employee-focused decision-support product. It helps you model scenarios and understand how assumptions can affect potential outcomes; it does not provide an official company valuation.",
  },
  {
    question: "Does the product predict what my startup will become?",
    answer:
      "No. The product is built around scenarios over false certainty. You choose or review assumptions and explore what the equity could look like if the future resembles those assumptions.",
  },
  {
    question: "What can I model?",
    answer:
      "The product connects grant size, vesting, ownership, dilution, exercise cost, exit scenarios, estimated tax, comparisons, reports and saved history. PRO adds deeper connected analysis and Offer Intelligence.",
  },
  {
    question: "What is Offer Intelligence?",
    answer:
      "Offer Intelligence is a PRO workflow for reviewing an employment offer and comparing confirmed cash and equity terms side by side. It is designed to keep guaranteed compensation separate from equity opportunity and surface vesting, dilution and exercise-risk differences.",
  },
  {
    question: "Are the results guaranteed?",
    answer:
      "No. Results are educational estimates and decision-support outputs, not financial, tax or legal advice. Actual outcomes depend on future company performance, financing, liquidity, taxes and the terms that ultimately apply.",
  },
  {
    question: "What is the difference between Free and Pro?",
    answer:
      "Free gives employees a useful starting point for understanding equity. PRO provides deeper connected modeling, decision intelligence, saved workspaces and advanced capabilities such as Offer Intelligence.",
  },
];

function createChartData(values: number[]) {
  const width = 600;
  const height = 260;
  const padding = 18;
  const min = Math.min(...values) - 6;
  const max = Math.max(...values) + 8;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y =
      height -
      padding -
      ((value - min) / (max - min)) * (height - padding * 2);

    return { x, y, value };
  });

  const linePath = points
    .map((point, index) =>
      index === 0
        ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

  return {
    points,
    linePath,
    areaPath: `${linePath} L ${width} ${height} L 0 ${height} Z`,
  };
}

function formatIndianCompact(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function HomePage() {
  const [chartValues, setChartValues] = useState(INITIAL_CHART);
  const [seconds, setSeconds] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTrustCard, setActiveTrustCard] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [homepageMeetingSlots, setHomepageMeetingSlots] = useState<HomepageMeetingSlot[]>([]);
  const [homepageMeetingLoading, setHomepageMeetingLoading] = useState(true);
  const [homepageMeetingError, setHomepageMeetingError] = useState(false);
  const [activeReplaceItem, setActiveReplaceItem] = useState(1);
  const [workflowPulseStep, setWorkflowPulseStep] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [activeSpineStep, setActiveSpineStep] = useState(0);
  const [activeProfessionalStep, setActiveProfessionalStep] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const [offerPulse, setOfferPulse] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 42 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1);

      setChartValues((current) => {
        const previousValue = current[current.length - 1];
        const movement = Math.floor(Math.random() * 5) - 1;
        const nextValue = Math.max(previousValue + movement, previousValue - 1);
        return [...current.slice(1), nextValue];
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveLayer((value) => (value + 1) % intelligenceLayers.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const cycleLength = Math.max((productRail.length - 1) * 2, 1);
    const interval = window.setInterval(() => {
      setWorkflowPulseStep((value) => (value + 1) % cycleLength);
    }, 1150);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveQuestion((value) => (value + 1) % decisionQuestions.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveSpineStep((value) => (value + 1) % connectedFlow.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveProfessionalStep((value) => (value + 1) % professionalLoop.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setOfferPulse((value) => (value + 1) % 4);
    }, 1900);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    let cancelled = false;

    async function loadHomepageAvailability() {
      try {
        setHomepageMeetingLoading(true);
        setHomepageMeetingError(false);

        const response = await fetch("/api/meetings/availability?days=21", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Availability request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
          availability?: Array<{
            date: string;
            weekday: string;
            slots: Array<{
              start: string;
              end: string;
              label: string;
            }>;
          }>;
        };

        if (cancelled) return;

        const slots = (data.availability ?? []).flatMap((day) =>
          day.slots.map((slot) => ({
            date: day.date,
            weekday: day.weekday,
            start: slot.start,
            end: slot.end,
            label: slot.label,
          })),
        );

        setHomepageMeetingSlots(slots.slice(0, 3));
      } catch (error) {
        console.error("Homepage meeting availability error", error);
        if (!cancelled) {
          setHomepageMeetingSlots([]);
          setHomepageMeetingError(true);
        }
      } finally {
        if (!cancelled) setHomepageMeetingLoading(false);
      }
    }

    loadHomepageAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  const chart = useMemo(() => createChartData(chartValues), [chartValues]);
  const selectedIndex = hoveredIndex ?? chart.points.length - 1;
  const selectedPoint = chart.points[selectedIndex];
  const selectedValue = (8.75 + selectedPoint.value * 0.07).toFixed(2);
  const selectedGrowth = (
    ((selectedPoint.value / chart.points[0].value - 1) * 100) /
    10
  ).toFixed(2);

  const liveValue = (12.8 + seconds * 0.03).toFixed(2);
  const liveGrowth = (4 + seconds * 0.01).toFixed(2);

  const workflowCycleLength = Math.max((productRail.length - 1) * 2, 1);
  const workflowActiveIndex =
    workflowPulseStep <= productRail.length - 1
      ? workflowPulseStep
      : workflowCycleLength - workflowPulseStep;
  const workflowProgress =
    productRail.length > 1
      ? (workflowActiveIndex / (productRail.length - 1)) * 100
      : 0;
  const workflowActiveItem = productRail[workflowActiveIndex] ?? productRail[0];
  const activeDecisionQuestion = decisionQuestions[activeQuestion] ?? decisionQuestions[0];
  const activeSpineItem = connectedFlow[activeSpineStep] ?? connectedFlow[0];
  const activeProfessionalItem = professionalLoop[activeProfessionalStep] ?? professionalLoop[0];
  const activeFaqItem = faqs[activeFaq] ?? faqs[0];

  const scenarioValues = useMemo(() => {
    const base = 1877000 + seconds * 1800;
    return {
      bear: base * 0.58,
      base,
      bull: base * 1.72,
    };
  }, [seconds]);

  function handleChartMove(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const percentage = Math.min(Math.max(pointerX / bounds.width, 0), 1);
    const index = Math.round(percentage * (chart.points.length - 1));
    setHoveredIndex(index);
  }

  function handleHeroMove(event: MouseEvent<HTMLElement>) {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  return (
    <main className="overflow-hidden bg-[#f7f9fc] text-slate-950">
      {/* =========================================================
          HERO — FINTECH DECISION TERMINAL
      ========================================================= */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMove}
        className="relative overflow-hidden border-b border-slate-200/70 bg-[#f7f9fc]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80 transition-[background] duration-300"
          style={{
            background: `radial-gradient(720px circle at ${cursor.x}% ${cursor.y}%, rgba(37,99,235,0.13), transparent 58%)`,
          }}
        />
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.36]" />
        <div className="pointer-events-none absolute -left-40 top-10 h-[32rem] w-[32rem] rounded-full bg-cyan-200/30 blur-[130px]" />
        <div className="pointer-events-none absolute right-[-12rem] top-[-8rem] h-[40rem] w-[40rem] rounded-full bg-blue-300/25 blur-[150px]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-14 px-6 pb-20 pt-20 md:pb-28 md:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Employee-first equity decision intelligence
            </div>

            <h1 className="mt-8 max-w-3xl text-[3.45rem] font-black leading-[0.96] tracking-[-0.065em] text-[#07111f] sm:text-6xl md:text-7xl lg:text-[5.3rem]">
              Your ESOPs
              <span className="relative mt-2 block text-blue-600">
                finally make sense.
                <span className="absolute -bottom-2 left-0 h-[3px] w-32 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
              </span>
            </h1>

            <p className="mt-9 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Most people receive an ESOP grant and are left figuring things out on their own.

Questions, spreadsheets, calculators, documents, tax discussions and endless searching.

EVC brings everything together, so understanding what comes next feels a lot less overwhelming.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/simulator">
                <Button
                  size="lg"
                  className="group h-13 rounded-xl bg-[#07111f] px-6 text-base font-black text-white shadow-[0_16px_38px_rgba(7,17,31,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Explore your equity
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <a
                href="#intelligence-system"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-6 text-base font-bold text-slate-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                See the decision system
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <HeroProof
                icon={<Radar className="h-4 w-4" />}
                label="Scenario-first"
                value="No false certainty"
              />
              <HeroProof
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Explainable"
                value="Assumptions visible"
              />
              <HeroProof
                icon={<GitCompareArrows className="h-4 w-4" />}
                label="Offer Intelligence"
                value="Cash ≠ equity"
              />
            </div>
          </div>

          {/* Preserve the graph visualisation, upgrade only the surrounding terminal */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-blue-300/30 via-cyan-200/20 to-violet-300/20 blur-3xl" />

            <div className="evc-terminal-float relative rounded-[30px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_38px_100px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-4 px-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                  <Fingerprint className="h-3.5 w-3.5 text-blue-500" />
                  Scenario terminal
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[22px] bg-[#07111f] p-5 text-white md:p-7">
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-40" />
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />

                <div className="relative flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400">Scenario value at exit</p>
                      <span className="flex items-center gap-1 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                        Live model
                      </span>
                    </div>

                    <p className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                      ₹{liveValue}L
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                      <TrendingUp className="h-4 w-4" />
                      {liveGrowth}× modeled multiple
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      Active scenario
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">Expected case</p>
                  </div>
                </div>

                <div className="relative mt-9 h-52 border-b border-l border-white/10 md:h-60">
                  <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-white/10" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/10" />

                  {hoveredIndex !== null && (
                    <div
                      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-2xl backdrop-blur"
                      style={{
                        left: `${(selectedPoint.x / 600) * 100}%`,
                        top: `${(selectedPoint.y / 260) * 100}%`,
                      }}
                    >
                      <p className="text-slate-400">Projected value</p>
                      <p className="mt-1 font-bold text-white">₹{selectedValue}L</p>
                      <p className="mt-1 text-emerald-300">+{selectedGrowth}% growth</p>
                    </div>
                  )}

                  <svg
                    viewBox="0 0 600 260"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full cursor-crosshair overflow-visible"
                    aria-label="Interactive live projected ESOP value chart"
                    onMouseMove={handleChartMove}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient id="liveChartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.42" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>

                      <linearGradient id="liveChartLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#93c5fd" />
                      </linearGradient>
                    </defs>

                    <path d={chart.areaPath} fill="url(#liveChartFill)" />

                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke="url(#liveChartLine)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="5"
                      style={{ transition: "d 700ms ease-in-out" }}
                    />

                    {hoveredIndex !== null && (
                      <>
                        <line
                          x1={selectedPoint.x}
                          x2={selectedPoint.x}
                          y1="0"
                          y2="260"
                          stroke="#93c5fd"
                          strokeDasharray="5 7"
                          strokeOpacity="0.55"
                        />
                        <circle
                          cx={selectedPoint.x}
                          cy={selectedPoint.y}
                          r="9"
                          fill="#dbeafe"
                          stroke="#2563eb"
                          strokeWidth="5"
                        />
                      </>
                    )}

                    {hoveredIndex === null && (
                      <circle
                        cx={chart.points[chart.points.length - 1].x}
                        cy={chart.points[chart.points.length - 1].y}
                        r="8"
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth="5"
                      />
                    )}
                  </svg>

                  <div className="absolute bottom-[-28px] left-0 flex w-full justify-between text-[11px] font-semibold text-slate-500">
                    <span>Grant</span>
                    <span>Today</span>
                    <span>Series A</span>
                    <span>Series B</span>
                    <span>Exit</span>
                  </div>
                </div>

                <div className="relative mt-12 grid grid-cols-3 gap-3">
                  {[
                    ["Vested", "72%", Clock3],
                    ["Dilution", "18.6%", Layers3],
                    ["Ownership", "0.08%", PieChart],
                  ].map(([label, value, Icon]) => {
                    const IconComponent = Icon as typeof Clock3;
                    return (
                      <div
                        key={String(label)}
                        className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:bg-white/[0.08]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                            {String(label)}
                          </p>
                          <IconComponent className="h-3.5 w-3.5 text-blue-300" />
                        </div>
                        <p className="mt-1 text-sm font-bold text-white">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-3 flex items-center justify-between rounded-xl border border-blue-400/15 bg-blue-400/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-300" />
                    <span className="text-[11px] font-semibold text-slate-300">
                      Assumptions synchronized across the scenario
                    </span>
                  </div>
                  <span className="hidden text-[10px] font-black uppercase tracking-[0.12em] text-blue-300 sm:block">
                    Decision layer ready
                  </span>
                </div>
              </div>
            </div>

            <div className="evc-float-card absolute -left-6 top-24 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur xl:block">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                Model state
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-black text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </p>
            </div>

            <div className="evc-float-card evc-float-delay absolute -right-7 bottom-28 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur xl:block">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                Scenario range
              </p>
              <p className="mt-1 text-xs font-black text-slate-950">Bear → Bull</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          DECISION OPERATING LAYER — CORPORATE FLOW
      ========================================================= */}
      <section className="relative z-20 -mt-10 overflow-hidden bg-gradient-to-b from-[#eef4ff] via-[#f8fbff] to-[#07111f] px-6 pb-20 pt-0">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-44 bg-gradient-to-b from-blue-100/70 to-transparent" />
        <div className="mx-auto max-w-[1480px]">
          <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white/92 p-5 shadow-[0_34px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-7">
            <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.22]" />
            <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-blue-200/70 blur-[110px]" />
            <div className="pointer-events-none absolute right-[-8rem] bottom-[-9rem] h-96 w-96 rounded-full bg-cyan-200/50 blur-[130px]" />

            <div className="relative grid gap-8 lg:grid-cols-[0.58fr_1.42fr] lg:items-center">
              <div className="rounded-[30px] border border-slate-200 bg-[#07111f] p-6 text-white shadow-[0_28px_70px_rgba(7,17,31,0.18)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Decision operating layer
                </div>
                <h2 className="mt-6 max-w-xl text-3xl font-black leading-tight tracking-[-0.045em] md:text-4xl">
                  One grant. One chain. No loose calculation islands.
                </h2>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  EVC keeps the same equity story moving from source facts to model assumptions and then to the final decision output. Each step feeds the next one instead of becoming another disconnected tab.
                </p>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  <MiniTerminalMetric label="SOURCE" value="Grant" />
                  <MiniTerminalMetric label="STATE" value="Synced" accent />
                  <MiniTerminalMetric label="OUTPUT" value="Report" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[#f8fbff] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(14,165,233,0.10),transparent_38%)]" />
                <div className="relative mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Connected workflow map</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">The connector sits between cards, so the path reads as one system.</p>
                  </div>
                  <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 shadow-sm sm:block">
                    Grant → Report
                  </span>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-[4.25rem] right-[4.25rem] top-[50px] z-0 hidden lg:block">
                    <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200/90 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-cyan-400 transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${workflowProgress}%` }}
                      />
                    </div>

                    <span
                      className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[left] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ left: `${workflowProgress}%` }}
                      aria-hidden="true"
                    >
                      <span className="absolute h-9 w-9 rounded-full bg-blue-500/20 blur-[2px]" />
                      <span className="evc-workflow-ping absolute h-9 w-9 rounded-full border border-blue-400/50 bg-blue-400/10" />
                      <span className="relative h-3.5 w-3.5 rounded-full bg-blue-600 shadow-[0_0_24px_rgba(37,99,235,0.95)] ring-4 ring-white" />
                    </span>
                  </div>

                  <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                    {productRail.map((item, index) => {
                      const Icon = item.icon;
                      const isKey = index === 0 || index === 3 || index === productRail.length - 1;
                      const isActive = index === workflowActiveIndex;
                      const isPassed = workflowActiveIndex >= index;

                      return (
                        <button
                          key={item.number}
                          type="button"
                          onMouseEnter={() => setWorkflowPulseStep(index)}
                          onFocus={() => setWorkflowPulseStep(index)}
                          onClick={() => setWorkflowPulseStep(index)}
                          className={`group relative z-10 flex min-h-[190px] w-full flex-col justify-between rounded-[24px] border p-4 text-left transition duration-500 hover:-translate-y-1 ${
                            isActive
                              ? "-translate-y-1.5 scale-[1.015] border-blue-500 bg-white shadow-[0_28px_70px_rgba(37,99,235,0.24)] ring-4 ring-blue-100"
                              : isKey
                                ? "border-blue-200 bg-white shadow-[0_18px_46px_rgba(37,99,235,0.13)]"
                                : "border-slate-200 bg-white/78 shadow-sm hover:border-blue-200 hover:bg-white hover:shadow-lg"
                          }`}
                        >
                          <span
                            className={`pointer-events-none absolute inset-0 rounded-[24px] transition duration-500 ${
                              isActive
                                ? "bg-[radial-gradient(circle_at_50%_18%,rgba(37,99,235,0.16),transparent_42%)] opacity-100"
                                : "opacity-0"
                            }`}
                          />

                          <div className="relative">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border transition duration-500 ${
                                  isActive
                                    ? "evc-workflow-arrive border-blue-600 bg-blue-600 text-white shadow-[0_0_34px_rgba(37,99,235,0.55)]"
                                    : isKey || isPassed
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-200 bg-slate-50 text-blue-600"
                                }`}
                              >
                                {isActive && <span className="absolute inset-0 bg-white/20" />}
                                <Icon className="relative h-5 w-5" />
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                                  isActive ? "bg-blue-50 text-blue-700" : "text-blue-600"
                                }`}
                              >
                                {item.number}
                              </span>
                            </div>

                            <p className="mt-5 text-lg font-black tracking-tight text-slate-950">{item.title}</p>
                            <p className="mt-2 text-[11px] leading-5 text-slate-500">{item.detail}</p>
                          </div>

                          <div className="relative mt-5 flex items-center gap-2">
                            <span
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                isActive
                                  ? "w-12 bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.55)]"
                                  : isKey || isPassed
                                    ? "w-10 bg-blue-600"
                                    : "w-6 bg-slate-300 group-hover:w-10 group-hover:bg-blue-600"
                              }`}
                            />
                            <span
                              className={`text-[9px] font-black uppercase tracking-[0.13em] transition ${
                                isActive ? "text-blue-600" : "text-slate-400"
                              }`}
                            >
                              {isActive
                                ? "Live now"
                                : index === 0
                                  ? "Source"
                                  : index === productRail.length - 1
                                    ? "Output"
                                    : "Layer"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
                        {(() => {
                          const ActiveIcon = workflowActiveItem.icon;
                          return <ActiveIcon className="h-[18px] w-[18px]" />;
                        })()}
                      </span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">Live workflow signal</p>
                        <p className="mt-0.5 text-sm font-black text-slate-950">
                          Dot is passing through {workflowActiveItem.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      The same grant story keeps moving until it becomes a decision-ready report.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HUMAN EQUITY PROBLEM
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
        <div className="pointer-events-none absolute -left-36 top-0 h-[34rem] w-[34rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[38rem] w-[38rem] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-14 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              THE HUMAN PROBLEM
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] md:text-6xl">
              ESOPs do not fail because people lack a calculator.
              <span className="block text-blue-300">They fail because the meaning is unclear.</span>
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              A grant letter can say 25,000 options and still leave the person asking the real questions: what is mine today, what can change, what cash is needed and what could actually be left after cost and tax?
            </p>
          </div>

          <div className="relative min-h-[560px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_34px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-7">
            <div className="pointer-events-none absolute -right-20 top-8 h-64 w-64 rounded-full bg-blue-500/15 blur-[90px]" />
            <div className="pointer-events-none absolute left-8 bottom-8 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />

            <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-[26px] border border-blue-300/30 bg-blue-500/15 text-blue-100 shadow-[0_0_60px_rgba(59,130,246,0.25)]">
              <FileText className="h-8 w-8" />
            </div>
            <p className="mt-4 text-center text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              One equity document. Many unanswered decisions.
            </p>

            <div className="relative mt-9 grid gap-3 sm:grid-cols-2">
              {decisionQuestions.map((item, index) => {
                const active = activeQuestion === index;
                return (
                  <button
                    key={item.question}
                    type="button"
                    onMouseEnter={() => setActiveQuestion(index)}
                    onFocus={() => setActiveQuestion(index)}
                    onClick={() => setActiveQuestion(index)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-500 ${
                      active
                        ? "translate-y-[-3px] border-blue-300/50 bg-blue-400/[0.13] shadow-[0_20px_50px_rgba(37,99,235,0.16)]"
                        : "border-white/10 bg-white/[0.055] hover:-translate-y-1 hover:border-blue-300/30 hover:bg-white/[0.08]"
                    }`}
                  >
                    {active && <span className="evc-info-pulse pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-blue-300" />}
                    <span className={`absolute right-3 top-3 text-[10px] font-black ${active ? "text-blue-200" : "text-white/20"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className={`max-w-[14rem] text-sm font-bold leading-6 ${active ? "text-white" : "text-slate-300"}`}>
                      {item.question}
                    </p>
                    <p className={`mt-3 text-[9px] font-black uppercase tracking-[0.14em] ${active ? "text-blue-200" : "text-slate-500"}`}>
                      {item.signal}
                    </p>
                  </button>
                );
              })}
            </div>

            <div key={activeDecisionQuestion.question} className="evc-info-in relative mt-6 overflow-hidden rounded-[26px] border border-blue-300/25 bg-blue-400/[0.10] p-5 shadow-[0_22px_70px_rgba(37,99,235,0.10)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200">
                    Active question
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
                    {activeDecisionQuestion.question}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                    {activeDecisionQuestion.answer}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 lg:w-64">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">What EVC changes</p>
                  <p className="mt-2 text-sm font-black leading-6 text-white">{activeDecisionQuestion.outcome}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PHILOSOPHY / TRUST
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              THE PRODUCT PHILOSOPHY
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.045em] text-[#07111f] md:text-5xl">
              Clarity before certainty.
            </h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Startup equity is inherently uncertain. The useful question is not
            only “what is it worth?” but “what could it mean under different
            futures — and what changes that outcome?”
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {trustCards.map((card, index) => {
            const Icon = card.icon;
            const isActive = activeTrustCard === index;

            return (
              <button
                key={card.title}
                type="button"
                onMouseEnter={() => setActiveTrustCard(index)}
                onFocus={() => setActiveTrustCard(index)}
                onClick={() => setActiveTrustCard(index)}
                className={`group relative min-h-[270px] overflow-hidden rounded-[26px] border p-6 text-left transition duration-500 ${
                  isActive
                    ? "border-blue-500 bg-[#07111f] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
                    : "border-slate-200 bg-white text-slate-950 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
                }`}
              >
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl transition ${
                    isActive ? "bg-blue-500/20" : "bg-blue-100/0"
                  }`}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl border ${
                      isActive
                        ? "border-blue-400/20 bg-blue-400/10 text-blue-300"
                        : "border-blue-100 bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                      isActive ? "text-blue-300" : "text-slate-400"
                    }`}
                  >
                    {card.eyebrow}
                  </span>
                </div>

                <h3 className="relative mt-8 text-2xl font-black tracking-tight">
                  {card.title}
                </h3>

                <p
                  className={`relative mt-4 text-sm leading-7 ${
                    isActive ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {isActive ? card.detail : card.description}
                </p>

                <div
                  className={`relative mt-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] ${
                    isActive ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {isActive ? "Current principle" : "Inspect principle"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          WHAT CHANGES WITH EVC — V2 VISUAL STORY
      ========================================================= */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-[#f7f9fc] py-24 md:py-32">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.32]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-blue-100/70 blur-[120px]" />
        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                WHAT CHANGES WITH EVC
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] text-[#07111f] md:text-6xl">
                From scattered numbers to a decision story.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              EVC does not promise certainty. It makes the chain visible: what the document says, what the user is assuming, what the model calculates and what that means for the person holding the equity.
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {outcomeSteps.map((step, index) => (
              <div
                key={step.number}
                className={`group relative overflow-hidden rounded-[32px] border p-7 transition duration-500 ${
                  index === 1
                    ? "border-blue-300 bg-[#07111f] text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
                    : "border-slate-200 bg-white/85 text-slate-950 shadow-sm hover:-translate-y-1 hover:shadow-xl"
                }`}
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative flex items-start justify-between gap-5">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-black ${index === 1 ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700"}`}>
                    {step.number}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-[0.16em] ${index === 1 ? "text-blue-300" : "text-slate-400"}`}>
                    {step.eyebrow}
                  </span>
                </div>
                <h3 className="relative mt-10 text-3xl font-black leading-tight tracking-[-0.035em]">
                  {step.title}
                </h3>
                <p className={`relative mt-5 min-h-[112px] text-sm leading-7 ${index === 1 ? "text-slate-300" : "text-slate-600"}`}>
                  {step.text}
                </p>
                <div className={`relative mt-7 rounded-2xl border p-4 ${index === 1 ? "border-blue-300/20 bg-blue-300/[0.08]" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${index === 1 ? "text-blue-300" : "text-blue-600"}`}>
                    What changes
                  </p>
                  <p className={`mt-2 text-sm font-bold leading-6 ${index === 1 ? "text-blue-50" : "text-slate-800"}`}>
                    {step.result}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="grid lg:grid-cols-[0.4fr_0.6fr]">
              <div className="relative overflow-hidden border-b border-slate-200 bg-[#07111f] p-7 text-white lg:border-b-0 lg:border-r lg:border-slate-800 md:p-8">
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-[100px]" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                    Grant to report spine
                  </p>
                  <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em] md:text-4xl">
                    Move through the same story, not separate islands.
                  </h3>
                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                    The workflow advances from what is known, to what is assumed, to what is modeled and finally to what can be explained.
                  </p>

                  <div key={activeSpineItem.title} className="evc-info-in mt-8 overflow-hidden rounded-[28px] border border-blue-300/20 bg-blue-400/[0.09] p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-500 text-sm font-black text-white shadow-[0_0_34px_rgba(59,130,246,0.28)]">
                        {String(activeSpineStep + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-200">Currently moving through</p>
                        <h4 className="mt-1 text-2xl font-black text-white">{activeSpineItem.title}</h4>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">{activeSpineItem.outcome}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">State</p>
                        <p className="mt-1 text-sm font-black text-white">{activeSpineItem.state}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">Next movement</p>
                        <p className="mt-1 text-sm font-black text-blue-200">Connected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[#f8fafc] p-6 md:p-8">
                <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.25]" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/80 blur-[110px]" />

                <div className="relative">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Live workflow path
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#07111f]">
                        Document → decision → explanation
                      </h3>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 shadow-sm">
                      Click any stage
                    </span>
                  </div>

                  <div className="relative mt-9">
                    <div className="pointer-events-none absolute left-8 right-8 top-[2.05rem] hidden h-[3px] overflow-hidden rounded-full bg-slate-200 md:block">
                      <span className="evc-flow-line absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      {connectedFlow.map((item, index) => {
                        const active = activeSpineStep === index;
                        const done = index < activeSpineStep;
                        return (
                          <button
                            key={item.title}
                            type="button"
                            onMouseEnter={() => setActiveSpineStep(index)}
                            onFocus={() => setActiveSpineStep(index)}
                            onClick={() => setActiveSpineStep(index)}
                            className={`group relative min-h-[172px] rounded-[24px] border p-4 text-left shadow-sm transition duration-500 ${
                              active
                                ? "-translate-y-2 border-blue-300 bg-white shadow-[0_24px_60px_rgba(37,99,235,0.16)] ring-1 ring-blue-100"
                                : done
                                  ? "border-blue-100 bg-white/95"
                                  : "border-slate-200 bg-white/85 hover:-translate-y-1 hover:border-blue-200 hover:bg-white"
                            }`}
                          >
                            <span className={`relative z-10 grid h-12 w-12 place-items-center rounded-2xl text-xs font-black transition duration-500 ${active ? "evc-workflow-arrive bg-blue-600 text-white" : done ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                              {String(index + 1).padStart(2, "0")}
                              {active && <span className="evc-workflow-ping absolute inset-0 rounded-2xl bg-blue-400/30" />}
                            </span>
                            <div className="mt-6">
                              <p className="text-lg font-black text-slate-950">{item.title}</p>
                              <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
                            </div>
                            <div className={`mt-5 h-1.5 rounded-full ${active ? "bg-blue-600" : done ? "bg-blue-200" : "bg-slate-200"}`} />
                            {active && (
                              <span className="absolute right-4 top-4 rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-blue-700">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div key={activeSpineItem.outcome} className="evc-info-in mt-7 rounded-[26px] border border-blue-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Stage explanation</p>
                        <h4 className="mt-1 text-2xl font-black text-slate-950">{activeSpineItem.title}: {activeSpineItem.state}</h4>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{activeSpineItem.outcome}</p>
                      </div>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#07111f] text-white shadow-[0_16px_36px_rgba(7,17,31,0.16)]">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONNECTED INTELLIGENCE SYSTEM
      ========================================================= */}
      <section
        id="intelligence-system"
        className="relative overflow-hidden border-y border-slate-200 bg-white py-24 md:py-32"
      >
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.28]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-[130px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              CONNECTED EQUITY INTELLIGENCE
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-6xl">
              One financial story.
              <span className="block text-slate-400">Not disconnected calculators.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              The product follows the same equity position from grant terms to
              vesting, ownership, dilution, future scenarios and decision outputs.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="space-y-3">
              {intelligenceLayers.map((layer, index) => {
                const Icon = layer.icon;
                const active = activeLayer === index;

                return (
                  <button
                    key={layer.number}
                    type="button"
                    onMouseEnter={() => setActiveLayer(index)}
                    onFocus={() => setActiveLayer(index)}
                    onClick={() => setActiveLayer(index)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-500 ${
                      active
                        ? "translate-x-2 border-blue-200 bg-blue-50 shadow-lg shadow-blue-100/60"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">
                          {layer.number} · {layer.label}
                        </span>
                        {active && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-black text-slate-950">
                        {layer.title}
                      </p>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 transition ${
                        active ? "translate-x-1 text-blue-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-[30px] border border-slate-200 bg-[#07111f] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] sm:p-8">
              <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-50" />
              <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-blue-500/15 blur-[90px]" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                      LIVE MODEL ROUTING
                    </p>
                    <p className="mt-2 text-xl font-black">
                      Grant → decision intelligence
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Layer {intelligenceLayers[activeLayer].number}/06
                  </span>
                </div>

                <div className="mt-8 rounded-[24px] border border-blue-400/20 bg-blue-400/[0.07] p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_0_34px_rgba(37,99,235,0.35)]">
                      {(() => {
                        const ActiveIcon = intelligenceLayers[activeLayer].icon;
                        return <ActiveIcon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-300">
                        {intelligenceLayers[activeLayer].label} LAYER
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {intelligenceLayers[activeLayer].title}
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                        {intelligenceLayers[activeLayer].description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-7">
                  <div className="absolute left-[21px] top-4 h-[calc(100%-32px)] w-px bg-gradient-to-b from-blue-400/60 via-cyan-400/30 to-transparent" />
                  {[
                    ["Known terms", "Confirmed inputs and current assumptions"],
                    ["Connected model", "Ownership, dilution and economics stay synchronized"],
                    ["Decision output", "Scenario, comparison and report-ready result"],
                  ].map(([title, detail], index) => (
                    <div key={title} className="relative flex gap-4 pb-6 last:pb-0">
                      <div
                        className={`relative z-10 mt-1 h-11 w-11 shrink-0 rounded-full border p-[5px] ${
                          index <= Math.min(activeLayer, 2)
                            ? "border-blue-400/40 bg-blue-400/10"
                            : "border-white/10 bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className={`grid h-full w-full place-items-center rounded-full ${
                            index <= Math.min(activeLayer, 2)
                              ? "bg-blue-500 text-white"
                              : "bg-white/[0.05] text-slate-500"
                          }`}
                        >
                          {index <= Math.min(activeLayer, 2) ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <MiniTerminalMetric label="OWNERSHIP" value="0.08%" />
                  <MiniTerminalMetric label="EXERCISE COST" value="₹2.50L" />
                  <MiniTerminalMetric label="MODEL STATE" value="SYNCED" accent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT EVC REPLACES — INTERACTIVE DARK WORKSPACE
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[36rem] w-[36rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-10rem] bottom-[-12rem] h-[38rem] w-[38rem] rounded-full bg-cyan-500/12 blur-[150px]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-12 px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              WHAT IT REPLACES
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] md:text-6xl">
              Less rebuilding. More explaining.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              The hard part is not multiplying options by a price. The hard part is keeping the document, assumptions, scenario range, cost, tax and final explanation together long enough to make a real decision.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <MiniTerminalMetric label="SOURCE" value="Facts" />
              <MiniTerminalMetric label="MODEL" value="Assumptions" accent />
              <MiniTerminalMetric label="OUTPUT" value="Explanation" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_34px_100px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_88%_80%,rgba(14,165,233,0.12),transparent_34%)]" />
            <div className="relative grid gap-4 lg:grid-cols-[0.92fr_72px_1.08fr] lg:items-stretch">
              <div className="rounded-[30px] border border-white/10 bg-[#0b1422]/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Without EVC</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                    scattered
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {scatteredWork.map(([title, detail], index) => {
                    const active = activeReplaceItem === index;
                    return (
                      <button
                        key={title}
                        type="button"
                        onMouseEnter={() => setActiveReplaceItem(index)}
                        onFocus={() => setActiveReplaceItem(index)}
                        onClick={() => setActiveReplaceItem(index)}
                        className={`group w-full rounded-[22px] border p-4 text-left transition duration-300 ${
                          active
                            ? "border-blue-300/40 bg-blue-500/12 shadow-[0_0_36px_rgba(59,130,246,0.13)]"
                            : "border-white/10 bg-white/[0.045] hover:border-blue-300/25 hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[10px] font-black ${active ? "bg-blue-500 text-white" : "bg-white/[0.07] text-slate-500"}`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-sm font-black text-white">{title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden items-center justify-center lg:flex">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-blue-300/25 bg-blue-500/15 text-blue-200 shadow-[0_0_40px_rgba(37,99,235,0.18)]">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-blue-300/25 bg-gradient-to-br from-blue-600 via-blue-700 to-[#06101f] p-6 shadow-[0_30px_90px_rgba(37,99,235,0.2)]">
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-35" />
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/20 blur-[90px]" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">With EVC</p>
                  <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                    One connected equity workspace.
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-blue-100/80">
                    The selected problem becomes part of the same connected model: confirmed facts stay separate from assumptions, scenario ranges stay visible and the final result can become a report instead of a one-time explanation.
                  </p>

                  <div className="mt-7 rounded-[24px] border border-white/15 bg-white/[0.08] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-100">Selected context</p>
                    <p className="mt-2 text-lg font-black text-white">{scatteredWork[activeReplaceItem][0]}</p>
                    <p className="mt-2 text-sm leading-6 text-blue-100/70">{scatteredWork[activeReplaceItem][1]}</p>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      "Source facts remain separate from assumptions",
                      "Scenario ranges stay visible",
                      "Exercise cost and tax sit beside possible outcomes",
                      "The final story can become a report",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.075] px-4 py-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-cyan-100">
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-black text-white">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SCENARIO RANGE
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
              SCENARIOS OVER FALSE CERTAINTY
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] md:text-5xl">
              Don&apos;t ask for one future.
              <span className="block text-slate-400">Explore the range.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Valuation can move. Dilution can happen. Vesting takes time.
              Exercise cost and taxes matter. Scenario analysis helps you see
              how those moving parts can change the financial picture.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Vesting",
                "Ownership",
                "Dilution",
                "Exercise cost",
                "Exit valuation",
                "Estimated tax",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  MODELED OUTCOME RANGE
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  Bear · Base · Bull
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Scenario engine live
              </div>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              <ScenarioCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="BEAR"
                value={formatIndianCompact(scenarioValues.bear)}
                progress={38}
                caption="Downside case"
              />
              <ScenarioCard
                icon={<LineChart className="h-4 w-4" />}
                label="BASE"
                value={formatIndianCompact(scenarioValues.base)}
                progress={65}
                caption="Expected case"
                active
              />
              <ScenarioCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="BULL"
                value={formatIndianCompact(scenarioValues.bull)}
                progress={91}
                caption="Upside case"
              />
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-950">Why the range moves</p>
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-600">
                  assumptions visible
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <RangeDriver label="Exit valuation" value="Primary driver" />
                <RangeDriver label="Future dilution" value="Ownership impact" />
                <RangeDriver label="Exercise + tax" value="Cash impact" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          EQUITY LIFECYCLE
      ========================================================= */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-[#f8fbff] via-[#eef5ff] to-white py-28 md:py-36">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.24]" />
        <div className="pointer-events-none absolute left-[-10rem] top-20 h-[30rem] w-[30rem] rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-12rem] bottom-[-8rem] h-[34rem] w-[34rem] rounded-full bg-cyan-200/45 blur-[130px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 shadow-sm backdrop-blur">
              <Clock3 className="h-3.5 w-3.5" />
              Equity changes over time
            </div>
            <h2 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.065em] text-[#07111f] md:text-7xl">
              Your understanding should
              <span className="block text-blue-600">move with the grant.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-3xl text-xl leading-9 text-slate-600 md:text-2xl md:leading-10">
              Equity is not a one-day question. Vesting changes, assumptions change,
              funding changes and exercise decisions arrive later. EVC keeps the story
              continuous instead of making you rebuild it from zero.
            </p>
          </div>

          <div className="relative mt-18 rounded-[42px] border border-slate-200 bg-white/90 p-4 shadow-[0_32px_110px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-6">
            <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/70" />
            <div className="relative overflow-hidden rounded-[34px] border border-blue-100/80 bg-[#f8fbff] p-5 md:p-7">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                    CONTINUOUS EQUITY CONTEXT
                  </p>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#07111f] md:text-4xl">
                    The same grant, revisited at every important moment.
                  </h3>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.55)]" />
                  saved story continues
                </div>
              </div>

              <div className="relative mt-7">
                <div className="pointer-events-none absolute left-10 right-10 top-[4.3rem] hidden h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent xl:block" />
                <div className="grid gap-5 lg:grid-cols-5">
                  {lifecycleMoments.map((item, index) => (
                    <div
                      key={item.moment}
                      className="group relative min-h-[330px] overflow-hidden rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_16px_44px_rgba(15,23,42,0.06)] transition duration-500 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,0.14)]"
                    >
                      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-100/0 blur-3xl transition duration-500 group-hover:bg-blue-200/70" />
                      <div className="relative flex items-center justify-between gap-4">
                        <span className="grid h-16 w-16 place-items-center rounded-[22px] border border-blue-100 bg-blue-50 text-lg font-black text-blue-700 shadow-[0_0_0_10px_rgba(37,99,235,0.045)] transition duration-500 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
                          {index + 1}
                        </span>
                        <span className="hidden h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(37,99,235,0.8)] xl:block" />
                      </div>

                      <p className="relative mt-8 text-[12px] font-black uppercase tracking-[0.18em] text-blue-600">
                        {item.moment}
                      </p>
                      <h3 className="relative mt-3 text-2xl font-black leading-tight tracking-[-0.035em] text-slate-950 md:text-[1.75rem]">
                        {item.headline}
                      </h3>
                      <p className="relative mt-5 text-base leading-8 text-slate-600">
                        {item.detail}
                      </p>

                      <div className="relative mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">
                          EVC keeps
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          Context, assumptions and outcomes together
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          OFFER INTELLIGENCE
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
                <FileSearch2 className="h-3.5 w-3.5" />
                PRO · OFFER INTELLIGENCE
              </div>
              <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Compare the offer behind the CTC.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Review employment terms, confirm what was actually offered and
                compare guaranteed cash, equity economics, vesting, dilution
                and exercise risk without pretending they are the same thing.
              </p>
            </div>

            <Link
              href="/pro/offers"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#07111f] transition duration-300 hover:-translate-y-1"
            >
              Explore Offer Intelligence
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_76px_1.12fr_76px_1fr] lg:items-center">
            <OfferCard
              label="OFFER A"
              company="Northstar Technologies"
              fixed="₹24.0L"
              equity="30,000 ESOPs"
              active={offerPulse === 0}
            />

            <EnergyConnector active={offerPulse === 1} />

            <div
              className={`relative overflow-hidden rounded-[28px] border p-6 text-center transition duration-700 ${
                offerPulse === 2
                  ? "border-violet-400/50 bg-violet-500/10 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
                  : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <span className="evc-orbit pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/15" />
              <span className="evc-orbit evc-orbit-delay pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/15" />

              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-[0_0_38px_rgba(139,92,246,0.28)]">
                <Scale className="h-6 w-6" />
              </div>
              <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-300">
                COMPARISON ENGINE
              </p>
              <p className="relative mt-2 text-xl font-black">Offer A vs Offer B</p>
              <p className="relative mt-2 text-[11px] leading-5 text-slate-400">
                Cash · Equity · Vesting · Dilution · Exercise risk
              </p>

              <div className="relative mt-5 grid grid-cols-3 gap-2">
                <OfferMetric label="CASH" value="Tie" />
                <OfferMetric label="EQUITY" value="B ↑" accent />
                <OfferMetric label="SIGNAL" value="B" accent />
              </div>
            </div>

            <EnergyConnector active={offerPulse === 3} />

            <OfferCard
              label="OFFER B"
              company="RocketAI"
              fixed="₹24.0L"
              equity="60,000 ESOPs"
              active={offerPulse === 3}
              accent
            />
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <DarkCapability
              icon={<CircleDollarSign className="h-4 w-4" />}
              title="Cash reality"
              text="Guaranteed, variable and one-time cash remain separate."
            />
            <DarkCapability
              icon={<TrendingUp className="h-4 w-4" />}
              title="Equity reality"
              text="Grant economics are compared without calling them salary."
            />
            <DarkCapability
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Terms & flexibility"
              text="Vesting and exercise windows stay visible in the decision."
            />
            <DarkCapability
              icon={<FileCheck2 className="h-4 w-4" />}
              title="Confirmed inputs"
              text="Important extracted terms are reviewed before comparison."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          FREE → PRO
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24 md:py-32">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  FREE
                </span>
                <WalletCards className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
                Understand the problem first.
              </h3>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                A useful starting point for exploring your equity and seeing how
                assumptions can change the potential outcome.
              </p>
              <div className="mt-7 space-y-3">
                <PlanRow text="Core equity simulation" />
                <PlanRow text="Scenario exploration" />
                <PlanRow text="A clearer starting point than spreadsheets" />
              </div>
              <Link
                href="/simulator"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-black text-slate-950"
              >
                Explore Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-[#07111f] p-7 text-white shadow-[0_28px_80px_rgba(37,99,235,0.2)] sm:p-8">
            <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-35" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-[80px]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-100">
                  PRO
                </span>
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="mt-7 text-3xl font-black tracking-tight">
                More power when the decision gets serious.
              </h3>
              <p className="mt-4 max-w-xl leading-7 text-blue-100/80">
                Deeper connected analysis for vesting, dilution, exercise,
                exit, tax, comparison, reporting and complete-offer decisions.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <PlanRow text="Connected PRO equity workspace" dark />
                <PlanRow text="Exercise Decision Intelligence" dark />
                <PlanRow text="Tax, comparison & reports" dark />
                <PlanRow text="Offer Intelligence" dark />
              </div>
              <Link
                href="/pricing"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:-translate-y-0.5"
              >
                See PRO
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PROFESSIONAL WORKFLOW
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="relative mx-auto grid max-w-[1480px] gap-12 px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">
              FOR REPEATED EQUITY EXPLANATION
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] md:text-6xl">
              Useful for the person holding equity. Powerful for the professional explaining it.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
              A professional does not only need a number. They need a repeatable way to receive a grant, confirm the facts, build scenarios and explain the consequences clearly to another human.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_34px_90px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-7">
            <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-blue-500/15 blur-[100px]" />
            <div className="relative grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                {professionalLoop.map((item, index) => {
                  const active = activeProfessionalStep === index;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onMouseEnter={() => setActiveProfessionalStep(index)}
                      onFocus={() => setActiveProfessionalStep(index)}
                      onClick={() => setActiveProfessionalStep(index)}
                      className={`group flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition duration-500 ${
                        active
                          ? "translate-x-2 border-blue-300/40 bg-blue-400/[0.12] shadow-[0_22px_60px_rgba(37,99,235,0.12)]"
                          : "border-white/10 bg-white/[0.055] hover:bg-white/[0.08]"
                      }`}
                    >
                      <span className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black text-white ${active ? "evc-workflow-arrive bg-blue-500" : "bg-blue-500/80"}`}>
                        {String(index + 1).padStart(2, "0")}
                        {active && <span className="evc-workflow-ping absolute inset-0 rounded-2xl bg-blue-400/30" />}
                      </span>
                      <div>
                        <p className="text-lg font-black text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.detail}</p>
                      </div>
                      <ArrowRight className={`ml-auto hidden h-4 w-4 text-blue-300 transition-transform sm:block ${active ? "translate-x-1" : "group-hover:translate-x-1"}`} />
                    </button>
                  );
                })}
              </div>

              <div key={activeProfessionalItem.title} className="evc-info-in relative overflow-hidden rounded-[28px] border border-blue-300/20 bg-blue-400/[0.09] p-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="relative">
                  <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">
                    {activeProfessionalItem.badge}
                  </span>
                  <h3 className="mt-6 text-3xl font-black tracking-[-0.04em] text-white">
                    {activeProfessionalItem.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {activeProfessionalItem.result}
                  </p>

                  <div className="mt-7 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">What becomes easier</p>
                      <p className="mt-2 text-sm font-black leading-6 text-white">The professional does not need to explain the same equity chain from zero every time.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">Human output</p>
                      <p className="mt-2 text-sm font-black leading-6 text-white">The employee sees the consequence, not just the calculation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-blue-300/20 bg-blue-400/[0.08] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-200">The real loop</p>
              <p className="mt-2 text-lg font-black tracking-tight text-white">
                Explain one employee's equity clearly, then repeat the workflow safely for the next employee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT LAUNCH VIDEO
      ========================================================= */}
      <section id="product-launch-video" className="relative overflow-hidden border-y border-slate-200 bg-[#f5f8fd] py-24 md:py-32">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.22]" />
        <div className="pointer-events-none absolute -right-40 top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-blue-200/60 blur-[140px]" />
        <div className="pointer-events-none absolute left-[-16rem] bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-cyan-200/45 blur-[140px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-blue-600 shadow-sm">
                <Video className="h-3.5 w-3.5" />
                Product launch
              </div>
              <h2 className="mt-6 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#07111f] md:text-6xl">
                See why we built EVC.
                <span className="block text-blue-600">Not another ESOP calculator.</span>
              </h2>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                This is the story behind the product: the gap between receiving equity and actually understanding what it could mean. See the problem EVC is trying to solve and why keeping the whole story together matters.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroProof icon={<FileText className="h-4 w-4" />} label="The problem" value="Equity without context" />
                <HeroProof icon={<GitCompareArrows className="h-4 w-4" />} label="The product" value="One connected story" />
                <HeroProof icon={<ShieldCheck className="h-4 w-4" />} label="The outcome" value="A clearer decision" />
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-3 shadow-[0_34px_100px_rgba(15,23,42,0.12)]">
              <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-gradient-to-br from-blue-100/40 via-transparent to-cyan-100/40" />
              <div className="relative overflow-hidden rounded-[28px] bg-[#07111f]">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#07111f]/85 px-5 py-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-200">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </span>
                    EVC product launch
                  </div>
                </div>
                <div className="aspect-video w-full pt-14">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube-nocookie.com/embed/0g_rMiEd1hA"
                    title="ESOP Value Clarity product launch video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT WALKTHROUGH
      ========================================================= */}
      <section id="product-walkthrough" className="relative overflow-hidden bg-[#07111f] py-24 text-white md:py-32">
        <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
        <div className="pointer-events-none absolute left-[-14rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-blue-600/14 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-12rem] bottom-[-10rem] h-[36rem] w-[36rem] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_34px_100px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                <div className="relative overflow-hidden rounded-[28px] bg-black">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#07111f]/85 px-5 py-4 backdrop-blur-xl">
                    <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-200">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                      EVC walkthrough
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-500">
                      See the product in motion
                    </span>
                  </div>
                  <div className="aspect-video w-full pt-14">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube-nocookie.com/embed/k2LzKS1WkzA?start=1"
                      title="ESOP Value Clarity product walkthrough"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.17em] text-blue-200">
                <Play className="h-3.5 w-3.5 fill-current" />
                Product walkthrough
              </div>
              <h2 className="mt-6 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] md:text-6xl">
                See what happens
                <span className="block text-blue-300">after you start.</span>
              </h2>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                Follow the actual product journey from the starting information through the connected equity story. This is where the idea becomes something you can use.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  ["01", "Start with the real grant or offer", "The actual information becomes the starting point."],
                  ["02", "Follow the same story forward", "The important pieces stay connected instead of being rebuilt."],
                  ["03", "See what the result means", "The final output is something a person can understand and act on."],
                ].map(([number, title, text]) => (
                  <div key={number} className="group rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/30 hover:bg-white/[0.065]">
                    <div className="flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500 text-xs font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.25)]">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-1 text-xs leading-6 text-slate-500">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-[24px] border border-blue-300/15 bg-blue-400/[0.07] p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-200">
                  The point of the walkthrough
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-white">
                  Not to teach you ESOP terminology. To show you how EVC turns a real equity situation into something you can work with.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TESTIMONIALS / EARLY FEEDBACK
      ========================================================= */}
      <section id="testimonials" className="relative overflow-hidden border-y border-slate-200 bg-[#eef4ff] py-24 md:py-32">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.24]" />
        <div className="pointer-events-none absolute left-1/4 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-blue-200/80 blur-[150px]" />
        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">
                EARLY SIGNALS
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.055em] text-[#07111f] md:text-6xl">
                Built for serious equity conversations, not casual curiosity.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              Early feedback is shown carefully: real conversation themes, no fake customer logos, no inflated case studies and no invented revenue claims. The cards stay dark so the section still feels premium on a lighter background.
            </p>
          </div>
        </div>

        <div className="mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="evc-testimonial-track flex w-max gap-5 px-6 md:px-10">
            {[...testimonials, ...testimonials].map((item, index) => (
              <article
                key={`${item.source}-${index}`}
                className="group relative w-[340px] shrink-0 overflow-hidden rounded-[30px] border border-slate-800 bg-[#07111f] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] transition duration-500 hover:-translate-y-1 hover:border-blue-400/40 md:w-[430px]"
              >
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-35" />
                <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl transition group-hover:bg-blue-400/25" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-300/20 bg-blue-300/10 text-blue-200">
                    <Quote className="h-4 w-4" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Early / real context
                  </span>
                </div>
                <p className="relative mt-8 min-h-[112px] text-xl font-black leading-8 tracking-[-0.02em] text-white">
                  “{item.quote}”
                </p>
                <div className="relative mt-8 border-t border-white/10 pt-5">
                  <p className="text-sm font-black text-blue-100">{item.source}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          IN-SITE MEETING SCHEDULER — LIVE HOMEPAGE GATEWAY
      ========================================================= */}
      <section id="schedule" className="relative overflow-hidden bg-white px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_54%,#eef4ff_100%)]" />
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.18]" />
        <div className="pointer-events-none absolute right-[-10rem] top-10 h-[34rem] w-[34rem] rounded-full bg-blue-200/60 blur-[140px]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
              Schedule through the site
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.055em] text-[#07111f] md:text-6xl">
              See the workflow before you pay.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Pick a real product conversation time directly from EVC. We check the live calendar first, then take you into the full booking flow where you can choose another date, time and add your details.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroProof icon={<FileText className="h-4 w-4" />} label="What you see" value="Actual workflow" />
              <HeroProof icon={<CalendarDays className="h-4 w-4" />} label="Availability" value="Live calendar" />
              <HeroProof icon={<ShieldCheck className="h-4 w-4" />} label="No pressure" value="Decide after clarity" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[38px] border border-slate-200 bg-white p-3 shadow-[0_34px_100px_rgba(15,23,42,0.12)]">
            <div className="grid overflow-hidden rounded-[30px] lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative bg-[#07111f] p-6 text-white md:p-8">
                <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
                <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[100px]" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Product conversation</p>
                  <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">A focused 20-minute walkthrough.</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    See the real product, talk through your situation and decide whether PRO makes sense for you. The booking itself happens inside EVC.
                  </p>

                  <div className="mt-8 space-y-3">
                    {[
                      ["01", "See the actual EVC workflow"],
                      ["02", "Talk through your real use case"],
                      ["03", "Decide whether PRO is useful"],
                    ].map(([number, text]) => (
                      <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500 text-xs font-black text-white">{number}</span>
                        <span className="text-sm font-black text-white">{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[22px] border border-blue-300/15 bg-blue-400/[0.07] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">
                      Your time is checked again when you book
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      The homepage is only the entry point. The final booking page checks the live EVC calendar again before creating the meeting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative bg-white p-6 md:p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-100 blur-[100px]" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Live availability</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Book from the site</h3>
                    </div>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#07111f] text-white shadow-[0_16px_36px_rgba(7,17,31,0.18)]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-7 rounded-[26px] border border-blue-100 bg-[#f7faff] p-5">
                    {homepageMeetingLoading ? (
                      <div className="animate-pulse">
                        <div className="h-3 w-28 rounded bg-slate-200" />
                        <div className="mt-3 h-8 w-56 rounded bg-slate-200" />
                        <div className="mt-3 h-4 w-40 rounded bg-slate-200" />
                      </div>
                    ) : homepageMeetingSlots.length > 0 ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Next available conversation</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                          {formatHomepageDate(homepageMeetingSlots[0].date)}
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-sm">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Available time</p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {cleanMeetingLabel(homepageMeetingSlots[0].label)} IST
                            </p>
                          </div>
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </span>
                        </div>

                        {homepageMeetingSlots.length > 1 && (
                          <div className="mt-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Other nearby times</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {homepageMeetingSlots.slice(1).map((slot) => (
                                <span
                                  key={`${slot.start}-${slot.end}`}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                                >
                                  {cleanMeetingLabel(slot.label)} IST
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {homepageMeetingError ? "Availability check" : "Live availability"}
                        </p>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          {homepageMeetingError
                            ? "Open the scheduler to check current times."
                            : "No open time was returned yet."}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          The full scheduler can check further dates directly against the EVC calendar.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <MiniBookingMetric label="LENGTH" value="20 min" />
                    <MiniBookingMetric label="SOURCE" value="Live" />
                    <MiniBookingMetric label="INVITE" value="Calendar" />
                  </div>

                  <Link
                    href="/meeting"
                    className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07111f] px-6 text-sm font-black text-white shadow-[0_18px_40px_rgba(7,17,31,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-900"
                  >
                    Open live booking
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
                    Choose another date and time on the full booking page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRODUCT FAQ — LIGHT FINTECH KNOWLEDGE PANEL
      ========================================================= */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-[#f4f8ff] py-24 md:py-32">
        <div className="evc-grid pointer-events-none absolute inset-0 opacity-[0.20]" />
        <div className="pointer-events-none absolute left-[-12rem] top-10 h-[34rem] w-[34rem] rounded-full bg-blue-200/45 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-[-12rem] right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-cyan-200/40 blur-[140px]" />

        <div className="relative mx-auto max-w-[1480px] px-6">
          <div className="grid gap-10 lg:grid-cols-[0.70fr_1.30fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600 shadow-sm">
                <FileText className="h-3.5 w-3.5" />
                Product clarity
              </span>

              <h2 className="mt-5 max-w-xl text-4xl font-black tracking-[-0.055em] text-[#07111f] md:text-6xl">
                Questions should feel answered,
                <span className="block text-slate-400">not buried.</span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                EVC is built for serious equity decisions, so the common questions
                should be clear before someone starts using PRO or books a product conversation.
              </p>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#07111f] text-white shadow-[0_18px_40px_rgba(7,17,31,0.18)]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">Need a personal answer?</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      For grant-specific, offer-specific or purchase questions, go to the contact section and send the context directly.
                    </p>
                    <a
                      href="#contact-form"
                      className="group mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Go to contact form
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_28px_90px_rgba(15,23,42,0.10)] sm:p-5 lg:p-6">
              <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/70 blur-[90px]" />
              <div className="pointer-events-none absolute bottom-[-7rem] left-[-5rem] h-72 w-72 rounded-full bg-cyan-100/80 blur-[90px]" />

              <div className="relative grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-3">
                  {faqs.map((faq, index) => {
                    const active = activeFaq === index;
                    return (
                      <button
                        key={faq.question}
                        type="button"
                        onMouseEnter={() => setActiveFaq(index)}
                        onFocus={() => setActiveFaq(index)}
                        onClick={() => setActiveFaq(index)}
                        className={`group flex w-full items-center gap-4 rounded-[22px] border p-4 text-left transition duration-500 ${
                          active
                            ? "translate-x-1 border-blue-200 bg-blue-50 shadow-[0_18px_45px_rgba(37,99,235,0.14)]"
                            : "border-slate-200 bg-[#f8fafc] hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-lg"
                        }`}
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[11px] font-black transition ${
                            active
                              ? "bg-blue-600 text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)]"
                              : "bg-white text-slate-400 shadow-sm"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                            {index === 0
                              ? "Valuation boundary"
                              : index === 1
                                ? "Scenario truth"
                                : index === 2
                                  ? "Product scope"
                                  : index === 3
                                    ? "Offer workflow"
                                    : index === 4
                                      ? "Result limits"
                                      : "Plan clarity"}
                          </span>
                          <span className="mt-1 block text-sm font-black leading-5 text-slate-950">
                            {faq.question}
                          </span>
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition ${
                            active ? "translate-x-1 text-blue-600" : "text-slate-300 group-hover:text-blue-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[#07111f] p-6 text-white shadow-[0_28px_80px_rgba(7,17,31,0.18)] md:p-8">
                  <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
                  <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-[90px]" />
                  <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[90px]" />

                  <div className="relative flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-200">
                      Live answer panel
                    </span>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-blue-200">
                      <FileSearch2 className="h-5 w-5" />
                    </span>
                  </div>

                  <div key={activeFaqItem.question} className="evc-info-in relative mt-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                      Selected question
                    </p>
                    <h3 className="mt-3 text-3xl font-black tracking-[-0.035em] md:text-4xl">
                      {activeFaqItem.question}
                    </h3>
                    <p className="mt-5 text-base leading-8 text-slate-300">
                      {activeFaqItem.answer}
                    </p>
                  </div>

                  <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">Known</p>
                      <p className="mt-1 text-sm font-black text-white">Facts</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">Tested</p>
                      <p className="mt-1 text-sm font-black text-white">Scenarios</p>
                    </div>
                    <div className="rounded-2xl border border-blue-300/20 bg-blue-400/[0.10] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-300">Explained</p>
                      <p className="mt-1 text-sm font-black text-white">Decision</p>
                    </div>
                  </div>

                  <a
                    href="#contact-form"
                    className="group relative mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#07111f] transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Ask a personalized question
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="mx-auto max-w-[1480px] px-6 py-24">
        <div className="relative overflow-hidden rounded-[34px] bg-[#07111f] px-6 py-16 text-white shadow-[0_30px_90px_rgba(7,17,31,0.2)] md:px-12 md:py-20">
          <div className="evc-dark-grid pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                EQUITY DECISION SUPPORT FOR EMPLOYEES
              </p>
              <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Don&apos;t just know how many ESOPs you have.
                <span className="block text-blue-300">
                  Understand what they could actually mean.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Start with the equity model. Explore the possibilities. Upgrade
                when you need deeper decision intelligence.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/simulator">
                <Button
                  size="lg"
                  className="group h-12 w-full rounded-xl bg-white px-6 font-black text-[#07111f] hover:bg-blue-50"
                >
                  Explore the simulator
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-6 text-sm font-black text-white transition hover:bg-white/[0.09]"
              >
                Compare Free & PRO
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div id="contact-form">
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes evcFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes evcFloatCard {
          0%,
          100% {
            transform: translateY(0px) rotate(-1deg);
          }
          50% {
            transform: translateY(-10px) rotate(1deg);
          }
        }

        @keyframes evcEnergy {
          0% {
            transform: translateX(-24px);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(68px);
            opacity: 0;
          }
        }

        @keyframes evcOrbit {
          0% {
            transform: translate(-50%, -50%) scale(0.82) rotate(0deg);
            opacity: 0.25;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
            opacity: 0.08;
          }
        }

        @keyframes evcScan {
          0% {
            transform: translateY(-16px);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(110px);
            opacity: 0;
          }
        }

        @keyframes evcWorkflowPing {
          0% {
            transform: scale(0.72);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.45);
            opacity: 0;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }

        @keyframes evcWorkflowArrive {
          0%,
          100% {
            box-shadow: 0 0 34px rgba(37, 99, 235, 0.55), 0 0 0 0 rgba(37, 99, 235, 0.24);
          }
          50% {
            box-shadow: 0 0 44px rgba(37, 99, 235, 0.68), 0 0 0 10px rgba(37, 99, 235, 0);
          }
        }

        @keyframes evcInfoIn {
          from {
            transform: translateY(10px) scale(0.985);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes evcInfoPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.9);
            opacity: 0.15;
          }
        }

        @keyframes evcFlowLine {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(240%);
          }
        }

        .evc-info-in {
          animation: evcInfoIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .evc-info-pulse {
          animation: evcInfoPulse 1.35s ease-in-out infinite;
        }

        .evc-flow-line {
          animation: evcFlowLine 3.4s ease-in-out infinite;
          will-change: transform;
        }

        .evc-workflow-ping {
          animation: evcWorkflowPing 1.15s ease-out infinite;
        }

        .evc-workflow-arrive {
          animation: evcWorkflowArrive 1.15s ease-out infinite;
        }

        .evc-grid {
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, black, transparent 92%);
        }

        .evc-dark-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .evc-terminal-float {
          animation: evcFloat 7s ease-in-out infinite;
        }

        .evc-float-card {
          animation: evcFloatCard 5.5s ease-in-out infinite;
        }

        .evc-float-delay {
          animation-delay: -2.3s;
        }

        .evc-energy {
          animation: evcEnergy 1.8s linear infinite;
        }

        .evc-orbit {
          animation: evcOrbit 3.2s ease-in-out infinite alternate;
        }

        .evc-orbit-delay {
          animation-delay: -1.4s;
        }

        .evc-scan-line {
          animation: evcScan 2.4s ease-in-out infinite;
        }
        .evc-testimonial-track {
          animation: evcTestimonials 48s linear infinite;
          will-change: transform;
        }

        @keyframes evcTestimonials {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }


        html {
          scroll-behavior: smooth;
        }


        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .evc-terminal-float,
          .evc-float-card,
          .evc-energy,
          .evc-orbit,
          .evc-scan-line,
          .evc-testimonial-track,
          .evc-workflow-ping,
          .evc-workflow-arrive,
          .evc-info-in,
          .evc-info-pulse,
          .evc-flow-line {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function MiniBookingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-black text-slate-950">{value}</p>
    </div>
  );
}

function HeroProof({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-2 text-blue-600">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xs font-black text-slate-950">{value}</p>
    </div>
  );
}

function MiniTerminalMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-emerald-400/15 bg-emerald-400/[0.07]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xs font-black ${accent ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function ScenarioCard({
  icon,
  label,
  value,
  progress,
  caption,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress: number;
  caption: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group rounded-[22px] border p-5 transition duration-500 hover:-translate-y-1 ${
        active
          ? "border-blue-200 bg-blue-50 shadow-lg shadow-blue-100/60"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            active ? "bg-blue-600 text-white" : "bg-white text-slate-500 shadow-sm"
          }`}
        >
          {icon}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-6 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{caption}</p>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            active ? "bg-blue-600" : "bg-slate-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RangeDriver({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-slate-950">{value}</p>
    </div>
  );
}

function OfferCard({
  label,
  company,
  fixed,
  equity,
  active,
  accent = false,
}: {
  label: string;
  company: string;
  fixed: string;
  equity: string;
  active: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border p-5 transition duration-700 ${
        active
          ? accent
            ? "border-violet-400/50 bg-violet-500/10 shadow-[0_0_55px_rgba(139,92,246,0.13)]"
            : "border-blue-400/40 bg-blue-500/[0.08] shadow-[0_0_55px_rgba(59,130,246,0.12)]"
          : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="evc-scan-line pointer-events-none absolute left-4 right-4 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
            accent ? "bg-violet-500 text-white" : "bg-white text-[#07111f]"
          }`}
        >
          {label}
        </span>
        <FileCheck2 className={`h-4 w-4 ${active ? "text-emerald-300" : "text-slate-600"}`} />
      </div>
      <h3 className="mt-6 text-xl font-black">{company}</h3>
      <p className="mt-1 text-[11px] text-slate-500">Senior Software Engineer</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <OfferMetric label="FIXED" value={fixed} />
        <OfferMetric label="EQUITY" value={equity} accent={accent} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.11em] text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Confirmed terms
      </div>
    </div>
  );
}

function OfferMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xs font-black ${accent ? "text-violet-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EnergyConnector({ active }: { active: boolean }) {
  return (
    <div className="relative hidden h-14 overflow-hidden lg:block">
      <div
        className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent transition ${
          active ? "opacity-100" : "opacity-50"
        }`}
      />
      <span
        className={`evc-energy absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(96,165,250,0.95)] ring-2 ring-blue-400 ${
          active ? "opacity-100" : "opacity-30"
        }`}
      />
    </div>
  );
}

function DarkCapability({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]">
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/15 bg-blue-400/10 text-blue-300">
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function PlanRow({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          dark ? "bg-white/10 text-cyan-200" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className={`text-sm font-semibold ${dark ? "text-blue-50" : "text-slate-700"}`}>
        {text}
      </span>
    </div>
  );
}
