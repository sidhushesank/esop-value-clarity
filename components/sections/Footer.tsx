"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Github,
  Globe2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Send,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

const companyLinks = [
  { label: "Home", href: "/" },
  { label: "Simulator", href: "/simulator" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

const productLinks = [
  { label: "PRO Workspace", href: "/pro" },
  { label: "Offer Intelligence", href: "/pro/offers" },
  { label: "Reports", href: "/pro/reports" },
];

const TOPIC_LABELS: Record<string, string> = {
  CUSTOM_BILLING: "Custom billing cycle / more client companies",
  FREE_TRIAL: "Advisor free trial request",
};

export default function Footer() {
  // Optional enquiry topic, set by buttons elsewhere on the site
  // (e.g. the Advisor plan on /pricing) via a "evc:contact-prefill" event.
  const [topic, setTopic] = useState<string>("");
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<{ topic?: string; message?: string }>)
        .detail;
      if (!detail) return;
      setTopic(
        detail.topic && TOPIC_LABELS[detail.topic] ? detail.topic : ""
      );
      const box = formRef.current?.elements.namedItem("message");
      if (box instanceof HTMLTextAreaElement && detail.message) {
        box.value = detail.message;
      }
    }
    window.addEventListener("evc:contact-prefill", onPrefill);
    return () => window.removeEventListener("evc:contact-prefill", onPrefill);
  }, []);

  const [status, setStatus] =
    useState<
      "idle" | "sending" | "sent" | "error"
    >("idle");

  const [
    feedback,
    setFeedback,
  ] =
    useState<string>("");

  async function handleContact(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (status === "sending") {
      return;
    }

    const formElement =
      event.currentTarget;

    const form =
      new FormData(formElement);

    const name =
      String(
        form.get("name") || ""
      ).trim();

    const email =
      String(
        form.get("email") || ""
      ).trim();

    const message =
      String(
        form.get("message") || ""
      ).trim();

    const website =
      String(
        form.get("website") || ""
      ).trim();

    setStatus("sending");
    setFeedback("");

    try {
      const response =
        await fetch(
          "/api/contact",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              message,
              website,
              topic,
            }),
          }
        );

      const result =
        (await response.json()) as {
          success?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to send your message right now."
        );
      }

      formElement.reset();
      setTopic("");

      setStatus("sent");

      setFeedback(
        result.message ||
          "Thanks for contacting ESOP Value Clarity. Your message has been received."
      );
    } catch (error: unknown) {
      console.error(
        "[FOOTER_CONTACT]",
        error
      );

      setStatus("error");

      setFeedback(
        error instanceof Error
          ? error.message
          : "We couldn't send your message. Please try again."
      );
    }
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050b16] text-white">
      <div className="footer-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-cyan-500/[0.07] blur-[140px]" />

      <div className="relative mx-auto max-w-[1480px] px-6 pb-8 pt-16 md:pt-20">
        {/* =====================================================
            COMPANY HEADER
        ====================================================== */}
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-blue-400/20 bg-blue-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-400/5" />
                <span className="relative text-sm font-black tracking-[-0.04em] text-blue-200">
                  EV
                </span>
              </div>

              <div>
                <p className="text-xl font-black tracking-[-0.035em]">
                  ESOP Value Clarity
                </p>
                <div className="mt-1 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Equity decision intelligence
                </div>
              </div>
            </div>

            <h2 className="mt-8 max-w-3xl text-3xl font-black tracking-[-0.045em] text-white md:text-4xl">
              Understand the economics behind your equity.
              <span className="block text-slate-500">
                Then make the decision yourself.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
              ESOP Value Clarity is an employee-focused decision-support
              platform for understanding grants, vesting, ownership, dilution,
              exercise economics, exit scenarios and complete compensation
              offers without presenting uncertain equity as guaranteed value.
            </p>
          </div>

          <div className="rounded-[22px] border border-blue-400/15 bg-blue-400/[0.05] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                  PRODUCT PRINCIPLE
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  Scenarios over false certainty.
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Assumptions remain visible. Missing information remains
                  unknown. Modeled outcomes are not presented as guaranteed
                  future proceeds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            MAIN FOOTER GRID
        ====================================================== */}
        <div className="grid gap-10 py-12 lg:grid-cols-[0.72fr_0.72fr_1.56fr]">
          {/* Navigation */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              COMPANY
            </p>

            <div className="mt-5 space-y-3">
              {companyLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex w-fit items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
                >
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            <p className="mt-9 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              PRODUCT
            </p>

            <div className="mt-5 space-y-3">
              {productLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex w-fit items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          {/* Company / founder contact */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              CONTACT
            </p>

            <a
              href="mailto:esopvalueclarity@gmail.com"
              className="group mt-5 flex items-start gap-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-300 transition group-hover:border-blue-400/20 group-hover:bg-blue-400/10">
                <Mail className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs text-slate-500">
                  Product enquiries
                </span>
                <span className="mt-1 block break-all text-sm font-bold text-slate-200 transition group-hover:text-white">
                  esopvalueclarity@gmail.com
                </span>
              </span>
            </a>

            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-xs text-slate-500">Founded & built by</p>
              <p className="mt-1 text-sm font-black text-white">
                Sheshank Sidheshwar
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Independent product founder
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              <a
                href="https://github.com/sidhushesank"
                target="_blank"
                rel="noreferrer"
                aria-label="Sheshank Sidheshwar on GitHub"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:-translate-y-1 hover:border-white/20 hover:text-white"
              >
                <Github className="h-4 w-4" />
              </a>

              <a
                href="https://sheshank-portfolio.netlify.app/"
                target="_blank"
                rel="noreferrer"
                aria-label="Sheshank Sidheshwar portfolio"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:-translate-y-1 hover:border-blue-400/20 hover:text-blue-300"
              >
                <Globe2 className="h-4 w-4" />
              </a>

              <a
                href="https://x.com/SheshankSi60747"
                target="_blank"
                rel="noreferrer"
                aria-label="Sheshank Sidheshwar on X"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:-translate-y-1 hover:border-white/20 hover:text-white"
              >
                <svg
                  className="h-3.5 w-3.5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2H21.5l-7.12 8.138L22.75 22h-6.554l-5.13-6.708L5.2 22H1.94l7.614-8.702L1.5 2h6.72l4.64 6.116L18.244 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-[60px]" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  CONTACT THE PRODUCT
                </div>
                <h3 className="mt-2 text-xl font-black text-white">
                  Have a question or product idea?
                </h3>
                <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">
                  Send feedback, partnership enquiries or questions about ESOP
                  Value Clarity.
                </p>
              </div>

              <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-300 sm:inline-flex sm:items-center sm:gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Founder inbox
              </span>
            </div>

            <form ref={formRef} onSubmit={handleContact} className="relative mt-6">
              {topic && TOPIC_LABELS[topic] && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-200">
                  <span>Topic: {TOPIC_LABELS[topic]}</span>
                  <button
                    type="button"
                    onClick={() => setTopic("")}
                    className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-300/80 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    NAME
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f]/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    EMAIL
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#07111f]/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                  />
                </label>
              </div>

              <label className="mt-3 block">
                <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                  MESSAGE
                </span>
                <textarea
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  placeholder="Tell us what you would like to discuss..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#07111f]/80 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                />
              </label>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
              >
                <label>
                  Website
                  <input
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[10px] leading-5 text-slate-500">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  Sent securely through the site to the ESOP Value Clarity inbox.
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(37,99,235,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {status === "sent" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Message sent
                    </>
                  ) : status === "sending" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : status === "error" ? (
                    <>
                      <Send className="h-4 w-4" />
                      Try again
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Contact us
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              {feedback ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-5 ${
                    status === "sent"
                      ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-200"
                      : "border-red-400/15 bg-red-400/[0.07] text-red-200"
                  }`}
                >
                  {status === "sent" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  )}

                  <span>{feedback}</span>
                </div>
              ) : null}
            </form>
          </div>
        </div>

        {/* =====================================================
            IMPORTANT NOTICE
        ====================================================== */}
        <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[0.045] p-5">
          <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/15 bg-amber-400/[0.08] text-amber-300">
              <TriangleAlert className="h-4.5 w-4.5" />
            </span>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">
                IMPORTANT INFORMATION
              </p>
              <p className="mt-2 text-sm font-black text-white">
                ESOP outcomes are uncertain by nature.
              </p>
              <p className="mt-2 max-w-5xl text-xs leading-6 text-slate-400">
                ESOP Value Clarity provides educational calculations, scenario
                modelling and decision-support tools. Modeled equity values,
                tax estimates, dilution assumptions, company valuations and
                exit outcomes are not guarantees. The platform does not provide
                financial, investment, legal or tax advice. Consider your
                company&apos;s official documents and qualified professional
                advice before making material financial decisions.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            LEGAL / BOTTOM BAR
        ====================================================== */}
        <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-slate-300">
              © {new Date().getFullYear()} ESOP Value Clarity
            </p>
            <p className="mt-1 text-[10px] text-slate-600">
              Built for clearer employee equity decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-slate-500">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>

            <span className="hidden h-3 w-px bg-white/10 sm:block" />

            <span className="flex items-center gap-1.5 text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              Decision support, not financial advice
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .footer-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.022) 1px,
              transparent 1px
            );
          background-size: 34px 34px;
          mask-image: linear-gradient(to bottom, black, transparent 92%);
        }
      `}</style>
    </footer>
  );
}