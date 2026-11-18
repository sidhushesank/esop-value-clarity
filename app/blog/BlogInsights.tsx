"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Check } from "lucide-react";

/* ============================================================
   Blog hub data sections. Every market figure is from a named,
   linked source; every tax figure is an illustration with the
   assumptions printed next to it.
   Chart colors: #2F5D9E (blue) and #B7800E (gold), checked with
   the dataviz palette validator on a white surface.
============================================================ */

const BLUE = "#2F5D9E";
const GOLD = "#B7800E";
const INK = "#042653";
const AXIS = { fill: "#64748B", fontSize: 11 };
const GRID = "#EEF2F7";

const TOOLTIP_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  boxShadow: "0 12px 30px -16px rgba(4,38,83,0.35)",
  fontSize: 12,
  padding: "8px 12px",
};

/* ---------- Sourced market data ---------- */

const YEARLY_BUYBACKS = [
  { period: "2024", value: 190, label: "~$190M", note: "Full year" },
  { period: "2025", value: 75, label: "$75M+", note: "Full year" },
  { period: "Q1 2026", value: 220, label: "~$220M", note: "January to March only" },
];

const BUYBACKS_2026_INR = [
  { company: "Innovaccer", crore: 600, month: "Jan 2026" },
  { company: "CoinDCX", crore: 111, month: "Feb 2026" },
  { company: "Unacademy", crore: 50, month: "Feb 2026" },
  { company: "Plum", crore: 15, month: "Jun 2026" },
  { company: "Emversity", crore: 6.5, month: "Mar 2026" },
  { company: "Atlys", crore: 4, month: "Apr 2026" },
];

const MARKET_SOURCES = [
  { title: "Entrepreneur India: Cashfree buyback, with 2024 and 2025 totals", url: "https://india.entrepreneur.com/news-and-trends/cashfree-payments-announces-esop-buyback-for-over-400/502067" },
  { title: "Entrackr via Pulse: Q1 2026 ESOP buybacks", url: "https://www.pulse.bot/human-resources/news/indian-startup-esop-buybacks-in-q1-2026-beat-2024-and-2025-2-bn-liquidity-since-2020-cb9e0984-6dac-4c10-b008-37593e377e43/" },
  { title: "Innovaccer ₹600 crore", url: "https://india.entrepreneur.com/?p=92521" },
  { title: "CoinDCX ₹111 crore", url: "https://india.entrepreneur.com/?p=93951" },
  { title: "Unacademy ₹50 crore", url: "https://www.businesstoday.in/technology/story/unacademy-announces-rs-50-crore-esop-buyback-518348-2026-02-27" },
  { title: "Plum ₹15 crore", url: "https://www.pulse.bot/human-resources/news/plum-insurance-launches-rs-15-cr-esop-buyback-for-current-and-former-employees-ad59ea01-711a-42a7-8271-79c97af7e297/" },
  { title: "Emversity ₹6.5 crore", url: "https://www.pulse.bot/human-resources/news/emversity-buys-back-rs-65-cr-esops-from-20-employees-62336e54-1e8f-4d03-97b7-663fb5945733" },
  { title: "Atlys ₹4 crore", url: "https://india.entrepreneur.com/?p=95201" },
];

const TAX_REGIMES = [
  {
    when: "Up to 30 Sep 2024",
    who: "Company paid",
    what: "The company paid buyback tax. The money you received was tax-free.",
  },
  {
    when: "1 Oct 2024 to 31 Mar 2026",
    who: "You paid, at slab rate",
    what: "The whole amount was a deemed dividend, taxed at your slab rate. Your cost became a capital loss.",
  },
  {
    when: "From 1 Apr 2026",
    who: "You pay capital gains",
    what: "Only the gain over your cost is taxed: 12.5% after 24 months for unlisted shares, slab rate before.",
  },
];

const READING_PATHS = [
  {
    title: "New to ESOPs",
    steps: [
      { slug: "what-is-an-esop", label: "What an ESOP is" },
      { slug: "vesting-schedule", label: "How vesting works" },
      { slug: "esop-exercise-cost", label: "What exercising costs" },
      { slug: "esop-vs-rsu", label: "ESOPs vs RSUs" },
    ],
  },
  {
    title: "I have an offer",
    steps: [
      { slug: "startup-offered-25000-esops", label: "Is my grant good?" },
      { slug: "should-i-negotiate-esops", label: "Salary or ESOPs?" },
      { slug: "compare-startup-offers-equity", label: "Compare two offers" },
      { slug: "dilution-explained", label: "What dilution does" },
    ],
  },
  {
    title: "Leaving, or offered a buyback",
    steps: [
      { slug: "leaving-startup-esop-options", label: "Vested options when you leave" },
      { slug: "esop-buyback-india", label: "How buybacks are taxed" },
      { slug: "unacademy-esop-buyback-2026", label: "A real buyback, explained" },
      { slug: "esop-exercise-cost", label: "Cash needed to exercise" },
    ],
  },
  {
    title: "I'm a founder",
    steps: [
      { slug: "cap-table-india", label: "Build your cap table" },
      { slug: "esop-valuation-india", label: "How FMV is set" },
      { slug: "startup-raised-funding-dilution", label: "Dilution in a round" },
      { slug: "esop-buyback-india", label: "Running a buyback" },
    ],
  },
];

function inr(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/* ============================================================ */

export default function BlogInsights() {
  return (
    <>
      <BuybackDashboard />
      <TaxTimeline />
      <VestingExplorer />
      <ReadingPaths />
    </>
  );
}

/* ---------- 1. Buybacks in numbers ---------- */

function BuybackDashboard() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
      <SectionHead
        eyebrow="ESOP buybacks in India"
        title="Employees cashed out more in three months of 2026 than in all of 2025."
        lede="Startups bought back about $220 million of employee stock between January and March 2026. Here is what was reported, company by company."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value="~$220M" label="ESOP buybacks, Q1 2026" />
        <Kpi value="$75M+" label="All of 2025" />
        <Kpi value="~$190M" label="All of 2024" />
        <Kpi value="~$2B" label="Bought back since 2020" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ChartCard
          title="Buyback value by period"
          subtitle="US$ million · Q1 2026 is three months only"
          table={{
            head: ["Period", "Value", "Covers"],
            rows: YEARLY_BUYBACKS.map((d) => [d.period, d.label, d.note]),
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={YEARLY_BUYBACKS} margin={{ top: 24, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="period" tick={AXIS} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => `$${v}M`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(4,38,83,0.04)" }}
                labelStyle={{ color: "#64748B" }}
                itemStyle={{ color: INK, padding: 0 }}
                formatter={(value) => [`$${Number(value)}M`, "Buybacks"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56} animationDuration={900}>
                {YEARLY_BUYBACKS.map((d) => (
                  <Cell key={d.period} fill={d.period === "Q1 2026" ? GOLD : BLUE} />
                ))}
                <LabelList dataKey="label" position="top" style={{ fill: INK, fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="2026 buybacks reported in rupees"
          subtitle="₹ crore · BrowserStack's $125M programme was reported in dollars and is not shown"
          table={{
            head: ["Company", "₹ crore", "Reported"],
            rows: BUYBACKS_2026_INR.map((d) => [d.company, String(d.crore), d.month]),
          }}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={BUYBACKS_2026_INR}
              layout="vertical"
              margin={{ top: 4, right: 48, bottom: 0, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="company" tick={AXIS} axisLine={false} tickLine={false} width={84} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(4,38,83,0.04)" }}
                labelStyle={{ color: "#64748B" }}
                itemStyle={{ color: INK, padding: 0 }}
                formatter={(value) => [`₹${Number(value)} crore`, "Buyback"]}
              />
              <Bar dataKey="crore" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} animationDuration={900}>
                <LabelList
                  dataKey="crore"
                  position="right"
                  formatter={(v) => `₹${Number(v)} Cr`}
                  style={{ fill: INK, fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Sources items={MARKET_SOURCES} />
    </section>
  );
}

/* ---------- 2. Tax timeline + calculator ---------- */

function TaxTimeline() {
  const [payout, setPayout] = useState(5000000);
  const [costShare, setCostShare] = useState(20);
  const [longTerm, setLongTerm] = useState(true);

  const cost = (payout * costShare) / 100;
  const gain = Math.max(payout - cost, 0);
  const deemedDividendTax = payout * 0.3 * 1.04;
  const capitalGainsTax = gain * (longTerm ? 0.125 : 0.3) * 1.04;
  const difference = deemedDividendTax - capitalGainsTax;

  const data = [
    { name: "Paid by 31 Mar 2026", tax: Math.round(deemedDividendTax), label: inr(deemedDividendTax) },
    { name: "Paid from 1 Apr 2026", tax: Math.round(capitalGainsTax), label: inr(capitalGainsTax) },
  ];

  return (
    <section className="border-y border-slate-200 bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
        <SectionHead
          eyebrow="Buyback tax"
          title="The date you're paid can change your tax by lakhs."
          lede="India has taxed company share buybacks three different ways since 2024. The payment date decides which rules apply."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {TAX_REGIMES.map((regime, index) => (
            <li
              key={regime.when}
              data-reveal
              style={{ transitionDelay: `${index * 90}ms` }}
              className={`evc-card relative rounded-2xl border bg-white p-6 ${
                index === 2 ? "border-[#F2B421]/60" : "border-slate-200"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B7800E]">
                {regime.when}
              </span>
              <p className="mt-3 text-lg font-semibold text-[#042653]">{regime.who}</p>
              <p className="mt-2 text-[15px] leading-7 text-slate-600">{regime.what}</p>
              {index === 2 && (
                <span className="absolute right-5 top-5 rounded-full bg-[#FFF4D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A5A00]">
                  Now
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div data-reveal className="evc-card rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-sm font-semibold text-[#042653]">Try your own numbers</p>
            <div className="mt-6 space-y-6">
              <LightSlider
                label="Buyback payout"
                value={payout}
                min={500000}
                max={20000000}
                step={100000}
                onChange={setPayout}
                format={inr}
              />
              <LightSlider
                label="Your cost (FMV at exercise), as % of payout"
                value={costShare}
                min={0}
                max={90}
                step={5}
                onChange={setCostShare}
                format={(v) => `${v}% · ${inr((payout * v) / 100)}`}
              />
              <div>
                <p className="text-sm text-slate-600">How long you held the shares</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: "More than 24 months" },
                    { value: false, label: "24 months or less" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setLongTerm(option.value)}
                      aria-pressed={longTerm === option.value}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        longTerm === option.value
                          ? "border-[#042653] bg-[#042653] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#F2B421]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              Illustration for a company buyback of shares, assuming a 30% slab, 4% cess and no surcharge.
              Not tax advice. Surrendering options for cash is taxed as salary instead.
            </p>
          </div>

          <ChartCard
            title="Tax on the same payout"
            subtitle={
              difference > 0
                ? `Paying from 1 April 2026 saves about ${inr(difference)} in this example`
                : "In this example the two dates cost about the same"
            }
            table={{
              head: ["Payment date", "Tax"],
              rows: data.map((d) => [d.name, d.label]),
            }}
          >
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 90, bottom: 0, left: 8 }} barCategoryGap={18}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis type="category" dataKey="name" tick={AXIS} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(4,38,83,0.04)" }}
                  labelStyle={{ color: "#64748B" }}
                  itemStyle={{ color: INK, padding: 0 }}
                  formatter={(value) => [inr(Number(value)), "Tax"]}
                />
                <Bar dataKey="tax" radius={[0, 4, 4, 0]} maxBarSize={34} animationDuration={600}>
                  <Cell fill={BLUE} />
                  <Cell fill={GOLD} />
                  <LabelList dataKey="label" position="right" style={{ fill: INK, fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Link
              href="/blog/esop-buyback-india"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#B7800E] transition hover:text-[#8A5A00]"
            >
              Read the full buyback tax guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ChartCard>
        </div>

        <Sources
          items={[
            { title: "Treelife: Buyback tax in India, the three regimes", url: "https://treelife.in/taxation/buyback-tax-in-india/" },
            { title: "CalcGuru: ESOP buyback structures and tax (2026)", url: "https://calcguru.in/?p=7286" },
          ]}
        />
      </div>
    </section>
  );
}

/* ---------- 3. Vesting explorer ---------- */

const SCHEDULES = {
  monthly: { label: "1-year cliff, then monthly", step: 1 },
  quarterly: { label: "1-year cliff, then quarterly", step: 3 },
  yearly: { label: "25% every year", step: 12 },
} as const;

type ScheduleKey = keyof typeof SCHEDULES;

function vestedPercent(month: number, step: number) {
  if (month < 12) return 0;
  const periods = Math.floor(month / step);
  return Math.min(100, (periods * step * 100) / 48);
}

function VestingExplorer() {
  const [schedule, setSchedule] = useState<ScheduleKey>("monthly");
  const [leaveAt, setLeaveAt] = useState(30);
  const step = SCHEDULES[schedule].step;

  const data = useMemo(
    () =>
      Array.from({ length: 49 }, (_, month) => ({
        month,
        vested: Number(vestedPercent(month, step).toFixed(2)),
      })),
    [step],
  );

  const atLeave = vestedPercent(leaveAt, step);

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
      <SectionHead
        eyebrow="Vesting"
        title="See how much you'd keep if you left on a given month."
        lede="Most Indian startups use a 4-year schedule with a 1-year cliff. Indian rules require at least one year between grant and vesting. Pick a schedule and move the slider."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <ChartCard
          title="Share of your grant vested"
          subtitle={SCHEDULES[schedule].label}
          table={{
            head: ["Month", "% vested"],
            rows: data.filter((d) => d.month % 6 === 0).map((d) => [String(d.month), `${d.vested.toFixed(1)}%`]),
          }}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(SCHEDULES) as ScheduleKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSchedule(key)}
                aria-pressed={schedule === key}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  schedule === key
                    ? "bg-[#042653] text-white"
                    : "border border-slate-200 text-slate-600 hover:border-[#F2B421]"
                }`}
              >
                {SCHEDULES[key].label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="evcBlogVest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="month"
                type="number"
                domain={[0, 48]}
                ticks={[0, 12, 24, 36, 48]}
                tickFormatter={(v: number) => (v === 0 ? "Grant" : `Yr ${v / 12}`)}
                tick={AXIS}
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
                tick={AXIS}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }}
                labelStyle={{ color: "#64748B" }}
                itemStyle={{ color: INK, padding: 0 }}
                labelFormatter={(v) => `Month ${v}`}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Vested"]}
              />
              <ReferenceLine x={12} stroke="#CBD5E1" strokeDasharray="3 3" label={{ value: "Cliff", fill: "#64748B", fontSize: 11, position: "insideTopLeft" }} />
              <ReferenceLine x={leaveAt} stroke={GOLD} strokeWidth={1.5} label={{ value: `Leave · ${atLeave.toFixed(0)}%`, fill: GOLD, fontSize: 11, position: "insideTopRight" }} />
              <Area type="stepAfter" dataKey="vested" stroke={BLUE} strokeWidth={2} fill="url(#evcBlogVest)" animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div data-reveal className="evc-card flex flex-col rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <LightSlider
            label="If I leave in month"
            value={leaveAt}
            min={1}
            max={48}
            step={1}
            onChange={setLeaveAt}
            format={(v) => `${v} (${(v / 12).toFixed(1)} yrs)`}
          />
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#F2B421]/50 bg-[#FFF8E6] p-4">
              <p className="text-xs text-[#8A5A00]">Vested, yours to keep</p>
              <p key={`v-${atLeave}`} className="evc-swap mt-1 text-3xl font-semibold tabular-nums text-[#042653]">
                {atLeave.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F7F9FC] p-4">
              <p className="text-xs text-slate-500">Unvested, usually lost</p>
              <p key={`u-${atLeave}`} className="evc-swap mt-1 text-3xl font-semibold tabular-nums text-slate-500">
                {(100 - atLeave).toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-600">
            {leaveAt < 12
              ? "Before the cliff, nothing has vested. Leaving now usually means walking away with no options."
              : "Vested options are yours, but most schemes give you a limited window to exercise them after you leave."}
          </p>
          <Link
            href="/blog/vesting-schedule"
            className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-[#B7800E] transition hover:text-[#8A5A00]"
          >
            Read the vesting guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Reading paths ---------- */

function ReadingPaths() {
  const [active, setActive] = useState(0);
  const path = READING_PATHS[active];

  return (
    <section className="border-t border-slate-200 bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-28">
        <SectionHead
          eyebrow="Reading paths"
          title="Not sure where to start? Follow a path."
          lede="Four short reading orders, built around the moment you're in."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {READING_PATHS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={active === index}
                className={`shrink-0 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  active === index
                    ? "border-[#042653] bg-[#042653] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#F2B421]/70 hover:text-[#042653]"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <ol key={path.title} className="evc-panel relative grid gap-3">
            {path.steps.map((step, index) => (
              <li key={`${path.title}-${step.slug}-${index}`}>
                <Link
                  href={`/blog/${step.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#F2B421]/60 hover:shadow-[0_18px_40px_-28px_rgba(4,38,83,0.4)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F2B421]/60 bg-[#FFF8E6] text-sm font-semibold text-[#8A5A00] transition group-hover:bg-[#F2B421] group-hover:text-[#020d1f]">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-semibold text-[#042653]">{step.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#B7800E]" />
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2 px-2 pt-2 text-sm text-slate-500">
              <Check className="h-4 w-4 text-[#B7800E]" />
              About {path.steps.length * 4} minutes in total
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Shared pieces ---------- */

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede: string }) {
  return (
    <div data-reveal className="evc-card max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B7800E]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#042653] md:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-slate-600">{lede}</p>
    </div>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div data-reveal className="evc-card rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#042653]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  table,
  children,
}: {
  title: string;
  subtitle: string;
  table: { head: string[]; rows: string[][] };
  children: ReactNode;
}) {
  return (
    <figure data-reveal className="evc-card rounded-2xl border border-slate-200 bg-white p-6">
      <figcaption>
        <p className="text-sm font-semibold text-[#042653]">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </figcaption>
      <div className="mt-5">{children}</div>
      <details className="group mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer list-none font-medium text-slate-500 transition hover:text-[#042653]">
          <span className="group-open:hidden">View as table</span>
          <span className="hidden group-open:inline">Hide table</span>
        </summary>
        <table className="mt-3 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              {table.head.map((cell) => (
                <th key={cell} className="py-1.5 pr-3 font-semibold text-[#042653]">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-slate-100">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="py-1.5 pr-3 tabular-nums">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function LightSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold tabular-nums text-[#042653]">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="evc-range-light mt-3 w-full"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

function Sources({ items }: { items: { title: string; url: string }[] }) {
  return (
    <p className="mt-6 text-xs leading-6 text-slate-500">
      Sources:{" "}
      {items.map((item, index) => (
        <span key={item.url}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-300 underline-offset-2 transition hover:text-[#042653] hover:decoration-[#F2B421]"
          >
            {item.title}
          </a>
          {index < items.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}
