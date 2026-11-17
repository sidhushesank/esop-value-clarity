"use client";

import Image from "next/image";
import { ArrowUpRight, Check, FileText, Handshake, LineChart } from "lucide-react";

import Footer from "@/components/sections/Footer";

/* ============================================================
   PARTNER SETTINGS: edit these once TaxBuddy confirms them
============================================================ */

// The exact URL TaxBuddy wants us to link to.
const TAXBUDDY_URL = "https://www.taxbuddy.com/";

// Put their logo in /public/partners/ and set the path, e.g. "/partners/taxbuddy.svg".
// While this is null the page shows a plain "TaxBuddy" wordmark instead.
const TAXBUDDY_LOGO: string | null = null;

// TaxBuddy's description of themselves. Replace with the wording they approve.
const TAXBUDDY_ABOUT =
  "TaxBuddy is an online income-tax filing service in India. Their tax experts file returns, including ESOP and RSU capital gains and foreign assets, and help resolve income-tax notices.";

// What TaxBuddy does, from their public site. Get these confirmed by them.
const TAXBUDDY_DOES = [
  "Income-tax return filing, done with a tax expert",
  "ESOP and RSU capital gains, with the right cost basis",
  "Foreign RSUs: Schedule FA, Form 67 and foreign tax credit",
  "Replying to and resolving income-tax notices",
];

const EVC_DOES = [
  "What's vested today and what it's worth",
  "Cash needed to exercise, and the tax estimate on it",
  "How each funding round dilutes your stake",
  "Take-home in a weak, base and strong exit, after tax",
];

/* ============================================================
   PAGE
============================================================ */

export default function TaxBuddyPartnerPage() {
  return (
    <>
      <main>
        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden bg-[#020d1f] text-white">
          <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-blue-600/10 blur-[150px]" />
          <div className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-[#F2B421]/[0.07] blur-[150px]" />

          <div className="relative mx-auto max-w-[1200px] px-6 py-20 md:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F2B421]/25 bg-[#F2B421]/[0.08] px-4 py-2">
              <Handshake className="h-3.5 w-3.5 text-[#F2B421]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F2B421]">
                Partner
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-lg font-bold tracking-tight md:text-xl">
              <span>ESOP Value Clarity</span>
              <span className="text-slate-500">×</span>
              <TaxBuddyMark />
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-[64px]">
              Decide with EVC.
              <span className="block text-[#F2B421]">File with TaxBuddy.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              EVC helps you understand your ESOPs before you exercise, sell or leave.
              When it&apos;s time to file your tax return, TaxBuddy&apos;s experts take it from there.
            </p>

            <div className="mt-9">
              <VisitButton />
            </div>
          </div>
        </section>

        {/* ---------------- BEFORE / AFTER ---------------- */}
        <section className="mx-auto max-w-[1200px] px-6 py-20 md:py-24">
          <div className="grid gap-5 md:grid-cols-2">
            <SideCard
              tag="Before the event"
              name="ESOP Value Clarity"
              icon={<LineChart className="h-5 w-5" />}
              blurb="Used while you're deciding: before you exercise, sell, take an offer or leave."
              items={EVC_DOES}
              accent="navy"
            />
            <SideCard
              tag="After the event"
              name="TaxBuddy"
              icon={<FileText className="h-5 w-5" />}
              blurb={TAXBUDDY_ABOUT}
              items={TAXBUDDY_DOES}
              accent="gold"
            />
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[24px] bg-[#042653] p-8 text-white md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.03em]">Need to file your tax return?</h2>
              <p className="mt-2 max-w-xl text-slate-300">
                Head to TaxBuddy. Their tax experts handle filing and income-tax notices.
              </p>
            </div>
            <VisitButton />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ============================================================
   PIECES
============================================================ */

function VisitButton() {
  return (
    <a
      href={TAXBUDDY_URL}
      target="_blank"
      rel="sponsored noopener"
      className="group inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#F2B421] px-6 text-sm font-black text-[#020d1f] shadow-[0_15px_40px_-15px_rgba(242,180,33,.7)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ffc53d] active:translate-y-0 active:scale-95"
    >
      Visit TaxBuddy
      <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function TaxBuddyMark() {
  if (TAXBUDDY_LOGO) {
    return <Image src={TAXBUDDY_LOGO} alt="TaxBuddy" width={140} height={36} className="h-8 w-auto" />;
  }
  return <span>TaxBuddy</span>;
}

function SideCard({
  tag,
  name,
  icon,
  blurb,
  items,
  accent,
}: {
  tag: string;
  name: string;
  icon: React.ReactNode;
  blurb: string;
  items: string[];
  accent: "navy" | "gold";
}) {
  const tagClass =
    accent === "navy"
      ? "bg-[#042653]/[0.06] text-[#042653]"
      : "bg-[#F2B421]/[0.14] text-[#7a5600]";
  const iconClass =
    accent === "navy" ? "bg-[#042653] text-white" : "bg-[#F2B421] text-[#020d1f]";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm md:p-8">
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tagClass}`}>
          {tag}
        </span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </span>
      </div>
      <h3 className="mt-6 text-2xl font-black tracking-[-0.03em] text-slate-950">{name}</h3>
      <p className="mt-2 leading-7 text-slate-600">{blurb}</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
