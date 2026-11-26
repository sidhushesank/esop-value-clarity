import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  GraduationCap,
  Landmark,
  Layers3,
  LineChart,
  Percent,
  PlayCircle,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";

import Footer from "@/components/sections/Footer";
import {
  getContentArticles,
  type ContentArticle,
  type ContentArticleIcon,
} from "@/lib/blog-content";

const BASE_URL = "https://esopvalueclarity.com";
const SITE_NAME = "ESOP Value Clarity";

const AUTHOR_NAME = "Sheshank Sidheshwar";

const AUTHOR_LINKEDIN =
  "https://www.linkedin.com/in/sheshank-sidheshwar-b84166252/";

const PUBLISHED_DATE = "2026-09-16";
const UPDATED_DATE = "2026-11-18";

// Real YouTube upload date of k2LzKS1WkzA, full ISO 8601 with time zone.
// Check it in YouTube Studio → Content → Date and correct it if needed.
const VIDEO_UPLOAD_DATE = "2026-09-16T10:00:00+05:30";
const LOGO_URL = `${BASE_URL}/brand/evc-mark.png`;

const YOUTUBE_ID = "k2LzKS1WkzA";

const YOUTUBE_URL = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`;

type Section = {
  id: string;
  title: string;
  eyebrow?: string;
  body: string[];
  bullets?: string[];
  cards?: { label: string; value: string }[];
  warning?: string;
};

type Article = {
  category: string;
  stage: string;
  audience: string[];
  readTime: string;
  videoTime: string;
  title: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  quickAnswer: string[];
  heroStats: { label: string; value: string }[];
  modelCards: { label: string; value: string }[];
  sections: Section[];
  personaViews: { label: string; value: string }[];
  checklist: string[];
  mistakes: string[];
  faq: { question: string; answer: string }[];
  related: string[];
};

const articles = {
  "startup-offered-25000-esops": {
    category: "Offer decision",
    stage: "I have an offer",
    audience: ["Employees", "Founders", "HR"],
    readTime: "4 min read",
    videoTime: "3 min video",
    title: "I received 25,000 ESOPs. Is that actually good?",
    description:
      "A practical decision guide for employees who received a large option count but do not yet know the ownership percentage, exercise cost, dilution risk, tax impact or realistic outcome range.",
    keywords: [
      "25000 ESOPs",
      "is my ESOP offer good",
      "startup equity offer",
      "employee stock options India",
      "ESOP ownership percentage",
      "ESOP negotiation",
    ],
    icon: Target,
    quickAnswer: [
      "25,000 options can be meaningful, ordinary or almost meaningless depending on the denominator.",
      "The first missing number is ownership percentage: options divided by the relevant fully diluted share count.",
      "The second missing number is exercise cost: options multiplied by strike price, before any taxes or transaction costs.",
      "The third missing piece is scenario quality: dilution, liquidity, company value and time horizon.",
    ],
    heroStats: [
      { label: "Headline", value: "25,000 options" },
      { label: "Missing context", value: "ownership %" },
      { label: "Cash question", value: "exercise cost" },
      { label: "Reality check", value: "scenarios" },
    ],
    modelCards: [
      { label: "Ask", value: "What share count is being used?" },
      { label: "Model", value: "Base, upside and conservative cases" },
      { label: "Separate", value: "Known terms from assumptions" },
    ],
    sections: [
      {
        id: "why-count-fails",
        eyebrow: "The trap",
        title:
          "Option count is the loudest number, but often the weakest signal.",
        body: [
          "A grant of 25,000 options feels specific, so employees naturally treat it as useful information. But the count is only the numerator. Without the denominator, it does not tell you what percentage of the company the grant represents.",
          "A 25,000-option grant at a company with 25 lakh fully diluted shares is very different from the same grant at a company with 25 crore fully diluted shares. The number is identical; the economics are not.",
        ],
        cards: [
          { label: "Company A", value: "25,000 / 25,00,000 = 1.00%" },
          { label: "Company B", value: "25,000 / 25,00,00,000 = 0.01%" },
        ],
      },
      {
        id: "questions-before-value",
        eyebrow: "Before estimating value",
        title: "Ask for the terms that control the outcome.",
        body: [
          "Employees often jump directly from option count to a dream exit value. That skips the actual decision structure. First, understand the grant terms. Then model the assumptions.",
          "If the company cannot share every cap-table detail, that is common. But you can still ask for enough context to avoid treating 25,000 options as a standalone answer.",
        ],
        bullets: [
          "What is the exercise or strike price per option?",
          "What fully diluted share count is used to estimate ownership?",
          "What is the vesting schedule and cliff?",
          "What happens to vested options if I leave?",
          "Is there a recent FMV, valuation or reference price?",
          "What dilution assumptions should I consider after future funding rounds?",
        ],
      },
      {
        id: "cash-reality",
        eyebrow: "Exercise cost",
        title: "The grant may require cash before it ever becomes cash.",
        body: [
          "Options are not the same as free shares. If your options vest, you may still need to exercise them by paying the strike price. A grant can look attractive on paper but require a cash decision at the worst possible time, such as after leaving the company.",
          "For example, 25,000 vested options at a strike price of ₹20 create an exercise cost of ₹5,00,000 before considering any taxes or other costs. That is a real personal-finance decision, not a small footnote.",
        ],
        warning:
          "A modelled equity value is not liquidity. Private-company shares may remain unsellable until a permitted buyback, secondary sale, acquisition, IPO or other liquidity event.",
      },
      {
        id: "decision-frame",
        eyebrow: "How to decide",
        title:
          "Do not ask whether 25,000 is good. Ask what decision it changes.",
        body: [
          "If you are choosing between two offers, compare guaranteed cash separately from uncertain equity opportunity. If you are negotiating, decide whether you want more cash, more options, a better strike, a clearer exercise window or more transparency. If you are joining because of upside, model the downside too.",
          "The strongest ESOP analysis does not produce one magical number. It shows the sensitivity of your outcome to assumptions you do not control.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Do not celebrate the count until you know ownership, strike price, vesting and exercise window.",
      },
      {
        label: "Founder",
        value:
          "A clean explanation builds trust more than a large number with no context.",
      },
      {
        label: "HR",
        value:
          "Give candidates a repeatable explanation path so every offer does not become a custom confusion cycle.",
      },
      {
        label: "CA / advisor",
        value:
          "The planning question starts when cash, tax and timing enter the picture.",
      },
    ],
    checklist: [
      "Get the option count and type of award.",
      "Ask for the strike price and vesting schedule.",
      "Estimate ownership percentage using the relevant share count if available.",
      "Model exercise cost before assuming upside.",
      "Run conservative, base and upside scenarios.",
      "Check post-termination exercise rules before resigning later.",
    ],
    mistakes: [
      "Comparing 25,000 options at two companies as if they are equivalent.",
      "Ignoring strike price and exercise cash requirement.",
      "Treating valuation as cash you can access today.",
      "Forgetting dilution after future funding rounds.",
    ],
    faq: [
      {
        question: "Is 25,000 ESOPs a lot?",
        answer:
          "It can be, but the count alone is not enough. You need the relevant fully diluted share count, strike price, vesting schedule, dilution assumptions and liquidity context.",
      },
      {
        question: "What should I ask the company before accepting?",
        answer:
          "Ask for strike price, vesting schedule, cliff, exercise window, any available ownership percentage or denominator context, and how employees usually get liquidity.",
      },
      {
        question: "Can I value ESOPs like salary?",
        answer:
          "No. Salary is guaranteed cash compensation. ESOPs are uncertain equity opportunity and should be modelled separately from guaranteed compensation.",
      },
    ],
    related: [
      "should-i-negotiate-esops",
      "compare-startup-offers-equity",
      "esop-exercise-cost",
    ],
  },

  "should-i-negotiate-esops": {
    category: "Negotiation",
    stage: "I am negotiating",
    audience: ["Employees", "Founders", "HR"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title: "Should I negotiate ESOPs or salary in my startup offer?",
    description:
      "A practical guide to comparing guaranteed salary with uncertain equity opportunity when negotiating a startup offer.",
    keywords: [
      "ESOP negotiation",
      "startup salary vs equity",
      "negotiate stock options",
      "startup offer negotiation",
    ],
    icon: Scale,
    quickAnswer: [
      "Negotiate salary when near-term cash, stability or family obligations matter more.",
      "Negotiate equity when you understand the risk and believe the upside justifies the uncertainty.",
      "Negotiate terms, not just quantity: strike price, vesting, exercise window and clarity can matter as much as more options.",
    ],
    heroStats: [
      { label: "Cash", value: "guaranteed" },
      { label: "Equity", value: "uncertain" },
      { label: "Best lever", value: "depends" },
      { label: "Rule", value: "separate both" },
    ],
    modelCards: [
      { label: "Salary", value: "Known monthly value" },
      { label: "ESOP", value: "Scenario-based future value" },
      { label: "Terms", value: "Often negotiable" },
    ],
    sections: [
      {
        id: "separate-cash-equity",
        eyebrow: "Core principle",
        title:
          "Do not mix salary and ESOPs into one emotional number.",
        body: [
          "A startup offer is usually a mix of guaranteed compensation and uncertain ownership opportunity. The negotiation mistake is to combine them too early and say one offer is better because the total-looking number is bigger.",
          "Salary pays bills now. Equity may produce upside later, may require cash to exercise and may never become liquid. Negotiate with those differences visible.",
        ],
      },
      {
        id: "what-to-negotiate",
        eyebrow: "Negotiation levers",
        title:
          "You may have more levers than more options or more salary.",
        body: [
          "When candidates negotiate ESOPs, they usually ask for a higher option count. That can help, but it is not the only lever. A clearer ownership percentage, a longer exercise window, a signing bonus or a salary adjustment may be more useful depending on the situation.",
        ],
        bullets: [
          "Higher base salary or joining bonus",
          "Higher option count or refreshed grant promise",
          "Clearer ownership percentage context",
          "Shorter cliff or earlier vesting start date",
          "Longer post-termination exercise window",
          "Written explanation of liquidity history and restrictions",
        ],
      },
      {
        id: "when-equity-matters",
        eyebrow: "Risk appetite",
        title:
          "Equity negotiation makes sense only when you are willing to own uncertainty.",
        body: [
          "If you need stable cash flow, do not let a large ESOP story push you into accepting too little salary. If you have enough cash stability and strong conviction in the company, more equity may be worth negotiating.",
          "The honest answer is not universal. It depends on your finances, conviction, time horizon and the terms attached to the grant.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Ask what problem you are solving: monthly cash, upside, risk reduction or clarity.",
      },
      {
        label: "Founder",
        value:
          "A transparent explanation can reduce negotiation friction and improve candidate trust.",
      },
      {
        label: "HR",
        value:
          "Give recruiters a standard way to explain salary-equity tradeoffs without making promises.",
      },
      {
        label: "Advisor",
        value:
          "Separate personal cash needs from speculative upside before comparing offers.",
      },
    ],
    checklist: [
      "Write down your minimum acceptable cash compensation.",
      "Estimate the exercise cost of the proposed grant.",
      "Model at least three equity scenarios.",
      "Ask whether a grant refresh is typical after performance or promotion.",
      "Negotiate terms that reduce confusion, not only bigger numbers.",
    ],
    mistakes: [
      "Accepting lower salary because the ESOP story sounds exciting.",
      "Negotiating only option count while ignoring exercise window.",
      "Assuming a future valuation is guaranteed take-home value.",
    ],
    faq: [
      {
        question: "Should I always negotiate ESOPs?",
        answer:
          "Not always. Negotiate when the grant is material to your decision or when terms are unclear enough to create risk.",
      },
      {
        question: "Is salary better than ESOPs?",
        answer:
          "They are different. Salary is known cash. ESOPs are uncertain ownership opportunity. The better mix depends on your situation.",
      },
    ],
    related: [
      "startup-offered-25000-esops",
      "compare-startup-offers-equity",
      "vesting-schedule",
    ],
  },

  "esop-exercise-cost": {
    category: "Exercise",
    stage: "Before exercising",
    audience: ["Employees", "CAs", "Founders"],
    readTime: "5 min read",
    videoTime: "3 min video",
    updatedAt: "2026-11-26",
    title: "ESOP Exercise Price (Strike Price): Meaning, Cost and Tax in India",
    description:
      "What the ESOP exercise price (strike price) means, how Indian companies set it, and the full cash you need to exercise, including perquisite tax. Worked ₹ example inside.",
    keywords: [
      "ESOP exercise price",
      "strike price ESOP",
      "what is exercise price in ESOP",
      "ESOP exercise cost",
      "exercising ESOP",
      "ESOP strike price India",
      "perquisite tax ESOP",
    ],
    icon: WalletCards,
    quickAnswer: [
      "The exercise price, also called the strike price, is the fixed amount you pay per share to convert a vested option into a share. It is written in your grant letter.",
      "Exercising usually costs more than the exercise price alone. In India the gap between the share's fair market value and your exercise price is taxed as salary at the moment you exercise.",
      "Cash needed to exercise ≈ (options × exercise price) + tax on (options × (FMV − exercise price)).",
      "A low exercise price does not make exercising cheap if the fair market value is high. The tax can be many times the exercise price itself.",
    ],
    heroStats: [
      { label: "Also called", value: "strike price" },
      { label: "Set by", value: "the ESOP scheme" },
      { label: "Taxed at exercise", value: "FMV − strike" },
      { label: "Often bigger", value: "tax than price" },
    ],
    modelCards: [
      { label: "Step 1", value: "options × exercise price" },
      { label: "Step 2", value: "options × (FMV − price)" },
      { label: "Step 3", value: "tax on step 2 at your slab" },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Meaning",
        title: "The exercise price is what you pay to turn an option into a share.",
        body: [
          "Every option in your grant comes with an exercise price, also called the strike price or grant price. When an option has vested, you can exercise it by paying that price, and the company issues you one share for each option exercised.",
          "The exercise price is fixed when the options are granted and does not change as the company's value grows. That fixed price is the whole point: if a share later becomes worth ₹500 and your exercise price is ₹10, each option carries a ₹490 gap in your favour.",
        ],
        cards: [
          { label: "Exercise price", value: "fixed at grant" },
          { label: "Share value", value: "changes over time" },
          { label: "Your upside", value: "the gap between them" },
        ],
      },
      {
        id: "how-set",
        eyebrow: "How it is set",
        title: "Indian companies set the exercise price in their ESOP scheme.",
        body: [
          "For unlisted companies, the exercise price, or the formula for arriving at it, is set out in the ESOP scheme approved by shareholders. Companies have a lot of freedom here, within accounting and legal limits.",
          "In practice, many Indian startups set it at the face value of the share, often ₹1 or ₹10. Others set it at a discount to the latest fair market value, or at the fair market value itself.",
          "A lower exercise price makes options more valuable to you, but it does not avoid tax. The perquisite at exercise is measured from the fair market value, not from the exercise price you paid.",
        ],
        warning:
          "What a company may set as an exercise price depends on its scheme, the Companies Act rules and accounting standards. A company secretary can confirm what applies to a particular company.",
      },
      {
        id: "full-cost",
        eyebrow: "The full cost",
        title: "Exercising needs cash for two things: the price and the tax.",
        body: [
          "The first cost is obvious: the number of options you exercise multiplied by the exercise price. This is paid to the company.",
          "The second cost is the tax. In India, on the exercise date, the difference between the share's fair market value and your exercise price is treated as a perquisite, part of your salary income. It is taxed at your slab rate, and your employer deducts TDS, usually through payroll or by asking you to pay it in.",
          "For unlisted shares, the fair market value comes from a valuation by a Category I merchant banker, as of the exercise date or a date up to 180 days before it. For listed shares, it is based on the market price on the exercise date.",
        ],
        cards: [
          { label: "Paid to company", value: "options × exercise price" },
          { label: "Taxed as salary", value: "options × (FMV − price)" },
          { label: "Tax rate", value: "your slab, plus cess" },
        ],
      },
      {
        id: "example",
        eyebrow: "Worked example",
        title: "4,000 options, exercise price ₹10, FMV ₹160.",
        body: [
          "Say you want to exercise 4,000 vested options with an exercise price of ₹10. The latest merchant banker valuation puts the share at ₹160. You are in the 30% slab.",
          "Exercise price payable: 4,000 × ₹10 = ₹40,000. Perquisite: 4,000 × (₹160 − ₹10) = ₹6,00,000. Tax at 30% plus 4% cess: about ₹1,87,200. Total cash needed: about ₹2,27,200, for shares you may not be able to sell for years.",
          "Notice that the tax is almost five times the exercise price. This is the most common surprise for employees, especially at companies that have grown a lot since the grant.",
        ],
        cards: [
          { label: "Exercise price", value: "₹40,000" },
          { label: "Perquisite", value: "₹6,00,000" },
          { label: "Tax (30% + cess)", value: "≈ ₹1,87,200" },
          { label: "Cash needed", value: "≈ ₹2,27,200" },
        ],
      },
      {
        id: "options",
        eyebrow: "Your choices",
        title: "Ways to manage the cash needed.",
        body: [
          "You rarely have to exercise everything at once. Think about timing and quantity.",
        ],
        bullets: [
          "Exercise in tranches, a portion each year, to spread the tax across years and slabs.",
          "Check whether you qualify for the deferral available to employees of eligible startups: tax at exercise can be postponed to the earliest of 60 months from the end of the tax year of allotment (48 months for shares allotted before 1 April 2026), the sale of the shares, or leaving the company.",
          "Ask whether the company offers cashless exercise at a buyback or sale, where shares are sold and the proceeds cover the price and tax.",
          "If you are leaving, compare the cost of exercising with the length of the exercise window before deciding.",
        ],
      },
    ],
    personaViews: [
      { label: "Employee", value: "Budget for the tax, not only the exercise price, before you decide to exercise." },
      { label: "Founder", value: "Explain the tax at exercise when you grant options, or employees will feel misled later." },
      { label: "HR", value: "Share the latest FMV with employees so they can estimate the tax themselves." },
      { label: "CA", value: "Check the FMV report date, the TDS treatment and whether the startup deferral applies." },
    ],
    checklist: [
      "Find the exercise price in your grant letter.",
      "Ask HR for the latest merchant banker FMV and its date.",
      "Work out options × exercise price.",
      "Work out options × (FMV − exercise price) and the tax at your slab.",
      "Check whether the startup tax deferral applies to you.",
      "Decide how many options to exercise, and when.",
    ],
    mistakes: [
      "Budgeting only for the exercise price.",
      "Assuming a ₹1 exercise price means exercising is almost free.",
      "Exercising everything in one year and pushing your income into a higher slab.",
      "Missing the exercise window after leaving.",
    ],
    faq: [
      {
        question: "What is the exercise price in ESOP?",
        answer: "It is the fixed price per share you pay to convert a vested option into a share. It is also called the strike price and is set in your grant letter.",
      },
      {
        question: "Is strike price the same as exercise price?",
        answer: "Yes. Strike price, exercise price and grant price usually mean the same thing in ESOP documents.",
      },
      {
        question: "Who decides the ESOP exercise price in India?",
        answer: "The company, through its ESOP scheme approved by shareholders. Many startups set it at face value, others at or below the fair market value.",
      },
      {
        question: "Do I pay tax when I exercise ESOPs?",
        answer:
          "Usually yes. The gap between fair market value and exercise price is taxed as salary at exercise, unless you qualify for the deferral for employees of eligible startups.",
      },
      {
        question: "What is the exercise price per share?",
        answer:
          "It is the amount you pay for each share when you exercise one option. Multiply it by the number of options you exercise to get the amount payable to the company, before tax.",
      },
      {
        question: "Can the ESOP exercise price be lower than the face value of the share?",
        answer:
          "No. An Indian company cannot issue shares below their face value, so the exercise price is at least the face value, commonly ₹1 or ₹10 per share.",
      },
      {
        question: "How do I calculate the total cost of exercising my ESOPs?",
        answer:
          "Add two amounts: options × exercise price, paid to the company, and the tax on options × (FMV − exercise price) at your slab rate plus cess. The free ESOP calculator on this site does this for you.",
      },
      {
        question: "What is the exercise period in ESOP?",
        answer:
          "It is the time you have to exercise vested options. While you work at the company it usually runs until the options expire. After you leave, the scheme sets a separate window, anywhere from 30 days to several years, and some Indian schemes allow exercise only at a liquidity event. Vested options not exercised in time can lapse.",
      },
      {
        question: "What is the difference between the exercise price and the FMV?",
        answer:
          "The exercise price is the fixed amount you pay per share, set at grant. The FMV (fair market value) is what a share is worth on the exercise date, from a Category I merchant banker valuation for unlisted companies. The gap between them, times the options exercised, is the perquisite taxed as salary.",
      },
      {
        question: "What if I cannot afford to exercise my vested options?",
        answer:
          "Exercise in smaller tranches, check whether the startup tax deferral applies, or ask whether the company offers cashless exercise at a buyback or sale. If you are leaving, check how long your exercise window is first.",
      },
    ],
    related: [
      "esop-valuation-india",
      "leaving-startup-esop-options",
      "what-is-an-esop",
    ],
  },

  "leaving-startup-esop-options": {
    category: "Leaving company",
    stage: "I am leaving",
    audience: ["Employees", "HR", "CAs"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title:
      "I am leaving my startup. What happens to my vested options?",
    description:
      "A leaving-company checklist for vested options, unvested options, exercise windows, cash decisions and documents to review before your last working day.",
    keywords: [
      "what happens to ESOP when leaving company",
      "vested options after leaving",
      "post termination exercise window",
      "unvested ESOP",
    ],
    icon: Clock3,
    quickAnswer: [
      "Unvested options are commonly forfeited when employment ends, subject to documents.",
      "Vested options may remain exercisable only for a limited window.",
      "The leaving decision is often about cash, timing and risk, not just how many options vested.",
    ],
    heroStats: [
      { label: "Unvested", value: "often forfeited" },
      { label: "Vested", value: "check window" },
      { label: "Decision", value: "exercise or not" },
      { label: "Before leaving", value: "get docs" },
    ],
    modelCards: [
      { label: "Vested count", value: "What you may keep" },
      { label: "Deadline", value: "When the choice expires" },
      { label: "Cash", value: "What exercise requires" },
    ],
    sections: [
      {
        id: "vested-unvested",
        eyebrow: "First split",
        title:
          "Separate vested from unvested before anything else.",
        body: [
          "When you leave, the first question is not total granted options. It is how many have vested as of your actual termination date and what the plan says about the remaining unvested portion.",
          "Unvested options are commonly forfeited, but the final answer depends on your grant agreement, plan rules and any special acceleration terms.",
        ],
      },
      {
        id: "exercise-window",
        eyebrow: "Deadline risk",
        title:
          "The post-termination exercise window can be the most important line in the document.",
        body: [
          "Some employees only discover the exercise window after resigning. If the window is short, you may need to quickly decide whether to pay the exercise cost and take private-company share risk.",
          "Before your last working day, ask for the exact number of vested options, strike price, exercise process and deadline in writing.",
        ],
        warning:
          "Missing the exercise window can cause vested options to lapse. Do not rely on memory or informal messages for the deadline.",
      },
      {
        id: "decision",
        eyebrow: "Decision lens",
        title:
          "Exercising after leaving is a cash allocation decision.",
        body: [
          "The decision is not automatically yes because the options vested. You are deciding whether to spend cash on an illiquid, risky asset connected to a company you no longer work for.",
        ],
        bullets: [
          "Can you afford the exercise cost without financial stress?",
          "What do you believe about the company's future?",
          "What liquidity paths are realistic?",
          "What tax consequences could apply?",
          "Would partial exercise reduce risk?",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Get the final vested count and deadline before your last day.",
      },
      {
        label: "Founder",
        value:
          "Transparent offboarding protects trust even when employees leave.",
      },
      {
        label: "HR",
        value:
          "Make vested options and exercise window part of every exit process.",
      },
      {
        label: "CA",
        value:
          "The leaving date can trigger a compressed tax and cash-planning timeline.",
      },
    ],
    checklist: [
      "Confirm termination date used for vesting.",
      "Get vested and unvested counts.",
      "Confirm strike price.",
      "Confirm exercise deadline.",
      "Ask whether partial exercise is allowed.",
      "Review tax and liquidity before paying cash.",
    ],
    mistakes: [
      "Thinking granted options are the same as vested options.",
      "Missing the exercise deadline.",
      "Exercising only because of sunk-cost emotion.",
    ],
    faq: [
      {
        question:
          "Do unvested options continue vesting after I leave?",
        answer:
          "Usually no, unless your documents provide acceleration or another special treatment. Check the plan and grant terms.",
      },
      {
        question:
          "What happens if I do not exercise vested options in time?",
        answer:
          "They may lapse according to the plan terms. Confirm the deadline directly with the company.",
      },
    ],
    related: [
      "esop-exercise-cost",
      "vesting-schedule",
      "startup-offered-25000-esops",
    ],
  },

  "startup-raised-funding-dilution": {
    category: "Dilution",
    stage: "Funding happened",
    audience: ["Employees", "Founders", "HR"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title:
      "My startup raised funding. Did my ESOP become worthless?",
    description:
      "A decision-first dilution guide for employees after a funding round, explaining ownership percentage, valuation, option pools and scenario modelling.",
    keywords: [
      "startup funding ESOP dilution",
      "did my ESOP become worthless",
      "option pool dilution",
      "funding round employee equity",
    ],
    icon: Percent,
    quickAnswer: [
      "Funding usually changes the cap table, but dilution alone does not tell you whether your economics improved or worsened.",
      "Your percentage can shrink while the company becomes more valuable.",
      "The useful question is how ownership, company value, exercise cost and liquidity interact after the round.",
    ],
    heroStats: [
      { label: "Ownership", value: "may shrink" },
      { label: "Company value", value: "may grow" },
      { label: "Option pool", value: "may expand" },
      { label: "Answer", value: "model both" },
    ],
    modelCards: [
      { label: "Before round", value: "ownership x value" },
      { label: "After round", value: "new ownership x new value" },
      { label: "Sensitivity", value: "more rounds later" },
    ],
    sections: [
      {
        id: "dilution-not-verdict",
        eyebrow: "No panic",
        title:
          "Dilution is a change, not automatically a verdict.",
        body: [
          "After a funding round, new shares or share-like instruments may be issued. That can reduce the percentage ownership represented by existing options. This is dilution.",
          "But economics depend on both percentage and value. A smaller slice of a much larger company can be worth more than a bigger slice of a smaller company.",
        ],
        cards: [
          { label: "Before", value: "1.00% of ₹50Cr = ₹50L" },
          { label: "After", value: "0.50% of ₹250Cr = ₹1.25Cr" },
        ],
      },
      {
        id: "what-changed",
        eyebrow: "Find the drivers",
        title: "Ask what exactly changed in the round.",
        body: [
          "Employees often hear the headline valuation but not the details that affect their grant. You do not need to become a cap-table expert, but you do need to know which assumptions matter.",
        ],
        bullets: [
          "Was the employee option pool expanded?",
          "What valuation is being referenced?",
          "Did the company raise enough capital to reduce failure risk?",
          "Are refresh grants expected for employees?",
          "Does the strike price change for future grants?",
        ],
      },
      {
        id: "model-future-rounds",
        eyebrow: "Scenario planning",
        title:
          "One funding round is rarely the last assumption.",
        body: [
          "If the company will raise again, today's ownership may be diluted again. That is why ESOP Value Clarity treats dilution as a scenario input, not a prediction or a fixed truth.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Do not judge dilution without comparing the new company-value scenario.",
      },
      {
        label: "Founder",
        value:
          "Explain dilution honestly so employees do not feel misled after fundraising.",
      },
      {
        label: "HR",
        value:
          "Funding announcements should include employee-friendly equity context.",
      },
      {
        label: "Advisor",
        value:
          "Model post-money value, dilution and liquidity timing together.",
      },
    ],
    checklist: [
      "Estimate ownership before and after the round.",
      "Ask whether option pool expansion happened.",
      "Understand the valuation being referenced.",
      "Model future dilution, not just the current round.",
      "Separate paper value from liquidity.",
    ],
    mistakes: [
      "Treating dilution as automatically bad.",
      "Treating valuation growth as guaranteed employee value.",
      "Ignoring future dilution after later funding rounds.",
    ],
    faq: [
      {
        question: "Does dilution reduce my option count?",
        answer:
          "Usually the option count stays the same. The percentage represented by that count can reduce if the share base expands.",
      },
      {
        question: "Can dilution be good?",
        answer:
          "Dilution itself reduces percentage ownership, but the financing may increase company value or reduce risk. The combined effect must be modelled.",
      },
    ],
    related: [
      "dilution-explained",
      "startup-offered-25000-esops",
      "compare-startup-offers-equity",
    ],
  },

  "compare-startup-offers-equity": {
    category: "Offer comparison",
    stage: "I have two offers",
    audience: ["Employees", "HR"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title: "Two startup offers. Which equity package is stronger?",
    description:
      "A structured framework for comparing startup offers across salary, variable compensation, ESOP quantity, strike price, vesting, dilution and risk.",
    keywords: [
      "compare startup offers",
      "equity offer comparison",
      "startup offer ESOP",
      "salary vs equity comparison",
    ],
    icon: BriefcaseBusiness,
    quickAnswer: [
      "Do not compare offers by total CTC alone if one offer includes uncertain equity.",
      "Separate guaranteed cash from variable pay and equity opportunity.",
      "Compare equity using ownership, strike price, vesting, exercise window, dilution and liquidity probability.",
    ],
    heroStats: [
      { label: "Offer A", value: "cash heavy" },
      { label: "Offer B", value: "equity heavy" },
      { label: "Compare", value: "separately" },
      { label: "Output", value: "decision range" },
    ],
    modelCards: [
      { label: "Guaranteed", value: "Base + fixed pay" },
      { label: "Variable", value: "Bonus + performance" },
      { label: "Equity", value: "Scenario value" },
    ],
    sections: [
      {
        id: "three-buckets",
        eyebrow: "Comparison structure",
        title: "Put each offer into three buckets.",
        body: [
          "The easiest way to compare offers is to separate guaranteed compensation, variable compensation and equity opportunity. Do not collapse them into one headline number until you understand the risk in each bucket.",
        ],
        cards: [
          {
            label: "Guaranteed cash",
            value: "Salary, fixed allowances",
          },
          {
            label: "Variable cash",
            value: "Bonus, commission, performance",
          },
          {
            label: "Equity",
            value: "ESOPs, RSUs, options",
          },
        ],
      },
      {
        id: "equity-comparison",
        eyebrow: "Equity details",
        title:
          "The stronger equity package is not always the larger option count.",
        body: [
          "A smaller option grant at a company with better transparency, lower strike price, stronger business momentum and clearer liquidity path may be more attractive than a larger grant with vague terms.",
        ],
        bullets: [
          "Option count and ownership percentage",
          "Strike price and exercise cost",
          "Vesting schedule and cliff",
          "Post-termination exercise window",
          "Dilution assumptions",
          "Liquidity history and realistic path",
        ],
      },
      {
        id: "decision-output",
        eyebrow: "Final output",
        title:
          "Your final answer should be a tradeoff, not a fake precision number.",
        body: [
          "A good comparison might say: Offer A gives more guaranteed cash and lower personal risk; Offer B gives more upside if the company performs and liquidity arrives. That is more honest than pretending one exact expected value decides everything.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Choose the offer whose risk-reward mix fits your life, not just the biggest story.",
      },
      {
        label: "Founder",
        value:
          "Make your equity offer understandable if you cannot win on cash alone.",
      },
      {
        label: "HR",
        value:
          "Offer comparison content can reduce candidate confusion and improve acceptance quality.",
      },
      {
        label: "Advisor",
        value:
          "Expected value needs assumptions; show the assumptions instead of hiding them.",
      },
    ],
    checklist: [
      "Separate fixed cash, variable cash and equity.",
      "Calculate exercise cost for each option offer.",
      "Compare vesting schedules and cliffs.",
      "Model dilution and liquidity assumptions.",
      "Write down the non-financial tradeoffs too.",
    ],
    mistakes: [
      "Comparing CTC numbers without risk adjustment.",
      "Treating company valuation as employee take-home value.",
      "Ignoring vesting if you may leave early.",
    ],
    faq: [
      {
        question: "Can ESOP value be included in CTC?",
        answer:
          "It may appear in offer communication, but it should be mentally separated from guaranteed cash because it is uncertain and condition-dependent.",
      },
      {
        question:
          "Which offer is better if one has more ESOPs?",
        answer:
          "More ESOPs are not automatically better. Ownership, strike price, dilution, vesting and liquidity matter.",
      },
    ],
    related: [
      "startup-offered-25000-esops",
      "should-i-negotiate-esops",
      "esop-vs-rsu",
    ],
  },

  "what-is-an-esop": {
    category: "Foundation",
    stage: "Start here",
    audience: ["Employees", "Founders", "HR"],
    readTime: "6 min read",
    videoTime: "3 min video",
    title: "What Is an ESOP? Meaning, Full Form and How It Works in India",
    description:
      "ESOP meaning in plain language: how employee stock options work in India, from grant and vesting to exercise and sale, the key terms, how ESOPs are taxed twice, and what to ask before you accept one.",
    keywords: [
      "what is an ESOP",
      "ESOP meaning",
      "ESOP full form",
      "employee stock option plan India",
      "how ESOPs work",
      "ESOP tax India",
      "ESOP value",
    ],
    icon: BookOpen,
    quickAnswer: [
      "ESOP stands for Employee Stock Option Plan. It gives you the right, not the obligation, to buy shares in your company later at a fixed price, called the exercise or strike price.",
      "An ESOP goes through four stages: grant, vesting, exercise and sale. You earn the options over time, pay to convert them into shares, and only make money when you can sell those shares for more than you paid.",
      "In India an ESOP is usually taxed twice: as salary when you exercise, on the gap between the share's fair market value and your exercise price, and as capital gains when you sell.",
      "The number of options alone tells you little. What matters is your percentage of the company, the exercise price, the vesting schedule, and whether there will ever be a way to sell.",
    ],
    heroStats: [
      { label: "Full form", value: "Employee Stock Option Plan" },
      { label: "Stages", value: "grant → vest → exercise → sell" },
      { label: "Tax events", value: "2 in India" },
      { label: "Key number", value: "% ownership" },
    ],
    modelCards: [
      { label: "Grant", value: "the promise" },
      { label: "Exercise", value: "pay to buy shares" },
      { label: "Sale", value: "where value becomes cash" },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Meaning",
        title: "An ESOP is an option to buy shares later at a price fixed today.",
        body: [
          "An ESOP, or Employee Stock Option Plan, is a scheme a company sets up to give employees options over its shares. Each option is a right to buy one share at a fixed price, the exercise price, after the option has vested.",
          "You do not own shares when you receive an ESOP grant. You own options. They become shares only when you exercise them, which means paying the exercise price and, in India, usually the tax that falls due at that moment.",
          "Startups use ESOPs because they cannot always match big-company salaries. The idea is simple: if the company's value grows, the gap between what a share is worth and your fixed exercise price is yours.",
        ],
      },
      {
        id: "lifecycle",
        eyebrow: "How it works",
        title: "Every ESOP goes through four stages.",
        body: [
          "Understanding where you are in this cycle tells you what you actually have today.",
        ],
        bullets: [
          "Grant: the company grants you a number of options at an exercise price, under its ESOP scheme. You receive a grant letter.",
          "Vesting: the options become exercisable over time, usually over four years with a one-year cliff. In India there must be at least a year between grant and vesting.",
          "Exercise: you pay the exercise price for vested options and receive shares. This is usually a taxable event.",
          "Sale: you sell the shares, in a buyback, a secondary sale, an acquisition or after an IPO. This is the only point where the ESOP turns into cash.",
        ],
        cards: [
          { label: "Grant", value: "options, not shares" },
          { label: "Vest", value: "earned over time" },
          { label: "Exercise", value: "cash out of pocket" },
          { label: "Sell", value: "cash in hand" },
        ],
      },
      {
        id: "terms",
        eyebrow: "Key terms",
        title: "Six terms you will see in every grant letter.",
        body: [
          "These words appear in almost every ESOP document. Knowing them makes the rest of the letter readable.",
        ],
        bullets: [
          "Exercise price (strike price): the fixed price you pay per share when you exercise.",
          "Fair market value (FMV): what a share is valued at on a given date. For unlisted shares in India, this comes from a merchant banker's valuation.",
          "Vesting schedule: the timetable on which options become exercisable.",
          "Cliff: the waiting period before anything vests, usually one year.",
          "Exercise window: how long you have to exercise vested options, especially after you leave.",
          "ESOP pool: the block of shares the company has set aside for employee options.",
        ],
      },
      {
        id: "tax",
        eyebrow: "Tax in India",
        title: "ESOPs are usually taxed twice: at exercise and at sale.",
        body: [
          "At exercise, the difference between the share's fair market value on the exercise date and your exercise price is treated as a salary perquisite. It is added to your salary income, taxed at your slab rate, and the employer deducts TDS. This tax is due even though you have not sold anything, which is why exercising can need a lot of cash.",
          "At sale, you pay capital gains tax on the difference between the sale price and the fair market value used at exercise. For unlisted shares, gains on shares held for more than 24 months from exercise are long-term. Shorter holdings are short-term and taxed at slab rates.",
          "Employees of eligible startups recognised under the startup tax rules can defer the tax due at exercise until the earliest of 48 months from the end of the relevant assessment year, the date they sell the shares, or the date they leave the company.",
        ],
        warning:
          "Tax rules and rates change, and your situation may differ. Treat this as an overview and confirm the numbers with a chartered accountant before you exercise or sell.",
      },
      {
        id: "example",
        eyebrow: "Example",
        title: "What an ESOP can be worth, step by step.",
        body: [
          "Say you hold 5,000 vested options with an exercise price of ₹10, and a merchant banker values the share at ₹210 on the day you exercise.",
          "Exercising costs ₹50,000 (5,000 × ₹10). The perquisite is ₹10,00,000 (5,000 × ₹200 gap), taxed as salary. At a 30% slab plus 4% cess, that is about ₹3,12,000 of tax. So exercising needs roughly ₹3.6 lakh in cash before you have sold a single share.",
          "If you later sell all 5,000 shares at ₹500 in a buyback, the capital gain is ₹14,50,000 (5,000 × ₹290 above the ₹210 FMV). How it is taxed depends on how long you held the shares.",
        ],
        cards: [
          { label: "Exercise cost", value: "₹50,000" },
          { label: "Perquisite", value: "₹10,00,000" },
          { label: "Tax at exercise", value: "≈ ₹3,12,000" },
          { label: "Gain at sale", value: "₹14,50,000" },
        ],
      },
      {
        id: "questions",
        eyebrow: "Before you accept",
        title: "Questions to ask about any ESOP offer.",
        body: [
          "A number of options without context is not an offer you can evaluate. Ask for the numbers that turn it into one.",
        ],
        bullets: [
          "What percentage of the company do these options represent, on a fully diluted basis?",
          "What is the exercise price, and what is the latest fair market value?",
          "What is the vesting schedule, cliff and vesting start date?",
          "How long can I exercise vested options after leaving?",
          "Has the company ever run a buyback or a secondary sale for employees?",
        ],
      },
    ],
    personaViews: [
      { label: "Employee", value: "Think of an ESOP as a possible bonus with a cost to claim it, not as guaranteed salary." },
      { label: "Founder", value: "Employees value ESOPs they understand. Explain the percentage, the price and the path to liquidity." },
      { label: "HR", value: "Give every offer a worked example: exercise cost, tax and a range of outcomes." },
      { label: "CA / CS", value: "The two tax events and the FMV report are where employees most often need help." },
    ],
    checklist: [
      "Read the grant letter and the ESOP scheme, not only the offer email.",
      "Note the number of options, exercise price and latest FMV.",
      "Work out your percentage of the fully diluted share count.",
      "Note the vesting schedule, cliff and exercise window.",
      "Estimate the cash needed to exercise, including tax.",
      "Ask how employees have sold shares in the past, if ever.",
    ],
    mistakes: [
      "Thinking an ESOP grant means you own shares today.",
      "Valuing options at the latest funding-round price per share.",
      "Forgetting that exercising is taxed before you can sell.",
      "Ignoring how future funding rounds dilute your percentage.",
    ],
    faq: [
      {
        question: "What is the full form of ESOP?",
        answer: "Employee Stock Option Plan, sometimes also expanded as Employee Stock Ownership Plan in the US, which is a different, retirement-style arrangement.",
      },
      {
        question: "Is an ESOP the same as owning shares?",
        answer: "No. An ESOP gives you options. You only own shares after you exercise vested options by paying the exercise price.",
      },
      {
        question: "How is ESOP taxed in India?",
        answer:
          "Usually twice. At exercise, the gap between fair market value and exercise price is taxed as salary. At sale, the gain over that fair market value is taxed as capital gains.",
      },
      {
        question: "Can I sell my ESOPs before an IPO?",
        answer:
          "Only if the company offers a route, such as a buyback, a secondary sale to investors, or an acquisition. Unlisted shares cannot usually be sold freely.",
      },
    ],
    related: [
      "vesting-schedule",
      "esop-exercise-cost",
      "startup-offered-25000-esops",
    ],
  },

  "esop-vs-rsu": {
    category: "Equity types",
    stage: "Compare equity",
    audience: ["Employees", "HR", "CAs"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title:
      "ESOP vs RSU: do not compare unit counts blindly",
    description:
      "Compare ESOPs and RSUs across exercise price, vesting, ownership, liquidity, taxation and offer value.",
    keywords: [
      "ESOP vs RSU",
      "RSU vs stock options",
      "startup ESOP vs RSU",
      "employee equity comparison",
    ],
    icon: Layers3,
    quickAnswer: [
      "An ESOP option usually requires exercise at a strike price; an RSU typically does not have an option exercise price.",
      "Unit counts are not directly comparable because the economics are different.",
      "Liquidity, tax and company stage can matter more than the label.",
    ],
    heroStats: [
      { label: "ESOP", value: "option" },
      { label: "RSU", value: "unit/share" },
      { label: "Compare", value: "economics" },
      { label: "Avoid", value: "unit count" },
    ],
    modelCards: [
      { label: "ESOP", value: "strike price matters" },
      { label: "RSU", value: "settlement matters" },
      { label: "Both", value: "vesting and tax matter" },
    ],
    sections: [
      {
        id: "core-difference",
        eyebrow: "Structure",
        title:
          "The biggest difference is the exercise requirement.",
        body: [
          "An ESOP or stock option generally gives you the right to buy shares at a strike price after vesting. An RSU generally represents a promise to deliver shares or equivalent value according to vesting and settlement terms, without an option strike-price payment.",
          "That difference changes cash requirement, downside risk and how employees should compare offers.",
        ],
        cards: [
          { label: "ESOP", value: "May require exercise cash" },
          { label: "RSU", value: "No option strike payment" },
          { label: "Both", value: "Can vest over time" },
        ],
      },
      {
        id: "why-counts-fail",
        eyebrow: "Comparison mistake",
        title:
          "10,000 options and 1,000 RSUs cannot be judged by count alone.",
        body: [
          "The value of options depends heavily on the spread between share value and strike price. RSUs are more directly tied to underlying share value, but they also depend on vesting, settlement, tax and liquidity.",
        ],
      },
      {
        id: "offer-context",
        eyebrow: "Offer context",
        title:
          "The company stage changes how each award feels.",
        body: [
          "Private-company options may have large upside but limited liquidity and exercise risk. Public-company RSUs may be easier to value but still depend on stock price, vesting and tax. Neither structure is automatically better.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Compare what you pay, when you vest, and whether you can sell.",
      },
      {
        label: "Founder",
        value:
          "Use plain comparisons when explaining options against big-company RSUs.",
      },
      {
        label: "HR",
        value:
          "Avoid presenting ESOP and RSU unit counts as equivalent.",
      },
      {
        label: "CA",
        value:
          "Tax timing may differ meaningfully between award types.",
      },
    ],
    checklist: [
      "Identify award type.",
      "Check strike price if options.",
      "Compare vesting schedules.",
      "Understand liquidity restrictions.",
      "Check tax timing.",
      "Model scenarios separately for each award.",
    ],
    mistakes: [
      "Assuming more units means more value.",
      "Ignoring strike price for options.",
      "Ignoring settlement and tax for RSUs.",
    ],
    faq: [
      {
        question: "Are RSUs better than ESOPs?",
        answer:
          "Not universally. RSUs and options have different economics. The better award depends on company, value, terms, tax and personal priorities.",
      },
      {
        question: "Do RSUs need exercise cash?",
        answer:
          "RSUs generally do not require an option strike-price exercise, but taxes and settlement rules can still matter.",
      },
    ],
    related: [
      "compare-startup-offers-equity",
      "what-is-an-esop",
      "should-i-negotiate-esops",
    ],
  },

  "dilution-explained": {
    category: "Dilution",
    stage: "Understand ownership",
    audience: ["Employees", "Founders", "HR"],
    readTime: "2 min read",
    videoTime: "3 min video",
    title: "ESOP dilution explained without the panic",
    description:
      "Understand how funding rounds and option pools can reduce ownership percentage while company value may still change the economic outcome.",
    keywords: [
      "ESOP dilution",
      "startup dilution",
      "employee equity dilution",
      "option pool dilution",
      "fully diluted ownership",
    ],
    icon: Percent,
    quickAnswer: [
      "Dilution means your option count may stay the same while the percentage ownership it represents becomes smaller.",
      "Dilution is not automatically bad; value depends on both ownership percentage and company value.",
      "Model dilution as a scenario input, not a guaranteed forecast.",
    ],
    heroStats: [
      { label: "Count", value: "same" },
      { label: "Percentage", value: "smaller" },
      { label: "Value", value: "depends" },
      { label: "Model", value: "scenarios" },
    ],
    modelCards: [
      { label: "Before", value: "larger %" },
      { label: "After", value: "smaller %" },
      { label: "Decision", value: "compare company value" },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Meaning",
        title: "Dilution changes the denominator.",
        body: [
          "If more shares or share-equivalents are created, the total ownership base expands. Your option count may remain unchanged, but the percentage of the company represented by those options can shrink.",
        ],
        cards: [
          { label: "Before", value: "1,000 / 100,000 = 1.00%" },
          { label: "After", value: "1,000 / 200,000 = 0.50%" },
        ],
      },
      {
        id: "not-always-bad",
        eyebrow: "Economics",
        title:
          "A smaller percentage can still be worth more.",
        body: [
          "If funding helps the company become much more valuable, a diluted stake may still have higher potential value. The key is to model ownership and valuation together.",
        ],
      },
      {
        id: "causes",
        eyebrow: "Causes",
        title:
          "Funding rounds are not the only source of dilution.",
        body: [
          "Dilution can come from new investor shares, option-pool expansion, convertible instruments or other securities becoming equity. Employees should understand which event occurred before drawing conclusions.",
        ],
        bullets: [
          "New financing round",
          "Option-pool expansion",
          "Convertible security conversion",
          "Acquisition-related share issuance",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Ask how much ownership changed and what value assumption changed with it.",
      },
      {
        label: "Founder",
        value:
          "Explain dilution before employees discover it emotionally.",
      },
      {
        label: "HR",
        value:
          "Use simple before-after examples to reduce panic after funding announcements.",
      },
      {
        label: "Advisor",
        value:
          "Dilution is only one part of scenario value.",
      },
    ],
    checklist: [
      "Estimate current ownership percentage.",
      "Understand what event caused dilution.",
      "Compare company value before and after.",
      "Model future rounds.",
      "Check whether refresh grants apply.",
    ],
    mistakes: [
      "Panicking at dilution alone.",
      "Ignoring option pool expansion.",
      "Using only one future scenario.",
    ],
    faq: [
      {
        question: "Does dilution reduce my number of options?",
        answer:
          "Typically no. It reduces the percentage those options represent if the total share base increases.",
      },
      {
        question: "Should I ask my company about dilution?",
        answer:
          "Yes, ask for employee-friendly context such as ownership estimate, option pool changes and whether refresh grants are common.",
      },
    ],
    related: [
      "startup-raised-funding-dilution",
      "startup-offered-25000-esops",
      "what-is-an-esop",
    ],
  },

  "vesting-schedule": {
    category: "Vesting",
    stage: "Understand timing",
    audience: ["Employees", "Founders", "HR"],
    readTime: "6 min read",
    videoTime: "3 min video",
    updatedAt: "2026-11-26",
    title: "ESOP Vesting Schedule in India: 1-Year Cliff, 4-Year Vesting and Examples",
    description:
      "How an ESOP vesting schedule works in India: the one-year cliff, monthly and yearly vesting, the legal minimum of one year before vesting, worked examples, and what happens to vested and unvested options when you leave.",
    keywords: [
      "ESOP vesting schedule",
      "ESOP vesting",
      "vesting schedule India",
      "one year cliff",
      "ESOP cliff and vesting",
      "vested and unvested options",
      "unvested ESOP meaning",
      "vesting in ESOP",
      "1 year cliff vesting",
      "1/48 monthly vesting",
      "vesting date meaning",
      "maximum vesting period for ESOP",
    ],
    icon: Clock3,
    quickAnswer: [
      "A vesting schedule decides when the options you were granted become yours to exercise. Granted is the promise; vested is what you have earned so far.",
      "The most common pattern is four years with a one-year cliff: nothing for the first year, 25% at the first anniversary, then the rest monthly or quarterly over the next three years.",
      "In India, the Companies Act rules require at least one year between grant and vesting for unlisted companies, so a cliff of at least a year is built in by law.",
      "If you leave, unvested options usually lapse. Vested options normally stay yours for an exercise window set in the scheme, so read that window before you resign.",
    ],
    heroStats: [
      { label: "Common length", value: "4 years" },
      { label: "Common cliff", value: "1 year" },
      { label: "Legal minimum", value: "1 year to vest" },
      { label: "After leaving", value: "exercise window" },
    ],
    modelCards: [
      { label: "Year 1", value: "0% until the cliff, then 25%" },
      { label: "Years 2 to 4", value: "about 2.08% a month" },
      { label: "Leaving", value: "unvested usually lapses" },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Meaning",
        title: "Vesting turns a grant into options you have actually earned.",
        body: [
          "When a startup grants you 12,000 options, you do not get the right to exercise all 12,000 on day one. The grant letter and the company's ESOP scheme set a vesting schedule: a timetable that says how many options become vested, and on which dates.",
          "Vested options are the ones you can exercise, that is, pay the exercise price and convert into shares. Unvested options are still conditional. They depend on you staying with the company, and sometimes on performance targets as well.",
          "This is why two people with the same grant can be in very different positions. Someone who joined four years ago may own the full grant. Someone who joined eleven months ago may own nothing yet.",
        ],
        cards: [
          { label: "Granted", value: "the total promised" },
          { label: "Vested", value: "earned, can be exercised" },
          { label: "Unvested", value: "still conditional" },
        ],
      },
      {
        id: "cliff",
        eyebrow: "The cliff",
        title: "A one-year cliff makes the first year all or nothing.",
        body: [
          "A cliff is a waiting period before anything vests. With a one-year cliff, nothing vests for the first twelve months. On the first anniversary of your vesting start date, a whole year's worth vests at once, usually 25% of a four-year grant.",
          "After the cliff, the rest usually vests in equal monthly or quarterly instalments. On a four-year grant with monthly vesting after the cliff, that is the remaining 75% spread over 36 months, about 2.08% of the grant each month.",
          "The cliff protects the company from giving equity to people who leave within weeks. For you, it means the first year carries the most risk: leave at month eleven and you usually walk away with no vested options at all.",
        ],
        cards: [
          { label: "Before month 12", value: "0 vested" },
          { label: "At month 12", value: "25% vests" },
          { label: "Month 13 onwards", value: "~2.08% a month" },
        ],
      },
      {
        id: "india-rule",
        eyebrow: "India",
        title: "Indian law sets a minimum of one year between grant and vesting.",
        body: [
          "For unlisted companies, the Companies (Share Capital and Debentures) Rules, 2014 require a minimum gap of one year between the grant of options and their vesting, with limited exceptions such as death or permanent incapacity. Listed companies follow SEBI's share-based employee benefits regulations, which also set a one-year minimum.",
          "In practice this means an Indian ESOP cannot vest in the first year after the grant date, whatever the offer letter implies. If a company promises immediate vesting, ask its CS how that fits the rules. The answer is usually that it is the grant date, not the joining date, that matters.",
          "Note the difference between the grant date and the vesting start date. Some companies set the vesting start date to your joining date, and only formally grant the options later, once the board or committee approves them. Check both dates on your grant letter.",
        ],
        warning:
          "This is a general explanation, not legal advice. Your company's ESOP scheme and grant letter control the actual terms. A company secretary or lawyer can confirm how they apply to you.",
      },
      {
        id: "example",
        eyebrow: "Worked example",
        title: "12,000 options over four years with a one-year cliff.",
        body: [
          "Say you are granted 12,000 options with a vesting start date of 1 April 2026, four-year vesting, a one-year cliff and monthly vesting after that.",
          "On 31 March 2027 you have 0 vested options. On 1 April 2027, 3,000 options vest (25%). From then, 250 more vest on the first of every month (9,000 options over 36 months). By 1 April 2028 you have 6,000 vested, by 1 April 2029 you have 9,000, and on 1 April 2030 the full 12,000 have vested.",
          "If you resigned on 15 October 2028, you would have 7,500 vested options (3,000 at the cliff plus 18 monthly instalments of 250), and the other 4,500 would normally lapse.",
        ],
        cards: [
          { label: "Year 1 end", value: "3,000 vested" },
          { label: "Year 2 end", value: "6,000 vested" },
          { label: "Year 3 end", value: "9,000 vested" },
          { label: "Year 4 end", value: "12,000 vested" },
        ],
      },
      {
        id: "other-schedules",
        eyebrow: "Variations",
        title: "Not every company uses the 4-year, 1-year-cliff pattern.",
        body: [
          "Schedules vary. Read your own documents rather than assuming the common pattern.",
        ],
        bullets: [
          "Yearly vesting: 25% vests on each anniversary. You earn nothing between anniversaries, so leaving one month before an anniversary costs a full year's tranche.",
          "Back-loaded vesting: for example 10%, 20%, 30%, 40% over four years. More of the value sits in the later years.",
          "Performance vesting: some or all options vest only if targets are met, such as revenue, a funding round or personal goals.",
          "Acceleration: some schemes vest unvested options early on an acquisition, sometimes only if you are also let go (double trigger). This is more common for senior hires.",
        ],
      },
      {
        id: "leaving",
        eyebrow: "Leaving",
        title: "When you leave, vested and unvested options are treated differently.",
        body: [
          "Unvested options usually lapse on your last working day and go back to the company's ESOP pool.",
          "Vested options normally remain yours, but only for an exercise window set by the scheme. That window can be anything from 30 days to several years, and some Indian schemes let you exercise only on a liquidity event. If you do not exercise in time, vested options can lapse too.",
          "Before you resign, find out three numbers: how many options are vested on your last day, how long you have to exercise them, and how much cash exercising would need, including any tax. Leaving a week after a vesting date rather than a week before it can be worth a whole tranche.",
        ],
      },
    ],
    personaViews: [
      { label: "Employee", value: "Know your vested count, your next vesting date and your exercise window before you compare offers or resign." },
      { label: "Founder", value: "A clear schedule with a worked example in the grant letter avoids most ESOP disputes later." },
      { label: "HR", value: "Show candidates a month-by-month vesting table, not only the scheme's legal wording." },
      { label: "CA / CS", value: "Check the grant date against the one-year minimum to vesting, and that the scheme's exercise window matches the grant letter." },
    ],
    checklist: [
      "Find your grant date and your vesting start date. They are often different.",
      "Check the total vesting period and the cliff length.",
      "Check how vesting continues after the cliff: monthly, quarterly or yearly.",
      "Check for performance conditions or acceleration on an acquisition.",
      "Find the exercise window for vested options after you leave.",
      "Work out how many options will be vested on any date you are considering leaving.",
    ],
    mistakes: [
      "Treating the full grant as yours from the first day.",
      "Resigning just before a cliff or a yearly vesting date.",
      "Ignoring the exercise window until after your last day.",
      "Assuming the vesting start date is the same as the grant date.",
    ],
    faq: [
      {
        question: "What is a vesting schedule in ESOP?",
        answer:
          "It is the timetable in your grant letter and the company's ESOP scheme that says how many of your options become vested, meaning yours to exercise, and on which dates.",
      },
      {
        question: "What is a one-year cliff?",
        answer:
          "Nothing vests for the first year. On the first anniversary of your vesting start date, a year's worth vests at once, usually 25% of a four-year grant, and the rest vests gradually afterwards.",
      },
      {
        question: "What does 1/48 monthly vesting with a 1-year cliff mean?",
        answer:
          "The grant vests over 48 months, one forty-eighth each month, but nothing vests until month 12. At the 12-month cliff, 12/48 (25%) vests at once. After that, 1/48 of the grant vests every month until month 48.",
      },
      {
        question: "If my ESOPs vest over 4 years, how much vests each year?",
        answer:
          "With a one-year cliff and monthly vesting after it: 25% at the end of year 1, then about 2.08% a month, so 50% by the end of year 2, 75% by year 3 and 100% by year 4. With yearly vesting, 25% vests on each anniversary instead.",
      },
      {
        question: "What does vesting date mean?",
        answer:
          "A vesting date is a date on which some of your options vest and become yours to exercise. The first is usually the first anniversary of your vesting start date (the cliff). After that there is a vesting date every month, quarter or year, depending on your schedule.",
      },
      {
        question: "What is the maximum vesting period for ESOPs in India?",
        answer:
          "Indian rules set a minimum of one year between grant and vesting, but no maximum. The company's ESOP scheme decides the period. Four years is the most common, and some companies use five.",
      },
      {
        question: "Can ESOPs vest in less than one year in India?",
        answer:
          "For unlisted companies, the Companies (Share Capital and Debentures) Rules require at least one year between grant and vesting, with limited exceptions. Listed companies follow SEBI rules with a similar one-year minimum.",
      },
      {
        question: "What does unvested ESOP mean?",
        answer:
          "Unvested options are the part of your grant you have not earned yet. You cannot exercise them, and they usually lapse if you leave before they vest.",
      },
      {
        question: "What happens to vested options when I resign?",
        answer:
          "They usually remain yours for an exercise window set in the scheme. If you do not exercise within that window, they can lapse. Some schemes only allow exercise at a liquidity event.",
      },
    ],
    related: [
      "leaving-startup-esop-options",
      "esop-exercise-cost",
      "what-is-an-esop",
    ],
  },
  "esop-valuation-india": {
    category: "Valuation",
    stage: "Understand value",
    audience: ["Founders", "CAs", "Employees"],
    readTime: "5 min read",
    videoTime: "3 min video",
    title: "ESOP valuation in India: FMV, merchant banker reports and fair value explained",
    description:
      "ESOP valuation in India has three different meanings: the merchant banker FMV used for tax, the price set for grants, and the fair value used in the company's accounts. What each is for, who does it and when you need it.",
    keywords: [
      "ESOP valuation",
      "ESOP valuation India",
      "ESOP FMV",
      "merchant banker valuation ESOP",
      "ESOP valuation for tax",
      "Black-Scholes ESOP valuation",
      "ESOP fair value accounting",
    ],
    icon: Landmark,
    quickAnswer: [
      "In India, “ESOP valuation” can mean three different things, and companies often need all three.",
      "Tax FMV: a Category I merchant banker values the share so the perquisite at exercise can be calculated. It must be as of the exercise date or up to 180 days before it.",
      "Grant pricing: the exercise price the company sets in its ESOP scheme, often face value or a discount to FMV.",
      "Accounting fair value: the value of each option for the company's books, usually from an option-pricing model such as Black-Scholes, which becomes an employee cost over the vesting period.",
    ],
    heroStats: [
      { label: "For tax", value: "merchant banker FMV" },
      { label: "Validity", value: "up to 180 days" },
      { label: "For accounts", value: "option fair value" },
      { label: "Common model", value: "Black-Scholes" },
    ],
    modelCards: [
      { label: "Tax FMV", value: "per share, at exercise" },
      { label: "Exercise price", value: "per share, at grant" },
      { label: "Fair value", value: "per option, for the books" },
    ],
    sections: [
      {
        id: "three-meanings",
        eyebrow: "The confusion",
        title: "Three valuations, three purposes.",
        body: [
          "Founders, employees and accountants often talk past each other about ESOP valuation because they mean different numbers. Separating them makes every other conversation easier.",
        ],
        cards: [
          { label: "Tax FMV", value: "how much salary tax at exercise" },
          { label: "Exercise price", value: "what employees pay" },
          { label: "Accounting fair value", value: "the ESOP cost in the P&L" },
        ],
      },
      {
        id: "tax-fmv",
        eyebrow: "1. Tax FMV",
        title: "The merchant banker FMV decides the tax when employees exercise.",
        body: [
          "When an employee exercises options, the gap between the fair market value of the share and the exercise price is taxed as a salary perquisite. The company deducts TDS on it.",
          "For shares that are not listed, the Income-tax Rules require the fair market value to be determined by a Category I merchant banker registered with SEBI, as of the exercise date or any date up to 180 days before it. For listed shares, the fair market value is based on the stock exchange price on the exercise date.",
          "This means an unlisted company needs a fresh merchant banker report whenever employees exercise more than 180 days after the last one. Employees will also want this number, because it decides their tax.",
        ],
        warning:
          "Valuation and tax requirements change from time to time. A chartered accountant or the merchant banker can confirm the current requirements for a specific company.",
      },
      {
        id: "grant-price",
        eyebrow: "2. Exercise price",
        title: "The exercise price is a company decision, not a valuation.",
        body: [
          "The exercise price is the amount employees pay per share. For unlisted companies, it is set in the ESOP scheme approved by shareholders, together with the formula for arriving at it.",
          "Many Indian startups set it at face value. Others use the latest fair market value or a discount to it. A valuation helps the board choose, but the exercise price itself is a policy choice, and it affects both employee upside and the accounting cost.",
        ],
      },
      {
        id: "accounting",
        eyebrow: "3. Accounting fair value",
        title: "The company's books record ESOPs as an employee cost.",
        body: [
          "Companies record share-based payments as an employee expense, spread over the vesting period. Companies following Ind AS apply Ind AS 102. Others generally follow the ICAI Guidance Note on Accounting for Share-based Payments.",
          "The expense is based on the fair value of each option on the grant date, not the share's value. This is usually estimated with an option-pricing model such as Black-Scholes, using the share's fair value, the exercise price, expected life, expected volatility, a risk-free rate and expected dividends.",
          "Auditors look closely at these inputs, especially volatility for an unlisted startup, which is usually taken from comparable listed companies.",
        ],
        cards: [
          { label: "Inputs", value: "share value, exercise price, life" },
          { label: "Also", value: "volatility, risk-free rate" },
          { label: "Expense", value: "spread over vesting" },
        ],
      },
      {
        id: "when",
        eyebrow: "When you need one",
        title: "Moments that usually call for a valuation.",
        body: [
          "If you run ESOPs, plan valuations around these events so they are not a scramble.",
        ],
        bullets: [
          "Before employees exercise, if the last merchant banker report is more than 180 days old.",
          "When setting or revising the exercise price for a new batch of grants.",
          "At year end, for the share-based payment expense in the accounts.",
          "Before a buyback, so the buyback price can be supported.",
          "After a priced funding round, which usually changes the fair value materially.",
        ],
      },
      {
        id: "employees",
        eyebrow: "For employees",
        title: "Which valuation should an employee care about?",
        body: [
          "Two of the three. The merchant banker FMV, because it decides your tax at exercise. And your exercise price, because it decides what you pay. The accounting fair value of an option matters to the company's books, not to your tax.",
          "Remember that none of these is a sale price. An unlisted share can only be turned into cash through a buyback, a secondary sale, an acquisition or an IPO, and the price there may be higher or lower than the last FMV.",
        ],
      },
    ],
    personaViews: [
      { label: "Founder", value: "Plan merchant banker reports around exercise windows and rounds, so employees are never blocked." },
      { label: "CA", value: "Keep the tax FMV and the accounting fair value clearly separate in your working papers." },
      { label: "Employee", value: "Ask for the latest FMV and its date. It drives the tax you pay when you exercise." },
      { label: "HR", value: "Publish the FMV used for each exercise window, so employees can plan the cash they need." },
    ],
    checklist: [
      "Know which of the three valuations you are discussing.",
      "Check the date of the latest merchant banker FMV report.",
      "Get a new report if exercises will happen more than 180 days later.",
      "Record the exercise price and its formula in the ESOP scheme.",
      "Agree option fair value inputs with auditors before year end.",
    ],
    mistakes: [
      "Using the funding round price per share as the tax FMV without a merchant banker report.",
      "Letting employees exercise on an FMV report older than 180 days.",
      "Confusing the value of a share with the fair value of an option.",
      "Treating any valuation as a guaranteed exit price.",
    ],
    faq: [
      {
        question: "Who can do ESOP valuation for tax in India?",
        answer: "For unlisted shares, a Category I merchant banker registered with SEBI determines the fair market value used to calculate the perquisite at exercise.",
      },
      {
        question: "How long is an ESOP FMV report valid?",
        answer: "The fair market value can be as of the exercise date or any date up to 180 days before it. Exercises after that need a newer valuation.",
      },
      {
        question: "Is Black-Scholes used for ESOP valuation in India?",
        answer: "Commonly, yes, for the fair value of options used in the company's accounts. It is not used for the tax FMV, which values the share rather than the option.",
      },
      {
        question: "Is ESOP valuation the same as a startup valuation?",
        answer: "No. A funding round sets a price for preference shares bought by investors. ESOP valuations value ordinary shares or options for tax and accounting, and are usually lower.",
      },
    ],
    related: [
      "esop-exercise-cost",
      "what-is-an-esop",
      "startup-raised-funding-dilution",
    ],
  },
  "cap-table-india": {
    category: "Cap table",
    stage: "Founder basics",
    audience: ["Founders", "CAs", "HR"],
    readTime: "5 min read",
    videoTime: "3 min video",
    title: "How to make a cap table for an Indian startup (with a free builder)",
    description:
      "A step-by-step guide to building your startup's cap table in India: equity, CCPS, ESOP pool, fully diluted ownership, modelling a funding round, the registers you must keep, and common mistakes. Includes a free cap table builder.",
    keywords: [
      "cap table",
      "cap table India",
      "how to make a cap table",
      "cap table template",
      "cap table calculator",
      "fully diluted ownership",
      "ESOP pool cap table",
      "option pool shuffle",
    ],
    icon: Layers3,
    quickAnswer: [
      "A cap table lists who owns what in your company: every shareholder, how many shares or convertible securities they hold, and their percentage.",
      "Show ownership on a fully diluted basis: count CCPS and CCDs as if converted, and include the whole ESOP pool, granted and unallocated.",
      "Model every round before you sign it. Investors usually want the ESOP pool topped up before their money comes in, so the dilution falls on existing holders.",
      "Your cap table must match the statutory records: the register of members, the ESOP register and the allotments filed with the RoC.",
    ],
    heroStats: [
      { label: "Shows", value: "who owns what" },
      { label: "Basis", value: "fully diluted" },
      { label: "Includes", value: "ESOP pool" },
      { label: "Must match", value: "statutory registers" },
    ],
    modelCards: [
      { label: "Rows", value: "every holder" },
      { label: "Columns", value: "security, shares, %" },
      { label: "Scenarios", value: "the next round" },
    ],
    sections: [
      {
        id: "what",
        eyebrow: "What it is",
        title: "A cap table is the single source of truth for ownership.",
        body: [
          "A capitalisation table, or cap table, is a table of everyone who owns a piece of the company: founders, angel and venture investors, employees with shares or options, and advisors. For each, it shows the type and number of securities they hold, and their percentage of the company.",
          "Investors ask for it in every round, acquirers ask for it in every deal, and employees with ESOPs depend on it being right. An error found during due diligence can delay a round by weeks.",
        ],
      },
      {
        id: "build",
        eyebrow: "Step by step",
        title: "How to build your first cap table.",
        body: [
          "Start from your incorporation documents and every allotment since. Do not start from memory.",
        ],
        bullets: [
          "List every shareholder and the date and number of shares in each allotment or transfer.",
          "Record the class of each security: equity shares, compulsorily convertible preference shares (CCPS), compulsorily convertible debentures (CCDs), warrants or convertible notes.",
          "Add the ESOP pool: the total reserved under your ESOP scheme, split into options granted and options still unallocated.",
          "Convert CCPS and CCDs at their current conversion ratio to get the fully diluted share count.",
          "Calculate each holder's percentage of the fully diluted total.",
          "Check the totals against the paid-up capital in your latest filings.",
        ],
      },
      {
        id: "fully-diluted",
        eyebrow: "Fully diluted",
        title: "Why “fully diluted” is the number that matters.",
        body: [
          "Percentages based only on equity shares overstate founders' ownership, because Indian investors usually hold CCPS that will convert into equity, and the ESOP pool will eventually be issued.",
          "Fully diluted ownership counts everything that can become equity: equity shares, preference shares and debentures as if converted, and the whole ESOP pool. This is the basis investors use to price rounds, and the basis employees should use to understand what their options represent.",
        ],
        cards: [
          { label: "Equity only", value: "overstates founders" },
          { label: "Fully diluted", value: "what investors use" },
          { label: "Includes", value: "CCPS, CCDs, pool" },
        ],
      },
      {
        id: "round",
        eyebrow: "Modelling a round",
        title: "Model the round, including the ESOP top-up, before you sign.",
        body: [
          "In a priced round, the price per share is the pre-money valuation divided by the fully diluted shares before the round. The investor's percentage after the round is the amount invested divided by the post-money valuation.",
          "Investors often ask for the ESOP pool to be increased to a target size, say 10% to 15% after the round, and for the extra options to be counted in the pre-money. This is often called the option pool shuffle. It lowers the price per share and moves the dilution from the new investor onto existing shareholders.",
          "For example, raising ₹5 crore at a ₹20 crore pre-money gives the investor 20%. If the pool must also reach 12% afterwards, founders who held 80% before the round can end up near 60%, not the 64% they might expect.",
        ],
      },
      {
        id: "records",
        eyebrow: "Compliance",
        title: "Your cap table must match your statutory records.",
        body: [
          "A spreadsheet cap table is a working tool. The legal record is the company's statutory registers and filings, and the two must agree.",
        ],
        bullets: [
          "Register of members, which lists every shareholder.",
          "Register of employee stock options, which records grants, vesting, exercise and lapse.",
          "Return of allotment (PAS-3) filed with the RoC after shares are allotted, including on ESOP exercise.",
          "Board and shareholder resolutions for each allotment, transfer and ESOP grant.",
        ],
        warning:
          "Your company secretary maintains the statutory registers and filings. Reconcile your cap table with them after every allotment.",
      },
      {
        id: "tools",
        eyebrow: "Tools",
        title: "Spreadsheet, free builder or ESOP software.",
        body: [
          "A spreadsheet works for a very early company, but breaks once you have convertibles, an ESOP pool and several rounds. Formula errors are the most common cap table problem in due diligence.",
          "You can model your cap table and your next round for free with our cap table builder, without an account. When you need a dated record of every allotment, an ESOP register and a grant page for each employee, a dedicated ESOP system such as the EVC Startup plan keeps it all in one place.",
        ],
      },
    ],
    personaViews: [
      { label: "Founder", value: "Model every round, including the pool top-up, before you agree a term sheet." },
      { label: "CA / CS", value: "Reconcile the cap table with the registers and PAS-3 filings after every allotment." },
      { label: "Investor", value: "A clean, fully diluted cap table speeds up due diligence." },
      { label: "Employee", value: "Your options only mean something as a percentage of the fully diluted total." },
    ],
    checklist: [
      "Collect every allotment and transfer since incorporation.",
      "Record the class and conversion terms of every security.",
      "Add the ESOP pool, granted and unallocated.",
      "Calculate fully diluted percentages.",
      "Model the next round with the pool top-up.",
      "Reconcile with the register of members and RoC filings.",
    ],
    mistakes: [
      "Leaving the ESOP pool out of the percentages.",
      "Showing CCPS holders at their pre-conversion share count.",
      "Ignoring the pool top-up when negotiating valuation.",
      "Letting the spreadsheet drift away from the statutory registers.",
    ],
    faq: [
      {
        question: "What is a cap table?",
        answer: "A table that lists every shareholder in a company, the securities they hold and their percentage ownership, usually on a fully diluted basis.",
      },
      {
        question: "Should the ESOP pool be in the cap table?",
        answer: "Yes. Include the whole pool, both granted and unallocated options, so percentages reflect full dilution.",
      },
      {
        question: "What is the option pool shuffle?",
        answer:
          "When investors require the ESOP pool to be increased before their investment, so the new options dilute existing shareholders rather than the new investor.",
      },
      {
        question: "Is there a free cap table tool?",
        answer: "Yes. ESOP Value Clarity's cap table builder is free without an account and lets you model a funding round. Exporting to CSV needs a free account.",
      },
    ],
    related: [
      "startup-raised-funding-dilution",
      "dilution-explained",
      "esop-valuation-india",
    ],
  },
} satisfies Record<string, ArticleWithMeta>;

/* ============================================================
   New articles: one JSON file each in content/articles/.
   See lib/blog-content.ts. The articles above win on a clash.
============================================================ */

type ArticleWithMeta = Article & {
  publishedAt?: string;
  updatedAt?: string;
  sources?: { title: string; url: string }[];
};

const CONTENT_ICONS: Record<ContentArticleIcon, LucideIcon> = {
  BriefcaseBusiness,
  Calculator,
  FileSearch,
  Gauge,
  Landmark,
  Layers3,
  LineChart,
  Percent,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
  WalletCards,
};

function fromContentArticle(a: ContentArticle): ArticleWithMeta {
  return {
    category: a.category,
    stage: a.stage,
    audience: a.audience,
    readTime: a.readTime,
    videoTime: a.videoTime,
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    icon: CONTENT_ICONS[a.icon] ?? BookOpen,
    quickAnswer: a.quickAnswer,
    heroStats: a.heroStats,
    modelCards: a.modelCards,
    sections: a.sections,
    personaViews: a.personaViews,
    checklist: a.checklist,
    mistakes: a.mistakes,
    faq: a.faq,
    related: a.related,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    sources: a.sources,
  };
}

const allArticles: Record<string, ArticleWithMeta> = {
  ...Object.fromEntries(
    getContentArticles().map((a) => [a.slug, fromContentArticle(a)]),
  ),
  ...articles,
};

// Every article is known at build time; anything else is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(allArticles).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = allArticles[slug];

  if (!article) {
    return {
      title: "Article Not Found | ESOP Value Clarity",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = `${BASE_URL}/blog/${slug}`;

  return {
    metadataBase: new URL(BASE_URL),

    title: article.title,

    description: article.description,

    keywords: article.keywords,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: canonicalUrl,
      siteName: SITE_NAME,
      publishedTime: article.publishedAt ?? PUBLISHED_DATE,
      modifiedTime: article.updatedAt ?? UPDATED_DATE,
      authors: [AUTHOR_NAME],

      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/og-image.png"],
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = allArticles[slug];

  if (!article) notFound();

  const currentUrl = `${BASE_URL}/blog/${slug}`;

  const relatedArticles = article.related
    .map(
      (relatedSlug) =>
        [
          relatedSlug,
          allArticles[relatedSlug],
        ] as const,
    )
    .filter(([, relatedArticle]) => Boolean(relatedArticle));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",

    headline: article.title,

    description: article.description,

    datePublished: article.publishedAt ?? PUBLISHED_DATE,
    dateModified: article.updatedAt ?? UPDATED_DATE,

    inLanguage: "en-IN",

    author: {
      "@type": "Person",

      name: AUTHOR_NAME,

      url: AUTHOR_LINKEDIN,

      sameAs: [AUTHOR_LINKEDIN],
    },

    publisher: {
      "@type": "Organization",

      name: SITE_NAME,

      url: BASE_URL,

      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl,
    },

    image: [`${BASE_URL}/og-image.png`],

    keywords: article.keywords.join(", "),

    articleSection: article.category,

    isPartOf: {
      "@type": "CollectionPage",
      name: "Equity Intelligence Hub",
      url: `${BASE_URL}/blog`,
    },

    about: [
      "Employee stock options",
      "Startup equity",
      "Equity compensation",
      "ESOP decision making",
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: article.faq.map((item) => ({
      "@type": "Question",

      name: item.question,

      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const videoJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",

    name: `${article.title} | ESOP Value Clarity`,

    description:
      "Founder-led explanation of ESOP and startup equity decision making from ESOP Value Clarity.",

    thumbnailUrl: [
      `https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`,
    ],

    uploadDate: VIDEO_UPLOAD_DATE,

    embedUrl: `https://www.youtube.com/embed/${YOUTUBE_ID}`,

    contentUrl: YOUTUBE_URL,

    publisher: {
      "@type": "Organization",

      name: SITE_NAME,

      url: BASE_URL,

      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },

    creator: {
      "@type": "Person",

      name: AUTHOR_NAME,

      url: AUTHOR_LINKEDIN,

      sameAs: [AUTHOR_LINKEDIN],
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",

        position: 1,

        name: "Home",

        item: BASE_URL,
      },

      {
        "@type": "ListItem",

        position: 2,

        name: "Equity Intelligence Hub",

        item: `${BASE_URL}/blog`,
      },

      {
        "@type": "ListItem",

        position: 3,

        name: article.title,

        item: currentUrl,
      },
    ],
  };

  const Icon = article.icon;

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F9FC] text-[#0f172a]">
      {/* ============================================================
          STRUCTURED DATA
      ============================================================ */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(videoJsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      {/* ============================================================
          ARTICLE HERO
      ============================================================ */}

      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-[#020d1f] text-white">
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#94a3b8] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            All ESOP guides
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F2B421]/25 bg-[#F2B421]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FCE3A3]">
                  <Icon className="h-3.5 w-3.5" />

                  {article.category}
                </span>

                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8]">
                  <Clock3 className="h-3.5 w-3.5" />

                  {article.readTime}
                </span>

                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8]">
                  <PlayCircle className="h-3.5 w-3.5" />

                  {article.videoTime}
                </span>
              </div>

              <h1 className="mt-7 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                {article.title}
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#CBD5E1]">
                {article.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {article.audience.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Author signal */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-bold text-white">
                  S
                </div>

                <div>
                  <p className="text-xs font-bold text-white">
                    {AUTHOR_NAME}
                  </p>

                  <p className="text-[10px] font-medium text-[#94a3b8]">
                    Founder, ESOP Value Clarity
                  </p>
                </div>
              </div>
            </div>

            {/* Quick answer */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#042653]/85 shadow-[0_45px_120px_-40px_rgba(0,0,0,.9)] backdrop-blur-xl">
                <div className="border-b border-white/[0.08] px-6 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F2B421]">
                    Quick answer
                  </p>
                </div>

                <div className="space-y-3 p-6">
                  {article.quickAnswer.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2B421]/10 text-[10px] font-bold text-[#F2B421]">
                        0{index + 1}
                      </span>

                      <p className="text-sm leading-6 text-[#CBD5E1]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero metrics */}
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {article.heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.055] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.085]"
              >
                <p className="text-xl font-bold tracking-tight text-white">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs font-semibold text-[#94a3b8]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ARTICLE BODY
      ============================================================ */}

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-20 lg:grid-cols-[250px_minmax(0,780px)_240px] lg:justify-center">
        {/* LEFT TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-[24px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#B7800E]">
              On this page
            </p>

            <nav className="mt-4 space-y-1">
              {article.sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-xs font-bold text-[#64748b] transition hover:translate-x-1 hover:bg-[#F7F9FC] hover:text-[#0f172a]"
                >
                  <span className="font-mono text-[9px] font-bold text-[#94a3b8] group-hover:text-[#B7800E]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN ARTICLE */}
        <article className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {article.modelCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B7800E]">
                  {card.label}
                </p>

                <p className="mt-3 text-lg font-bold tracking-tight text-[#0f172a]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 space-y-16">
            {article.sections.map((section) => (
              <ArticleSection
                key={section.id}
                section={section}
              />
            ))}
          </div>

          <VideoBlock />

          <PersonaViews
            views={article.personaViews}
          />

          <DecisionChecklist
            items={article.checklist}
          />

          <MistakesBlock
            items={article.mistakes}
          />

          <FaqBlock
            items={article.faq}
          />

          {article.sources && article.sources.length > 0 && (
            <SourcesBlock items={article.sources} />
          )}

          <EducationalNotice />

          <ProductCta
            articleTitle={article.title}
          />

          <RelatedArticles
            articles={relatedArticles}
          />
        </article>

        {/* RIGHT SIDE */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <Link
              href="/simulator"
              className="group block rounded-[24px] bg-[#020d1f] p-5 text-white shadow-lg shadow-[#E2E8F0] transition duration-300 hover:-translate-y-1 hover:bg-[#042653]"
            >
              <Calculator className="h-5 w-5 text-[#F2B421]" />

              <p className="mt-4 text-sm font-bold">
                Model your own ESOP
              </p>

              <p className="mt-2 text-[11px] leading-5 text-[#94a3b8]">
                Move from reading to your own scenario.
              </p>

              <ArrowRight className="mt-5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}

function VideoBlock() {
  return (
    <section className="mt-16 overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-sm">
      <div className="aspect-video w-full bg-[#020d1f]">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
          title="ESOP Value Clarity walkthrough"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
            <PlayCircle className="h-4 w-4 text-[#B7800E]" />
            Prefer to watch?
          </p>

          <p className="mt-1 text-sm leading-6 text-[#475569]">
            A short walkthrough of how ESOP Value Clarity works out what your ESOPs are worth.
          </p>
        </div>

        <a
          href={YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#B7800E] hover:text-[#8A5A00]"
        >
          Open on YouTube
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function ArticleSection({
  section,
}: {
  section: Section;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-10"
    >
      {section.eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
          {section.eyebrow}
        </p>
      )}

      <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#0f172a] md:text-4xl">
        {section.title}
      </h2>

      <div className="mt-6 space-y-5">
        {section.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[17px] leading-8 text-[#334155]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {section.cards && (
        <div
          className={`mt-8 grid gap-4 ${
            section.cards.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {section.cards.map((card) => (
            <div
              key={card.label}
              className="rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B7800E]">
                {card.label}
              </p>

              <p
                className={
                  card.value.length > 40
                    ? "mt-3 text-[15px] leading-7 text-[#475569]"
                    : "mt-3 text-xl font-bold tracking-tight text-[#0f172a]"
                }
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {section.bullets && (
        <div className="mt-8 rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {section.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex gap-3 text-sm font-semibold leading-6 text-[#64748b]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B7800E]" />

                {bullet}
              </div>
            ))}
          </div>
        </div>
      )}

      {section.warning && (
        <div className="mt-8 rounded-[24px] border border-[#FCE3A3] bg-[#FFF8E6] p-6">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#B7800E]" />

            <p className="text-sm font-semibold leading-7 text-[#64748b]">
              {section.warning}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function PersonaViews({
  views,
}: {
  views: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <section className="mt-20 rounded-[30px] border border-[#E2E8F0] bg-white p-6 shadow-sm md:p-8">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
        <UsersRound className="h-4 w-4" />
        Why this matters to each reader
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {views.map((view) => (
          <div
            key={view.label}
            className="rounded-[22px] border border-[#E2E8F0] bg-[#F7F9FC] p-5"
          >
            <p className="text-sm font-bold text-[#0f172a]">
              {view.label}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#475569]">
              {view.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionChecklist({
  items,
}: {
  items: string[];
}) {
  return (
    <section className="mt-16 rounded-[30px] border border-[#E2E8F0] bg-[#ffffff] p-6 md:p-8">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
        <FileSearch className="h-4 w-4" />
        Decision checklist
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E6] text-[10px] font-bold text-[#B7800E]">
              {String(index + 1).padStart(2, "0")}
            </span>

            <p className="text-sm font-semibold leading-6 text-[#64748b]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MistakesBlock({
  items,
}: {
  items: string[];
}) {
  return (
    <section className="mt-16 rounded-[30px] border border-[#fecdd3] bg-[#fff1f2] p-6 md:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#be123c]">
        Common mistakes
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#fecdd3] bg-white/70 p-4 text-sm font-semibold leading-6 text-[#7f1d1d]"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({
  items,
}: {
  items: {
    question: string;
    answer: string;
  }[];
}) {
  return (
    <section className="mt-16">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
        FAQ
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-sm"
          >
            <summary className="cursor-pointer list-none text-base font-bold text-[#0f172a] marker:hidden">
              <span className="flex items-center justify-between gap-5">
                {item.question}

                <ArrowRight className="h-4 w-4 shrink-0 text-[#B7800E] transition group-open:rotate-90" />
              </span>
            </summary>

            <p className="mt-4 text-sm leading-7 text-[#475569]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SourcesBlock({
  items,
}: {
  items: { title: string; url: string }[];
}) {
  return (
    <section className="mt-16">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
        Sources
      </p>

      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-7 text-[#475569]">
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#B7800E] underline-offset-4 hover:underline"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EducationalNotice() {
  return (
    <div className="mt-16 rounded-[24px] border border-[#FCE3A3] bg-[#FFF8E6] p-6">
      <div className="flex items-start gap-4">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#B7800E]" />

        <div>
          <p className="font-bold text-[#0f172a]">
            Educational content
          </p>

          <p className="mt-2 text-sm leading-7 text-[#64748b]">
            This guide explains general equity concepts and is not
            financial, investment, legal, employment or tax advice.
            Company plans and individual circumstances differ. Use
            official documents and appropriate professional advice
            for material decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCta({
  articleTitle,
}: {
  articleTitle: string;
}) {
  return (
    <section className="relative mt-16 overflow-hidden rounded-[32px] bg-[#020d1f] p-8 text-white md:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#B7800E]/20 blur-[80px]" />

      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#F2B421]/25 bg-[#F2B421]/10 text-[#F2B421]">
          <Calculator className="h-5 w-5" />
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2B421]">
          Knowledge to modelling
        </p>

        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
          Apply this guide to your own ESOP assumptions.
        </h2>

        <p className="mt-5 max-w-2xl leading-7 text-[#CBD5E1]">
          Use ESOP Value Clarity to connect grant size, vesting,
          exercise cost, dilution and exit scenarios instead of
          relying on a headline number from "{articleTitle}".
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/simulator"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B7800E] px-6 text-sm font-bold text-white transition hover:bg-[#F2B421]"
          >
            Open ESOP Simulator

            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pro/offers/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.07] px-5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
          >
            Try Offer Intelligence

            <BookOpen className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function RelatedArticles({
  articles: relatedArticles,
}: {
  articles: readonly (readonly [string, ArticleWithMeta])[];
}) {
  if (!relatedArticles.length) return null;

  return (
    <section className="mt-20">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7800E]">
            Continue learning
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a]">
            Related equity decisions
          </h2>
        </div>

        <Link
          href="/blog"
          className="group hidden items-center gap-2 text-sm font-bold text-[#B7800E] md:flex"
        >
          View hub

          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {relatedArticles.map(
          ([relatedSlug, relatedArticle]) => {
            const Icon = relatedArticle.icon;

            return (
              <Link
                key={relatedSlug}
                href={`/blog/${relatedSlug}`}
                className="group relative overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white p-6 transition duration-500 hover:-translate-y-2 hover:border-[#B7800E] hover:shadow-[0_25px_70px_-45px_rgba(37,99,235,.30)]"
              >
                <Icon className="h-5 w-5 text-[#B7800E]" />

                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B7800E]">
                  {relatedArticle.category}
                </p>

                <h3 className="mt-3 text-lg font-bold leading-6 text-[#0f172a]">
                  {relatedArticle.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-xs leading-6 text-[#475569]">
                  {relatedArticle.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                  <span className="text-xs font-bold text-[#475569]">
                    {relatedArticle.readTime}
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E8F0] transition duration-300 group-hover:translate-x-1 group-hover:border-[#B7800E] group-hover:bg-[#B7800E] group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          },
        )}
      </div>
    </section>
  );
}