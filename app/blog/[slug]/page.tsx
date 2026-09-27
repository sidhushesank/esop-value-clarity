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

const BASE_URL = "https://esopvalueclarity.com";
const SITE_NAME = "ESOP Value Clarity";

const AUTHOR_NAME = "Sheshank Sidheshwar";

const AUTHOR_LINKEDIN =
  "https://www.linkedin.com/in/sheshank-sidheshwar-b84166252/";

const PUBLISHED_DATE = "2026-09-16";
const UPDATED_DATE = "2026-09-16";

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
    readTime: "12 min read",
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
    readTime: "11 min read",
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
    stage: "I may exercise",
    audience: ["Employees", "CAs", "Tax"],
    readTime: "10 min read",
    videoTime: "3 min video",
    title: "How much cash do I need to exercise my ESOPs?",
    description:
      "Understand strike price, vested options, exercise cost and why stock options can create a real cash decision before any liquidity happens.",
    keywords: [
      "ESOP exercise cost",
      "ESOP strike price",
      "exercise stock options India",
      "vested options exercise",
    ],
    icon: WalletCards,
    quickAnswer: [
      "Exercise cost is usually vested options multiplied by strike price.",
      "That cost is separate from taxes, transaction charges and the possibility that shares remain illiquid.",
      "The decision should be modelled before leaving a company because exercise windows can be short.",
    ],
    heroStats: [
      { label: "Formula", value: "vested x strike" },
      { label: "Risk", value: "cash before liquidity" },
      { label: "Timing", value: "exercise window" },
      { label: "Tax", value: "ask advisor" },
    ],
    modelCards: [
      {
        label: "Vested options",
        value: "Only exercisable portion matters",
      },
      {
        label: "Strike price",
        value: "Cash paid per option",
      },
      {
        label: "Liquidity",
        value: "Not guaranteed after exercise",
      },
    ],
    sections: [
      {
        id: "formula",
        eyebrow: "The basic math",
        title:
          "Start with a simple formula, then add the complications.",
        body: [
          "At the simplest level, exercise cost equals the number of vested options you choose to exercise multiplied by the exercise or strike price per option.",
          "If 10,000 options have vested and the strike price is ₹50, the basic exercise cost is ₹5,00,000. That is before taxes, paperwork costs or any company-specific rules.",
        ],
        cards: [
          {
            label: "10,000 vested",
            value: "options available to exercise",
          },
          {
            label: "₹50 strike",
            value: "cash required per option",
          },
          {
            label: "₹5,00,000",
            value: "basic exercise cost",
          },
        ],
      },
      {
        id: "why-it-hurts",
        eyebrow: "The real issue",
        title:
          "The painful part is paying cash for something you may not be able to sell.",
        body: [
          "Private-company shares can remain illiquid even after exercise. That means the employee may pay cash today while the ability to sell depends on a future buyback, secondary sale, acquisition, IPO or company-approved transfer.",
          "This is why exercise decisions should be treated as personal finance decisions, not just compensation mechanics.",
        ],
        warning:
          "Do not exercise solely because a paper spread looks positive. Check tax, liquidity, company risk and your personal cash position.",
      },
      {
        id: "leaving-window",
        eyebrow: "Leaving company",
        title:
          "Exercise windows can turn a future decision into an urgent one.",
        body: [
          "Many plans limit how long vested options can be exercised after employment ends. If the window is short, an employee may need to make a large cash decision soon after resigning or being terminated.",
        ],
        bullets: [
          "Confirm the post-termination exercise window.",
          "Calculate cash needed for different exercise amounts.",
          "Check whether partial exercise is allowed.",
          "Get tax advice before committing cash.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Never wait until the last week of your exercise window to calculate cash required.",
      },
      {
        label: "Founder",
        value:
          "Clear exercise-window communication avoids employee distrust later.",
      },
      {
        label: "HR",
        value:
          "Leaving checklists should include vested options, deadline and exercise-cost education.",
      },
      {
        label: "CA",
        value:
          "Exercise decisions can create tax and cash-flow issues even without liquidity.",
      },
    ],
    checklist: [
      "Find vested option count.",
      "Confirm strike price per option.",
      "Calculate full and partial exercise costs.",
      "Check tax treatment with a professional.",
      "Confirm liquidity restrictions.",
      "Check final exercise deadline in writing.",
    ],
    mistakes: [
      "Calculating exercise cost using total granted options instead of vested options.",
      "Forgetting taxes and charges.",
      "Exercising without understanding liquidity restrictions.",
    ],
    faq: [
      {
        question: "Do I need to exercise all vested options?",
        answer:
          "Not always. Some plans may allow partial exercise, but the plan and grant documents control what is allowed.",
      },
      {
        question: "Is exercise cost the same as tax?",
        answer:
          "No. Exercise cost is the cash paid to acquire shares. Tax treatment is separate and depends on jurisdiction and circumstances.",
      },
    ],
    related: [
      "leaving-startup-esop-options",
      "what-is-an-esop",
      "vesting-schedule",
    ],
  },

  "leaving-startup-esop-options": {
    category: "Leaving company",
    stage: "I am leaving",
    audience: ["Employees", "HR", "CAs"],
    readTime: "13 min read",
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
    readTime: "12 min read",
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
    readTime: "14 min read",
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
    audience: ["Employees", "Founders", "HR", "CAs"],
    readTime: "10 min read",
    videoTime: "3 min video",
    title:
      "What is an ESOP? The practical version employees actually need",
    description:
      "A decision-oriented explanation of employee stock options, strike price, vesting, ownership, dilution, liquidity and tax context.",
    keywords: [
      "what is ESOP",
      "ESOP meaning",
      "employee stock options",
      "startup ESOP",
      "ESOP India",
    ],
    icon: GraduationCap,
    quickAnswer: [
      "An ESOP option grant usually gives an employee a right to buy shares later at a defined strike price, subject to plan terms.",
      "The economic value depends on vesting, exercise price, ownership percentage, dilution, liquidity and taxes.",
      "An ESOP should not be valued like salary because the outcome is uncertain and conditional.",
    ],
    heroStats: [
      { label: "Grant", value: "right" },
      { label: "Vesting", value: "time" },
      { label: "Exercise", value: "cash" },
      { label: "Value", value: "scenario" },
    ],
    modelCards: [
      {
        label: "Known terms",
        value: "grant, strike, vesting",
      },
      {
        label: "Assumptions",
        value: "value, dilution, exit",
      },
      {
        label: "Outcome",
        value: "not guaranteed",
      },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Definition that matters",
        title:
          "An ESOP is not cash. It is a conditional ownership opportunity.",
        body: [
          "In many startup compensation plans, ESOPs are delivered as options: the right to buy company shares later at a predetermined exercise or strike price, after vesting and subject to the plan documents.",
          "That makes an ESOP different from salary. Salary is paid in cash. Options may become valuable only if the company value exceeds the strike price and liquidity becomes available.",
        ],
      },
      {
        id: "lifecycle",
        eyebrow: "Lifecycle",
        title:
          "The ESOP journey moves through grant, vesting, exercise and liquidity.",
        body: [
          "First the company grants options. Then the options vest over time. After vesting, the employee may be able to exercise by paying the strike price. Eventually, value can be realised only if liquidity becomes possible.",
        ],
        cards: [
          { label: "Grant", value: "Options awarded" },
          { label: "Vest", value: "Earned over time" },
          { label: "Exercise", value: "Pay strike price" },
          { label: "Liquidity", value: "Sell if permitted" },
        ],
      },
      {
        id: "terms",
        eyebrow: "Terms to know",
        title:
          "The important ESOP terms are the ones that change your decision.",
        body: [
          "A useful explanation should not stop at vocabulary. Each term matters because it changes either ownership, cash requirement, timing, risk or eventual take-home value.",
        ],
        bullets: [
          "Option count: the number granted.",
          "Strike price: cash needed per option to exercise.",
          "Vesting schedule: when options are earned.",
          "Ownership percentage: what the grant represents.",
          "Dilution: how future share issuance can reduce percentage.",
          "Liquidity: whether shares can actually be sold.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Learn enough to ask better questions before accepting or exercising.",
      },
      {
        label: "Founder",
        value:
          "Explain ESOPs as uncertainty with upside, not guaranteed wealth.",
      },
      {
        label: "HR",
        value:
          "Use a consistent vocabulary to reduce repeated candidate confusion.",
      },
      {
        label: "CA",
        value:
          "The practical discussion begins when exercise and tax events appear.",
      },
    ],
    checklist: [
      "Identify the number of options.",
      "Confirm the strike price.",
      "Understand vesting and cliff.",
      "Estimate ownership percentage if possible.",
      "Model dilution and exit scenarios.",
      "Check tax and liquidity before decisions.",
    ],
    mistakes: [
      "Thinking options are already shares.",
      "Ignoring exercise price.",
      "Assuming paper value is cash.",
    ],
    faq: [
      {
        question: "Is ESOP the same as shares?",
        answer:
          "Not necessarily. Options usually provide a right to acquire shares after vesting and exercise, subject to plan terms.",
      },
      {
        question: "Can ESOPs become worthless?",
        answer:
          "Yes. If company value does not exceed strike price, liquidity never happens or terms are unfavorable, the economic outcome may be poor.",
      },
    ],
    related: [
      "startup-offered-25000-esops",
      "vesting-schedule",
      "dilution-explained",
    ],
  },

  "esop-vs-rsu": {
    category: "Equity types",
    stage: "Compare equity",
    audience: ["Employees", "HR", "CAs"],
    readTime: "11 min read",
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
    readTime: "12 min read",
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
    readTime: "10 min read",
    videoTime: "3 min video",
    title:
      "ESOP vesting schedule: granted is not the same as earned",
    description:
      "Understand cliffs, monthly vesting, vested options, unvested options and how timing changes the value of a stock-option grant.",
    keywords: [
      "ESOP vesting",
      "vesting schedule",
      "one year cliff",
      "vested options",
      "unvested options",
    ],
    icon: Clock3,
    quickAnswer: [
      "Vesting determines when the employee earns portions of the grant.",
      "A four-year schedule with a one-year cliff is common, but documents control the actual terms.",
      "Granted options are not the same as vested options, especially if you may leave early.",
    ],
    heroStats: [
      { label: "Granted", value: "headline" },
      { label: "Vested", value: "earned" },
      { label: "Cliff", value: "first gate" },
      { label: "Leaving", value: "critical" },
    ],
    modelCards: [
      { label: "Year 1", value: "cliff risk" },
      { label: "Years 2-4", value: "gradual vesting" },
      { label: "Exit", value: "unvested may lapse" },
    ],
    sections: [
      {
        id: "meaning",
        eyebrow: "Meaning",
        title:
          "Vesting turns a grant into an earned right over time.",
        body: [
          "Receiving 10,000 options does not usually mean all 10,000 are immediately available to exercise. The vesting schedule defines how much becomes vested and when.",
        ],
      },
      {
        id: "cliff",
        eyebrow: "Cliff",
        title:
          "A one-year cliff can make the first year binary.",
        body: [
          "Under a common one-year cliff, no options vest before the first anniversary. At the cliff, a first portion may vest, with the remainder vesting monthly or quarterly afterwards.",
        ],
        cards: [
          { label: "Before cliff", value: "0% may be vested" },
          { label: "At cliff", value: "25% may vest" },
          { label: "After cliff", value: "monthly or quarterly" },
        ],
      },
      {
        id: "leaving",
        eyebrow: "Leaving risk",
        title:
          "Vesting matters most when employment changes.",
        body: [
          "If you leave before vesting, unvested options are commonly forfeited. If you leave after options vest, the post-termination exercise window becomes the next important rule.",
        ],
      },
    ],
    personaViews: [
      {
        label: "Employee",
        value:
          "Know how much is actually vested before comparing offers or resigning.",
      },
      {
        label: "Founder",
        value:
          "Vesting protects the company but must be explained clearly.",
      },
      {
        label: "HR",
        value:
          "Candidates need examples, not only plan language.",
      },
      {
        label: "Advisor",
        value:
          "Timing determines whether options can be exercised at all.",
      },
    ],
    checklist: [
      "Check total vesting duration.",
      "Confirm cliff length and cliff percentage.",
      "Check monthly, quarterly or annual vesting after cliff.",
      "Confirm vesting start date.",
      "Understand what happens when employment ends.",
    ],
    mistakes: [
      "Treating granted as vested.",
      "Ignoring cliff risk.",
      "Forgetting exercise window after leaving.",
    ],
    faq: [
      {
        question: "What is a one-year cliff?",
        answer:
          "It means the first vesting event may happen only after completing one year, subject to the grant terms.",
      },
      {
        question:
          "What happens to unvested options when I leave?",
        answer:
          "They are commonly forfeited unless the documents provide special treatment such as acceleration.",
      },
    ],
    related: [
      "leaving-startup-esop-options",
      "what-is-an-esop",
      "startup-offered-25000-esops",
    ],
  },
} satisfies Record<string, Article>;

type Slug = keyof typeof articles;

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug as Slug];

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

    title: `${article.title} | ESOP Value Clarity`,

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
      publishedTime: PUBLISHED_DATE,
      modifiedTime: UPDATED_DATE,
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

  const article = articles[slug as Slug];

  if (!article) notFound();

  const currentUrl = `${BASE_URL}/blog/${slug}`;

  const relatedArticles = article.related
    .map(
      (relatedSlug) =>
        [
          relatedSlug,
          articles[relatedSlug as Slug],
        ] as const,
    )
    .filter(([, relatedArticle]) => Boolean(relatedArticle));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",

    headline: article.title,

    description: article.description,

    datePublished: PUBLISHED_DATE,
    dateModified: UPDATED_DATE,

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
        url: `${BASE_URL}/og-image.png`,
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

    uploadDate: UPDATED_DATE,

    embedUrl: `https://www.youtube.com/embed/${YOUTUBE_ID}`,

    contentUrl: YOUTUBE_URL,

    publisher: {
      "@type": "Organization",

      name: SITE_NAME,

      url: BASE_URL,

      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/og-image.png`,
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
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#0f172a]">
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

      <section className="relative overflow-hidden border-b border-[#dbe5f0] bg-[#030817] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
          }}
        />

        <div className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-[#2563eb]/20 blur-[150px]" />

        <div className="pointer-events-none absolute -right-40 top-[-180px] h-[620px] w-[620px] rounded-full bg-[#94a3b8]/15 blur-[160px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-black text-[#94a3b8] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Equity Intelligence Hub
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/25 bg-[#3b82f6]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#bfdbfe]">
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

              <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] text-white md:text-6xl lg:text-[64px]">
                {article.title}
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#dbeafe]">
                {article.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {article.audience.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#94a3b8]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Author signal */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-black text-white">
                  S
                </div>

                <div>
                  <p className="text-xs font-black text-white">
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
              <div className="absolute -inset-8 rounded-full bg-[#2563eb]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#06101f]/85 shadow-[0_45px_120px_-40px_rgba(0,0,0,.9)] backdrop-blur-xl">
                <div className="border-b border-white/[0.08] px-6 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#60a5fa]">
                    3-minute answer
                  </p>
                </div>

                <div className="space-y-3 p-6">
                  {article.quickAnswer.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/10 text-[10px] font-black text-[#60a5fa]">
                        0{index + 1}
                      </span>

                      <p className="text-sm leading-6 text-[#dbeafe]">
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
                <p className="text-xl font-black tracking-tight text-white">
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
          <div className="sticky top-8 rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#1d4ed8]">
              In this decision
            </p>

            <nav className="mt-4 space-y-1">
              {article.sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-xs font-bold text-[#64748b] transition hover:translate-x-1 hover:bg-[#f7f9fc] hover:text-[#0f172a]"
                >
                  <span className="font-mono text-[9px] font-black text-[#94a3b8] group-hover:text-[#2563eb]">
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
          <VideoBlock
            articleTitle={article.title}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {article.modelCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563eb]">
                  {card.label}
                </p>

                <p className="mt-3 text-lg font-black tracking-[-0.03em] text-[#0f172a]">
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
            <div className="rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#1d4ed8]">
                Article principles
              </p>

              <div className="mt-5 space-y-4">
                {[
                  [
                    ShieldCheck,
                    "Known terms",
                    "Separate facts",
                  ],
                  [
                    Gauge,
                    "Assumptions",
                    "Keep visible",
                  ],
                  [
                    LineChart,
                    "Scenarios",
                    "Not forecasts",
                  ],
                ].map(
                  ([IconValue, label, value]) => {
                    const SmallIcon =
                      IconValue as LucideIcon;

                    return (
                      <div
                        key={String(label)}
                        className="flex gap-3"
                      >
                        <SmallIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#64748b]">
                            {String(label)}
                          </p>

                          <p className="mt-1 text-xs font-black text-[#0f172a]">
                            {String(value)}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <Link
              href="/simulator"
              className="group block rounded-[24px] bg-[#030817] p-5 text-white shadow-lg shadow-[#dbe5f0] transition duration-300 hover:-translate-y-1 hover:bg-[#06101f]"
            >
              <Calculator className="h-5 w-5 text-[#60a5fa]" />

              <p className="mt-4 text-sm font-black">
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

function VideoBlock({
  articleTitle,
}: {
  articleTitle: string;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#dbe5f0] bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,.35)]">
      <div className="grid lg:grid-cols-[.82fr_1.18fr]">
        <div className="border-b border-[#dbe5f0] p-6 md:p-8 lg:border-b-0 lg:border-r">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
            <PlayCircle className="h-4 w-4" />
            Watch first
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0f172a]">
            Sheshank explains the thinking behind ESOP Value Clarity.
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#475569]">
            Start with the founder's explanation, then move through
            the decision framework below. This keeps the article
            connected to the product instead of feeling like a
            generic content page.
          </p>

          <div className="mt-6 rounded-2xl border border-[#dbe5f0] bg-[#f7f9fc] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#2563eb]">
              Article
            </p>

            <p className="mt-1 text-sm font-black leading-6 text-[#0f172a]">
              {articleTitle}
            </p>
          </div>

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[#2563eb]"
          >
            Open on YouTube
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="aspect-video bg-[#030817]">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
            title="ESOP Value Clarity founder explanation"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
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
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
          {section.eyebrow}
        </p>
      )}

      <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.045em] text-[#0f172a] md:text-4xl">
        {section.title}
      </h2>

      <div className="mt-6 space-y-5">
        {section.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[17px] leading-8 text-[#64748b]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {section.cards && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {section.cards.map((card) => (
            <div
              key={card.label}
              className="rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d4ed8]">
                {card.label}
              </p>

              <p className="mt-3 text-xl font-black tracking-[-0.035em] text-[#0f172a]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {section.bullets && (
        <div className="mt-8 rounded-[26px] border border-[#dbe5f0] bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {section.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex gap-3 text-sm font-semibold leading-6 text-[#64748b]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" />

                {bullet}
              </div>
            ))}
          </div>
        </div>
      )}

      {section.warning && (
        <div className="mt-8 rounded-[24px] border border-[#93c5fd] bg-[#eff6ff] p-6">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#2563eb]" />

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
    <section className="mt-20 rounded-[30px] border border-[#dbe5f0] bg-white p-6 shadow-sm md:p-8">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
        <UsersRound className="h-4 w-4" />
        Why this matters to each reader
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {views.map((view) => (
          <div
            key={view.label}
            className="rounded-[22px] border border-[#dbe5f0] bg-[#f7f9fc] p-5"
          >
            <p className="text-sm font-black text-[#0f172a]">
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
    <section className="mt-16 rounded-[30px] border border-[#dbe5f0] bg-[#ffffff] p-6 md:p-8">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
        <FileSearch className="h-4 w-4" />
        Decision checklist
      </p>

      <div className="mt-6 grid gap-3">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-[#dbe5f0] bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[10px] font-black text-[#1d4ed8]">
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
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#be123c]">
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
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
        FAQ
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-[22px] border border-[#dbe5f0] bg-white p-5 shadow-sm"
          >
            <summary className="cursor-pointer list-none text-base font-black text-[#0f172a] marker:hidden">
              <span className="flex items-center justify-between gap-5">
                {item.question}

                <ArrowRight className="h-4 w-4 shrink-0 text-[#2563eb] transition group-open:rotate-90" />
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

function EducationalNotice() {
  return (
    <div className="mt-16 rounded-[24px] border border-[#93c5fd] bg-[#eff6ff] p-6">
      <div className="flex items-start gap-4">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#2563eb]" />

        <div>
          <p className="font-black text-[#0f172a]">
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
    <section className="relative mt-16 overflow-hidden rounded-[32px] bg-[#030817] p-8 text-white md:p-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2563eb]/20 blur-[80px]" />

      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#3b82f6]/25 bg-[#3b82f6]/10 text-[#60a5fa]">
          <Calculator className="h-5 w-5" />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-[#60a5fa]">
          Knowledge to modelling
        </p>

        <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.045em] md:text-4xl">
          Apply this guide to your own ESOP assumptions.
        </h2>

        <p className="mt-5 max-w-2xl leading-7 text-[#dbeafe]">
          Use ESOP Value Clarity to connect grant size, vesting,
          exercise cost, dilution and exit scenarios instead of
          relying on a headline number from "{articleTitle}".
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/simulator"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 text-sm font-black text-white transition hover:bg-[#3b82f6]"
          >
            Open ESOP Simulator

            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/pro/offers/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.07] px-5 text-sm font-black text-white transition hover:bg-white/[0.12]"
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
  articles: readonly (readonly [string, Article])[];
}) {
  if (!relatedArticles.length) return null;

  return (
    <section className="mt-20">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
            Continue learning
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0f172a]">
            Related equity decisions
          </h2>
        </div>

        <Link
          href="/blog"
          className="group hidden items-center gap-2 text-sm font-black text-[#2563eb] md:flex"
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
                className="group relative overflow-hidden rounded-[24px] border border-[#dbe5f0] bg-white p-6 transition duration-500 hover:-translate-y-2 hover:border-[#2563eb] hover:shadow-[0_25px_70px_-45px_rgba(37,99,235,.30)]"
              >
                <Icon className="h-5 w-5 text-[#2563eb]" />

                <p className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-[#2563eb]">
                  {relatedArticle.category}
                </p>

                <h3 className="mt-3 text-lg font-black leading-6 text-[#0f172a]">
                  {relatedArticle.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-xs leading-6 text-[#475569]">
                  {relatedArticle.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-[#dbe5f0] pt-4">
                  <span className="text-xs font-black text-[#475569]">
                    {relatedArticle.readTime}
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe5f0] transition duration-300 group-hover:translate-x-1 group-hover:border-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white">
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