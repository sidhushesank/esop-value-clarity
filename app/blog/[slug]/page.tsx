import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  LineChart,
  Percent,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Footer from "@/components/sections/Footer";

const SITE_NAME = "ESOP Value Clarity";
const AUTHOR_NAME = "Sheshank Sidheshwar";
const PUBLISHED_DATE = "2026-08-31";
const UPDATED_DATE = "2026-08-31";

const articles = {
  "what-is-an-esop": {
    category: "ESOP Basics",
    readTime: "10 min read",
    title: "What Is an ESOP? A Practical Beginner's Guide for Employees",
    description:
      "Learn what ESOPs are, how employee stock options work, what vesting and exercise price mean, and which factors can change the potential value of startup equity.",
    keywords: [
      "what is ESOP",
      "ESOP meaning",
      "ESOP for employees",
      "employee stock options",
      "startup ESOP",
      "ESOP vesting",
      "ESOP exercise price",
      "ESOP value",
      "startup equity",
      "employee equity India",
    ],
    content: (
      <>
        <p>
          An <strong>ESOP</strong> gives an employee an opportunity to
          participate in the future value of a company through equity. In many
          startup compensation plans, the employee receives <strong>options</strong>:
          a right to buy company shares later at a predetermined exercise or
          strike price, subject to the plan and grant terms.
        </p>

        <p>
          That makes ESOPs very different from salary. Salary is compensation
          you receive in cash. An option grant is a potential ownership
          opportunity whose eventual economic value depends on several moving
          parts: vesting, exercise price, company value, dilution, liquidity,
          taxes and the terms of the grant.
        </p>

        <h2 id="how-esops-work">How do ESOPs work?</h2>

        <p>
          A typical employee equity journey has several stages. First, the
          company grants a number of options. Those options usually vest over
          time. Once vested and subject to the applicable plan rules, the
          employee may be able to exercise the options by paying the exercise
          price and receiving shares.
        </p>

        <div className="not-prose my-10 overflow-hidden rounded-[24px] border border-slate-200 bg-[#06101f] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
            ESOP lifecycle
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ["01", "Grant", "Options are awarded"],
              ["02", "Vest", "You earn them over time"],
              ["03", "Exercise", "You may pay to acquire shares"],
              ["04", "Liquidity", "Value may eventually be realised"],
            ].map(([number, label, detail]) => (
              <div
                key={number}
                className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <span className="font-mono text-[9px] font-black text-blue-300">
                  {number}
                </span>
                <p className="mt-3 text-sm font-black text-white">{label}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <h2 id="important-terms">The ESOP terms employees should understand</h2>

        <p>
          Option count alone tells you very little. Two employees can receive
          the same number of options and still have very different economic
          outcomes because the surrounding terms are different.
        </p>

        <div className="not-prose my-10 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Option grant",
              text: "The number of options awarded to you under the applicable grant.",
            },
            {
              title: "Exercise / strike price",
              text: "The price you generally need to pay per option when exercising vested options.",
            },
            {
              title: "Vesting schedule",
              text: "The timetable that determines when portions of your grant become vested.",
            },
            {
              title: "Current reference value",
              text: "A company-provided FMV or other reference value can help with analysis, but it is not guaranteed liquidity.",
            },
            {
              title: "Dilution",
              text: "Future share issuance can reduce the percentage ownership represented by an existing grant.",
            },
            {
              title: "Exercise window",
              text: "Your plan may limit how long vested options can be exercised after employment ends.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[20px] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="font-black text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <h2 id="vesting">What does ESOP vesting mean?</h2>

        <p>
          Options normally do not become exercisable all at once. A vesting
          schedule determines when you earn portions of the grant. A common
          structure is a four-year schedule with a one-year cliff, although
          actual terms vary by company and grant.
        </p>

        <p>
          Under a one-year cliff, an employee may receive no vested options
          before completing the first year. At the cliff date, a first portion
          may vest, with the remaining grant vesting periodically afterwards.
          Your official grant and plan documents determine the actual schedule.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-blue-100 bg-blue-50/60 p-6">
          <div className="flex items-start gap-4">
            <Clock3 className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-black text-slate-950">Simple vesting example</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Suppose you receive 1,000 options on a four-year schedule with a
                one-year cliff. If the grant vests evenly, approximately 250
                options may vest after the first year and the remaining 750 may
                vest gradually over the next three years. The exact schedule
                depends on your documents.
              </p>
            </div>
          </div>
        </div>

        <h2 id="exercise-price">What is the ESOP exercise price?</h2>

        <p>
          The exercise price, also called the strike price, is an important
          economic term because exercising options can require real cash. If
          5,000 vested options have an exercise price of ₹50 per option, the
          exercise cost alone would be ₹2,50,000 before considering any
          applicable taxes or other costs.
        </p>

        <p>
          This is one reason a headline statement such as “you have 5,000
          ESOPs” is incomplete. You also need to understand what it may cost to
          convert those options into shares and whether the resulting shares
          are liquid.
        </p>

        <h2 id="value">How can an ESOP become valuable?</h2>

        <p>
          At a simplified level, an option may have economic upside when the
          value of the underlying share exceeds the exercise price. But that
          simplified spread is not the same as guaranteed take-home value.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
            Illustrative scenario
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ["5,000", "Options"],
              ["₹50", "Exercise price"],
              ["₹200", "Illustrative share value"],
              ["₹7.50L", "Illustrative spread"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-6 text-slate-500">
            This example is deliberately simplified and does not account for
            vesting, dilution, taxes, liquidity, transaction restrictions or
            other grant terms. It is not a valuation or prediction.
          </p>
        </div>

        <h2 id="dilution">How does dilution affect employee ESOPs?</h2>

        <p>
          When a company issues additional shares, your number of options may
          remain unchanged while the percentage of the company represented by
          those options becomes smaller. This is dilution.
        </p>

        <p>
          Dilution is not automatically bad. A smaller percentage of a much
          more valuable company can be economically better than a larger
          percentage of a less valuable company. What matters is the
          interaction between ownership and company value.
        </p>

        <h2 id="liquidity">Can you sell ESOPs immediately?</h2>

        <p>
          Often, no. Private-company employee equity can be illiquid. Even
          after options vest and are exercised, there may be restrictions on
          transferring or selling the shares. Liquidity may depend on a
          company-approved secondary sale, acquisition, IPO, buyback or another
          permitted event.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-black text-amber-950">
                A modelled equity value is not cash.
              </p>
              <p className="mt-2 text-sm leading-7 text-amber-950/75">
                A company valuation, FMV or scenario value does not mean you can
                currently sell your equity at that value. Liquidity and the
                actual terms of your securities matter.
              </p>
            </div>
          </div>
        </div>

        <h2 id="why-startups-use-esops">Why do startups offer ESOPs?</h2>

        <ul>
          <li>To attract employees while managing current cash compensation.</li>
          <li>To give employees potential participation in future company value.</li>
          <li>To encourage retention through multi-year vesting.</li>
          <li>To align part of employee compensation with long-term company outcomes.</li>
        </ul>

        <p>
          For employees, the important point is that an ESOP grant should not
          automatically be valued like salary. The grant can create meaningful
          upside, but the outcome depends on conditions that salary does not.
        </p>

        <h2 id="offer-comparison">How should ESOPs be considered in a job offer?</h2>

        <p>
          When comparing two employment offers, separate guaranteed
          compensation from uncertain equity opportunity. A larger option count
          is not automatically a better grant, because strike price, company
          value, dilution, vesting, exercise windows and liquidity can differ.
        </p>

        <div className="not-prose my-10 overflow-hidden rounded-[24px] bg-[#06101f] p-6 text-white">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <WalletCards className="h-5 w-5 text-blue-300" />
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-blue-300">
                CASH
              </p>
              <p className="mt-2 text-sm font-black">What is guaranteed?</p>
            </div>

            <div>
              <TrendingUp className="h-5 w-5 text-violet-300" />
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-violet-300">
                EQUITY
              </p>
              <p className="mt-2 text-sm font-black">What is the opportunity?</p>
            </div>

            <div>
              <Gauge className="h-5 w-5 text-amber-300" />
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-amber-300">
                RISK
              </p>
              <p className="mt-2 text-sm font-black">What could change?</p>
            </div>
          </div>
        </div>

        <h2 id="questions-to-ask">Questions to ask before evaluating an ESOP grant</h2>

        <ul>
          <li>How many options am I being granted?</li>
          <li>What is the exercise or strike price?</li>
          <li>What is the vesting schedule and cliff?</li>
          <li>What share value or FMV is being referenced?</li>
          <li>How many fully diluted shares exist, if this information is available?</li>
          <li>What percentage ownership might the grant represent?</li>
          <li>What happens to vested options if I leave the company?</li>
          <li>How long is the post-termination exercise window?</li>
          <li>Are there transfer or liquidity restrictions?</li>
          <li>What taxes may apply to exercise or sale?</li>
        </ul>

        <h2 id="takeaway">The key takeaway</h2>

        <p>
          ESOPs can be a meaningful part of employee compensation, but their
          value cannot be understood from option count alone. A useful analysis
          connects the grant to vesting, exercise cost, ownership, dilution,
          company outcomes, liquidity and taxes.
        </p>

        <div className="not-prose my-10 rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Remember
          </p>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Understand the terms first. Model the possibilities second.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ESOP Value Clarity is designed around that distinction: known
            information stays separate from assumptions, and scenarios are not
            presented as guaranteed future outcomes.
          </p>
        </div>
      </>
    ),
  },

  "dilution-explained": {
    category: "Dilution",
    readTime: "12 min read",
    title: "ESOP Dilution Explained: How Startup Funding Affects Employee Equity",
    description:
      "Learn how ESOP dilution works, why funding rounds reduce ownership percentage, and how company growth can still increase the potential value of employee equity.",
    keywords: [
      "ESOP dilution",
      "startup dilution",
      "employee equity dilution",
      "funding round dilution",
      "ESOP value after funding",
      "startup ownership percentage",
      "option pool dilution",
      "fully diluted shares",
    ],
    content: (
      <>
        <p>
          <strong>Dilution</strong> happens when a company increases the number
          of shares or share-equivalents in its ownership structure. Your option
          count may remain exactly the same while the percentage of the company
          represented by those options becomes smaller.
        </p>

        <p>
          For employees, this is one of the most important ideas to understand:
          <strong> option count and ownership percentage are not the same thing.</strong>
          A grant of 10,000 options can represent very different ownership at
          two companies—or at the same company before and after fundraising.
        </p>

        <h2 id="dilution-meaning">What does ESOP dilution mean?</h2>

        <p>
          Imagine a company has 100,000 fully diluted shares and you hold 1,000
          shares or equivalent vested ownership. In that simplified structure,
          you represent 1% of the company. If the company later expands to
          200,000 shares while your holding stays at 1,000, your percentage
          becomes 0.5%.
        </p>

        <div className="not-prose my-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
              Before
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">1.00%</p>
            <p className="mt-2 text-sm text-slate-600">
              1,000 / 100,000 shares
            </p>
          </div>
          <div className="rounded-[22px] border border-violet-100 bg-violet-50/60 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">
              After
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">0.50%</p>
            <p className="mt-2 text-sm text-slate-600">
              1,000 / 200,000 shares
            </p>
          </div>
        </div>

        <h2 id="why-dilution-happens">Why do startups dilute existing ownership?</h2>

        <p>
          Dilution commonly accompanies events intended to help a company grow.
          New investors may receive shares in exchange for capital, an employee
          option pool may be expanded, or convertible instruments may become
          equity.
        </p>

        <ul>
          <li>Equity financing and new investment rounds.</li>
          <li>Expansion or refresh of an employee option pool.</li>
          <li>Conversion of convertible securities or similar instruments.</li>
          <li>Acquisitions or other transactions involving new shares.</li>
        </ul>

        <h2 id="dilution-value">Does dilution always make your ESOP worth less?</h2>

        <p>
          No. Dilution reduces a percentage, but economic value depends on both
          <strong> ownership percentage and company value</strong>. A smaller
          stake in a substantially more valuable business can be worth more than
          a larger stake in a smaller business.
        </p>

        <div className="not-prose my-10 overflow-hidden rounded-[24px] bg-[#06101f] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
            Simplified growth example
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["1.00%", "Initial ownership"],
              ["₹10Cr", "Initial company value"],
              ["₹10L", "Illustrative stake value"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xl font-black">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="my-5 h-px bg-white/10" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["0.50%", "Diluted ownership"],
              ["₹100Cr", "Later company value"],
              ["₹50L", "Illustrative stake value"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xl font-black text-emerald-300">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            This is an intentionally simplified illustration, not a valuation
            or prediction. Real employee economics can also involve exercise
            cost, taxes, security rights and liquidity restrictions.
          </p>
        </div>

        <h2 id="fully-diluted">What does fully diluted ownership mean?</h2>

        <p>
          When evaluating employee equity, the denominator matters. A
          fully-diluted share count may include outstanding shares plus options,
          warrants, convertible instruments or other securities that could
          become shares, depending on the definition being used.
        </p>

        <p>
          If you only know your option count but not the relevant company share
          count, you may not be able to estimate your ownership percentage
          reliably.
        </p>

        <h2 id="funding-rounds">How funding rounds can affect employee equity</h2>

        <p>
          A funding round can create two effects at the same time: your
          percentage ownership can decline while the company's implied
          valuation increases. Whether the economic picture improves depends on
          how those changes interact.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <p className="font-black text-amber-950">Do not look at dilution alone.</p>
          <p className="mt-2 text-sm leading-7 text-amber-950/75">
            A 20% dilution assumption does not by itself tell you whether your
            equity position became economically better or worse. You also need
            to consider the company's value after the financing and the terms
            attached to your equity.
          </p>
        </div>

        <h2 id="option-pool">How option-pool expansion can dilute employees</h2>

        <p>
          Startups often reserve equity for future employees. If that pool is
          expanded, the total fully diluted share base can increase. Existing
          holders may therefore represent a smaller percentage even if they do
          not sell or transfer any shares.
        </p>

        <h2 id="model-dilution">How should employees model dilution?</h2>

        <p>
          Because future financing is uncertain, dilution is better treated as
          a scenario input than as a guaranteed number. Comparing multiple
          assumptions can show how sensitive your potential outcome is to
          future capital raising.
        </p>

        <div className="not-prose my-10 grid gap-3 sm:grid-cols-3">
          {[
            ["10%", "Lower dilution scenario"],
            ["20%", "Middle scenario"],
            ["35%", "Higher dilution scenario"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <h2 id="dilution-questions">Questions to ask about dilution</h2>

        <ul>
          <li>What percentage ownership does my grant represent today?</li>
          <li>What share count is being used to calculate that percentage?</li>
          <li>Is the denominator fully diluted?</li>
          <li>How large is the current employee option pool?</li>
          <li>Could the option pool be expanded before a future financing?</li>
          <li>What dilution assumptions am I using in my own scenario?</li>
        </ul>

        <h2 id="dilution-takeaway">The key takeaway</h2>

        <p>
          Dilution is not simply “losing shares.” Your option count may remain
          unchanged while your percentage ownership decreases. The useful
          question is how that lower percentage interacts with the company's
          changing value, your vesting, exercise cost and eventual liquidity.
        </p>

        <div className="not-prose my-10 rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Remember
          </p>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Ownership can shrink while potential value grows.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Model both sides of the equation instead of treating dilution as a
            standalone verdict.
          </p>
        </div>
      </>
    ),
  },

  "vesting-schedule": {
    category: "Vesting",
    readTime: "12 min read",
    title: "ESOP Vesting Explained: 4-Year Vesting, Cliffs & Employee Ownership",
    description:
      "Understand ESOP vesting schedules, one-year cliffs, monthly and quarterly vesting, and what happens to vested and unvested options when employment changes.",
    keywords: [
      "ESOP vesting",
      "vesting schedule",
      "4 year vesting",
      "one year cliff",
      "ESOP cliff",
      "vested options",
      "unvested ESOP",
      "employee stock option vesting",
    ],
    content: (
      <>
        <p>
          <strong>Vesting</strong> determines when an employee earns the right
          associated with an equity grant. Receiving 10,000 options does not
          necessarily mean that all 10,000 are immediately vested or
          exercisable.
        </p>

        <p>
          For employees evaluating startup equity, the vesting schedule is just
          as important as the headline grant size because it determines how much
          of that grant may actually become available over time.
        </p>

        <h2 id="vesting-meaning">What is an ESOP vesting schedule?</h2>

        <p>
          A vesting schedule defines how a grant becomes vested over a specified
          period. A common startup structure is four years with a one-year
          cliff, followed by monthly or quarterly vesting. Your actual grant can
          use a different schedule.
        </p>

        <div className="not-prose my-10 overflow-hidden rounded-[24px] bg-[#06101f] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
            Illustrative 4-year schedule
          </p>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {[
              ["Year 1", "25%"],
              ["Year 2", "50%"],
              ["Year 3", "75%"],
              ["Year 4", "100%"],
            ].map(([year, value], index) => (
              <div key={year} className="relative rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div
                  className="absolute bottom-0 left-0 h-1 rounded-full bg-blue-400"
                  style={{ width: `${(index + 1) * 25}%` }}
                />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{year}</p>
                <p className="mt-2 text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            Simplified illustration only. Actual vesting dates and frequencies
            are controlled by your grant documents.
          </p>
        </div>

        <h2 id="cliff">What is a one-year cliff?</h2>

        <p>
          A cliff delays the first vesting event. Under a one-year cliff, an
          employee commonly receives no vested portion before completing the
          first year. At the cliff date, a larger initial portion may vest at
          once.
        </p>

        <p>
          If employment ends before the cliff date, the employee may leave with
          no vested options from that grant, subject to the actual plan terms.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-blue-100 bg-blue-50/60 p-6">
          <div className="flex items-start gap-4">
            <Clock3 className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-black text-slate-950">1,000-option example</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                On a simplified four-year schedule with a one-year cliff,
                around 250 options could vest at the first anniversary. The
                remaining 750 might then vest over the next three years.
              </p>
            </div>
          </div>
        </div>

        <h2 id="frequency">Monthly vs quarterly vs annual vesting</h2>

        <p>
          After a cliff, grants can vest at different frequencies. Monthly
          vesting creates smaller, more frequent increments. Quarterly or
          annual schedules create less frequent vesting events. The economic
          difference can matter if you are considering leaving near a vesting
          date.
        </p>

        <div className="not-prose my-10 grid gap-4 sm:grid-cols-3">
          {[
            ["Monthly", "Smaller frequent increments"],
            ["Quarterly", "Four vesting points per year"],
            ["Annual", "Larger less-frequent increments"],
          ].map(([label, detail]) => (
            <div key={label} className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">{label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          ))}
        </div>

        <h2 id="vested-unvested">Vested options vs unvested options</h2>

        <p>
          <strong>Vested options</strong> are the portion of the grant for which
          the vesting condition has been satisfied. <strong>Unvested options</strong>
          remain subject to future vesting conditions.
        </p>

        <p>
          Vested does not necessarily mean “cash” or even “shares.” With an
          option grant, exercise may still be required before shares are
          acquired, and liquidity may still be unavailable afterwards.
        </p>

        <h2 id="leaving">What happens to ESOPs when you leave a company?</h2>

        <p>
          Unvested options are commonly forfeited when employment ends, subject
          to the relevant plan and grant terms. Vested options may remain
          exercisable only for a defined period after termination.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <p className="font-black text-amber-950">
            Check the post-termination exercise window.
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-950/75">
            A short exercise window can force an employee to decide whether to
            spend cash exercising vested options soon after leaving. Missing
            this term can materially distort how attractive a grant appears.
          </p>
        </div>

        <h2 id="acceleration">Can vesting accelerate?</h2>

        <p>
          Some grants or plans may include acceleration provisions connected to
          events such as a change of control or termination under specified
          circumstances. These provisions are highly document-specific and
          should not be assumed unless they appear in the applicable terms.
        </p>

        <h2 id="vesting-offer">Why vesting matters when comparing job offers</h2>

        <p>
          Two companies can offer the same option count but very different
          vesting economics. One offer may have a shorter cliff, faster vesting,
          a different vesting start date or more flexible post-employment
          exercise terms.
        </p>

        <p>
          That is why an offer comparison should look beyond the headline grant
          and examine how much equity can actually become vested over the time
          you expect to stay.
        </p>

        <h2 id="vesting-questions">Questions to ask about a vesting schedule</h2>

        <ul>
          <li>What is the total vesting duration?</li>
          <li>Is there a cliff? If yes, how long?</li>
          <li>What percentage vests at the cliff?</li>
          <li>Does the remainder vest monthly, quarterly or annually?</li>
          <li>What is the vesting start date?</li>
          <li>What happens to unvested options if employment ends?</li>
          <li>How long can vested options be exercised after leaving?</li>
          <li>Is any acceleration provision included?</li>
        </ul>

        <h2 id="vesting-takeaway">The key takeaway</h2>

        <p>
          A grant is a promise governed by time and conditions. Vesting tells
          you how that headline number turns into an earned equity position.
          Before comparing grants, understand what can actually vest and what
          happens when employment changes.
        </p>

        <div className="not-prose my-10 rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Remember
          </p>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Granted is not the same as vested.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Model the portion you can actually earn over the period relevant to
            your decision.
          </p>
        </div>
      </>
    ),
  },

  "esop-vs-rsu": {
    category: "Equity",
    readTime: "13 min read",
    title: "ESOP vs RSU: Key Differences in Employee Equity Explained",
    description:
      "Compare ESOPs and RSUs across exercise price, vesting, ownership, liquidity, taxation and potential value when evaluating employee compensation.",
    keywords: [
      "ESOP vs RSU",
      "RSU vs ESOP",
      "stock options vs RSU",
      "employee equity",
      "startup ESOP vs RSU",
      "RSU vesting",
      "ESOP exercise price",
      "equity compensation",
    ],
    content: (
      <>
        <p>
          <strong>ESOPs and RSUs</strong> are both forms of employee equity, but
          they do not create the same economics. The most important difference
          is that an employee stock option generally provides a right to acquire
          shares at an exercise price, while an RSU generally represents an
          equity award that is delivered according to its vesting and settlement
          terms without an option exercise price.
        </p>

        <p>
          When comparing compensation offers, the label alone is not enough.
          Employees should understand what they must pay, when the equity vests,
          what the underlying shares may be worth and whether those shares can
          actually be sold.
        </p>

        <h2 id="comparison">ESOP vs RSU at a glance</h2>

        <div className="not-prose my-10 overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#06101f] text-white">
              <tr>
                <th className="p-4 font-black">Feature</th>
                <th className="p-4 font-black">ESOP / stock option</th>
                <th className="p-4 font-black">RSU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {[
                ["Basic structure", "Right to acquire shares", "Equity units/shares delivered under award terms"],
                ["Exercise price", "Commonly required", "Typically no option exercise price"],
                ["Vesting", "Usually applies", "Usually applies"],
                ["Cash needed to exercise", "Can be significant", "Generally not an option-exercise requirement"],
                ["Value sensitivity", "Share value relative to strike matters", "Underlying share value matters"],
                ["Liquidity", "Depends on underlying company/shares", "Depends on underlying company/shares"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={cell} className={`p-4 ${index === 0 ? "font-black text-slate-950" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="esop">How does an ESOP or stock option work?</h2>

        <p>
          An option grant generally gives you the right to buy a specified
          number of shares at a defined exercise or strike price once the
          relevant options have vested and other conditions are satisfied.
        </p>

        <p>
          If the share value rises significantly above the exercise price, the
          option can have meaningful economic upside. If the share value does
          not exceed the exercise price—or if liquidity never arrives—the
          economic outcome can be very different.
        </p>

        <h2 id="rsu">How does an RSU work?</h2>

        <p>
          A Restricted Stock Unit generally represents a promise to deliver
          shares or an equivalent benefit when specified vesting and settlement
          conditions are met. Unlike an option, an RSU typically does not
          require paying an option strike price to obtain the underlying equity.
        </p>

        <p>
          The exact legal, tax and settlement treatment varies by plan,
          jurisdiction and company, so the award documents remain authoritative.
        </p>

        <h2 id="exercise">Exercise cost: a major economic difference</h2>

        <p>
          Options can require employees to commit cash. For example, 10,000
          vested options with a ₹50 strike price imply a ₹5,00,000 exercise cost
          before considering taxes or other costs.
        </p>

        <div className="not-prose my-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-6">
            <WalletCards className="h-5 w-5 text-blue-600" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">ESOP</p>
            <p className="mt-2 text-xl font-black text-slate-950">Exercise cash may be required</p>
          </div>
          <div className="rounded-[22px] border border-violet-100 bg-violet-50/60 p-6">
            <Layers3 className="h-5 w-5 text-violet-600" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">RSU</p>
            <p className="mt-2 text-xl font-black text-slate-950">No option strike-price decision</p>
          </div>
        </div>

        <h2 id="vesting">Do both ESOPs and RSUs vest?</h2>

        <p>
          Yes, both commonly use vesting schedules. A four-year schedule with a
          one-year cliff is one familiar structure, but actual schedules vary.
          Vesting determines when the employee earns the applicable portion of
          the award.
        </p>

        <h2 id="value">How should employees think about value?</h2>

        <p>
          For options, the relationship between share value and exercise price
          is central. For RSUs, the underlying share value is more directly
          relevant because there is typically no option exercise price.
        </p>

        <div className="not-prose my-10 overflow-hidden rounded-[24px] bg-[#06101f] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
            Do not compare units blindly
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["10,000", "Options"],
              ["1,000", "RSUs"],
              ["≠", "Not directly comparable"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xl font-black">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            Unit counts alone do not establish which award is economically
            stronger. Share value, strike price, vesting, dilution, liquidity
            and tax treatment matter.
          </p>
        </div>

        <h2 id="private-public">Are ESOPs only for startups and RSUs only for public companies?</h2>

        <p>
          No. Options are common in startups and private companies, while RSUs
          are widely used by public and later-stage companies, but neither
          structure is exclusive to one company type.
        </p>

        <p>
          What matters is the actual award and the characteristics of the
          underlying company and security.
        </p>

        <h2 id="liquidity">How does liquidity differ?</h2>

        <p>
          Liquidity depends primarily on the underlying shares and company, not
          simply on whether the award is called an ESOP or RSU. Private-company
          equity may have limited transfer opportunities. Public-company shares
          can be more liquid, although trading windows, lockups or other
          restrictions may still apply.
        </p>

        <h2 id="tax">What about tax?</h2>

        <p>
          Tax treatment can differ materially between options and RSUs and can
          vary by jurisdiction, security type, exercise or vesting event,
          holding period and employee circumstances.
        </p>

        <div className="not-prose my-10 rounded-[24px] border border-amber-200 bg-amber-50 p-6">
          <p className="font-black text-amber-950">Tax is not a side detail.</p>
          <p className="mt-2 text-sm leading-7 text-amber-950/75">
            A headline equity value can differ significantly from eventual
            after-tax proceeds. Use professional tax advice for decisions that
            depend on your personal circumstances.
          </p>
        </div>

        <h2 id="offer">Which is better in a job offer: ESOP or RSU?</h2>

        <p>
          There is no universal winner. A strong RSU package at one company can
          be less attractive than a strong option grant at another, and vice
          versa. The answer depends on the economics and your priorities.
        </p>

        <ul>
          <li>How much guaranteed cash does each offer provide?</li>
          <li>What is the quantity and type of equity?</li>
          <li>What is the option strike price, if applicable?</li>
          <li>What is the relevant share value or company valuation?</li>
          <li>How does each award vest?</li>
          <li>What dilution and liquidity risks apply?</li>
          <li>What exercise or tax obligations could require cash?</li>
        </ul>

        <h2 id="rsu-esop-takeaway">The key takeaway</h2>

        <p>
          ESOPs and RSUs are different financial structures. Comparing them
          requires more than counting units. Separate guaranteed compensation
          from equity opportunity, understand the mechanics of each award and
          model the assumptions that can change the outcome.
        </p>

        <div className="not-prose my-10 rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Remember
          </p>
          <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
            Compare economics, not unit counts.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Equity type is only the beginning of the comparison.
          </p>
        </div>
      </>
    ),
  },
};

type Slug = keyof typeof articles;

const articleAnchors: Record<Slug, string[][]> = {
  "what-is-an-esop": [
    ["how-esops-work", "How ESOPs work"],
    ["important-terms", "Important terms"],
    ["vesting", "Vesting"],
    ["exercise-price", "Exercise price"],
    ["value", "Potential value"],
    ["dilution", "Dilution"],
    ["liquidity", "Liquidity"],
    ["offer-comparison", "Offer comparison"],
    ["questions-to-ask", "Questions to ask"],
  ],
  "dilution-explained": [
    ["dilution-meaning", "What dilution means"],
    ["why-dilution-happens", "Why dilution happens"],
    ["dilution-value", "Dilution vs value"],
    ["fully-diluted", "Fully diluted ownership"],
    ["funding-rounds", "Funding rounds"],
    ["option-pool", "Option pools"],
    ["model-dilution", "Model dilution"],
    ["dilution-questions", "Questions to ask"],
  ],
  "vesting-schedule": [
    ["vesting-meaning", "Vesting schedule"],
    ["cliff", "One-year cliff"],
    ["frequency", "Vesting frequency"],
    ["vested-unvested", "Vested vs unvested"],
    ["leaving", "Leaving the company"],
    ["acceleration", "Acceleration"],
    ["vesting-offer", "Offer comparison"],
    ["vesting-questions", "Questions to ask"],
  ],
  "esop-vs-rsu": [
    ["comparison", "ESOP vs RSU"],
    ["esop", "How options work"],
    ["rsu", "How RSUs work"],
    ["exercise", "Exercise cost"],
    ["vesting", "Vesting"],
    ["value", "Comparing value"],
    ["liquidity", "Liquidity"],
    ["tax", "Tax"],
    ["offer", "Job-offer comparison"],
  ],
};

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

  return {
    title: `${article.title} | ESOP Value Clarity`,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: `/blog/${slug}`,
      siteName: SITE_NAME,
      publishedTime: PUBLISHED_DATE,
      modifiedTime: UPDATED_DATE,
      authors: [AUTHOR_NAME],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    robots: {
      index: true,
      follow: true,
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

  if (!article) {
    notFound();
  }

  const relatedArticles = Object.entries(articles)
    .filter(([articleSlug]) => articleSlug !== slug)
    .slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: PUBLISHED_DATE,
    dateModified: UPDATED_DATE,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blog/${slug}`,
    },
    keywords: article.keywords.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Equity Intelligence Journal",
        item: "/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `/blog/${slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* =====================================================
          ARTICLE HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-slate-200 bg-[#030817] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] animate-pulse rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="pointer-events-none absolute -right-40 top-[-180px] h-[620px] w-[620px] rounded-full bg-violet-600/10 blur-[160px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
            Equity Intelligence Journal
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-blue-300/20 bg-blue-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-200">
                  {article.category}
                </span>

                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {article.readTime}
                </span>

                <span className="text-xs font-semibold text-slate-500">
                  Updated 31 Aug 2026
                </span>
              </div>

              <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] text-white md:text-6xl lg:text-[64px]">
                {article.title}
              </h1>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
                {article.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-300" />
                  Employee-first explanation
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Scenarios, not predictions
                </div>
              </div>
            </div>

            {/* ARTICLE TERMINAL */}

            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-blue-500/[0.05] blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#081120]/90 shadow-[0_40px_100px_-35px_rgba(0,0,0,.85)]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Equity concept map
                  </span>
                </div>

                <div className="p-5">
                  {[
                    [Layers3, "GRANT", "What did I receive?"],
                    [Clock3, "VEST", "What is actually earned?"],
                    [WalletCards, "EXERCISE", "What could it cost?"],
                    [Percent, "DILUTION", "What can change ownership?"],
                    [TrendingUp, "OUTCOME", "What could it become?"],
                  ].map(([Icon, label, detail], index) => {
                    const IconComponent = Icon as typeof Layers3;

                    return (
                      <div
                        key={String(label)}
                        className="group relative mb-2 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 transition duration-300 last:mb-0 hover:translate-x-2 hover:bg-white/[0.065]"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-blue-300 transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                          <IconComponent className="h-4 w-4" />
                        </div>

                        <div className="flex-1">
                          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-300">
                            {String(label)}
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-300">
                            {String(detail)}
                          </p>
                        </div>

                        <span className="font-mono text-[9px] font-black text-slate-600">
                          0{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ARTICLE BODY
      ====================================================== */}

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-20 lg:grid-cols-[250px_minmax(0,760px)_220px] lg:justify-center">
        {/* TABLE OF CONTENTS */}

        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">
              In this guide
            </p>

            <nav className="mt-4 space-y-1">
              {articleAnchors[slug as Slug].map(([href, label], index) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-xs font-semibold text-slate-500 transition hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="font-mono text-[9px] font-black text-slate-300 group-hover:text-blue-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}

        <div id="top" className="min-w-0">
          <article className="prose prose-slate max-w-none text-[17px] leading-8 prose-headings:scroll-mt-8 prose-headings:font-black prose-headings:tracking-[-0.035em] prose-headings:text-slate-950 prose-h2:mt-16 prose-h2:text-[30px] prose-p:mt-6 prose-p:text-slate-700 prose-strong:font-black prose-strong:text-slate-950 prose-ul:mt-6 prose-ul:space-y-3 prose-li:text-slate-700">
            {article.content}
          </article>

          {/* EDUCATIONAL NOTICE */}

          <div className="mt-14 rounded-[24px] border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-black text-amber-950">Educational content</p>
                <p className="mt-2 text-sm leading-7 text-amber-950/75">
                  This guide explains general equity concepts and is not
                  financial, investment, legal, employment or tax advice.
                  Company plans and individual circumstances differ. Your
                  official documents and appropriate professional advice should
                  be used for material decisions.
                </p>
              </div>
            </div>
          </div>

          {/* PRODUCT CTA */}

          <section className="relative mt-16 overflow-hidden rounded-[30px] bg-[#030817] p-8 text-white md:p-10">
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.14) 1px, transparent 1px)",
                backgroundSize: "52px 52px",
              }}
            />

            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300">
                <Calculator className="h-5 w-5" />
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                Knowledge → modelling
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.045em] md:text-4xl">
                Now apply the concepts to your own assumptions.
              </h2>

              <p className="mt-5 max-w-2xl leading-7 text-slate-300">
                Use the ESOP simulator to connect grant size, vesting,
                valuation, dilution and exit assumptions instead of relying on
                option count alone.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/simulator">
                  <Button
                    size="lg"
                    className="group rounded-xl bg-blue-600 px-6 font-black text-white hover:bg-blue-500"
                  >
                    Open ESOP Simulator
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>

                <Link
                  href="/blog"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 text-sm font-black text-white transition hover:bg-white/[0.09]"
                >
                  Continue learning
                  <BookOpen className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* RELATED */}

          <section id="related" className="mt-20">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Continue learning
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Related equity guides
                </h2>
              </div>

              <Link
                href="/blog"
                className="group hidden items-center gap-2 text-sm font-black text-blue-600 md:flex"
              >
                View journal
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {relatedArticles.map(([relatedSlug, relatedArticle], index) => (
                <Link
                  key={relatedSlug}
                  href={`/blog/${relatedSlug}`}
                  className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-6 transition duration-400 hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_25px_70px_-40px_rgba(37,99,235,.4)]"
                >
                  <span className="font-mono text-[9px] font-black text-slate-300">
                    0{index + 1}
                  </span>

                  <p className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                    {relatedArticle.category}
                  </p>

                  <h3 className="mt-3 text-lg font-black leading-6 text-slate-950">
                    {relatedArticle.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-xs leading-6 text-slate-500">
                    {relatedArticle.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-black text-slate-700">
                      {relatedArticle.readTime}
                    </span>

                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 transition duration-300 group-hover:translate-x-1 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT RAIL */}

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                Article principles
              </p>

              <div className="mt-5 space-y-4">
                {[
                  ["Known terms", "Separate facts"],
                  ["Assumptions", "Keep visible"],
                  ["Scenarios", "Not forecasts"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-black text-slate-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/simulator"
              className="group block rounded-[22px] bg-blue-600 p-5 text-white shadow-lg shadow-blue-100 transition duration-300 hover:-translate-y-1"
            >
              <LineChart className="h-5 w-5 text-blue-100" />
              <p className="mt-4 text-sm font-black">Model your own ESOP</p>
              <p className="mt-2 text-[11px] leading-5 text-blue-100">
                Move from the concept to your own scenario.
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
