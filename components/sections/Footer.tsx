"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  Github,
  Globe2,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

/* ============================================================
   LINKS
   Only routes that exist in the app. Pricing anchors:
   #startup (Startup plan), #advisor (Advisor plan).
============================================================ */

// `workspace`: if the signed-in user has that paid workspace (or is the EVC
// owner), the link opens the workspace instead of the pricing section.
type PaidWorkspace = "company" | "advisor";

const WORKSPACE_HREF: Record<PaidWorkspace, string> = {
  company: "/company",
  advisor: "/advisor",
};

const LINK_COLUMNS: {
  title: string;
  links: { label: string; href: string; badge?: string; workspace?: PaidWorkspace }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "ESOP calculator", href: "/simulator", badge: "Free" },
      { label: "Cap table builder", href: "/cap-table", badge: "Free" },
      { label: "PRO Workspace", href: "/pro" },
      { label: "Offer Intelligence", href: "/pro/offers" },
      { label: "Reports", href: "/pro/reports" },
    ],
  },
  {
    title: "ESOP guides",
    links: [
      { label: "What is an ESOP?", href: "/blog/what-is-an-esop" },
      { label: "ESOP vesting schedule", href: "/blog/vesting-schedule" },
      { label: "ESOP exercise price", href: "/blog/esop-exercise-cost" },
      { label: "ESOP valuation in India", href: "/blog/esop-valuation-india" },
      { label: "ESOP vs RSU", href: "/blog/esop-vs-rsu" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "For employees", href: "/simulator" },
      { label: "For startups", href: "/pricing#startup", badge: "New", workspace: "company" },
      { label: "For advisory firms", href: "/pricing#advisor", workspace: "advisor" },
      { label: "For teams", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Book a meeting", href: "/meeting" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

const CUSTOMERS = ["Ather Energy", "Revolt Motors"];

const CONTACT_EMAIL = "sheshank@esopvalueclarity.com";

const MESSAGE_MAX = 5000;

// Optional enquiry topic, set by buttons elsewhere on the site
// (Advisor and Startup plans on /pricing) via an "evc:contact-prefill" event.
// The message box is prefilled with which plan it is about.
const TOPIC_LABELS: Record<string, string> = {
  CUSTOM_BILLING: "Custom billing / larger plan",
  FREE_TRIAL: "Free trial request",
};

const inputClass =
  "fx-input h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition duration-300 placeholder:text-slate-500 hover:border-white/20 focus:border-[#F2B421]/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#F2B421]/10";

/* ============================================================
   SMALL HOOKS
============================================================ */

/** Adds `is-in` to every [data-reveal] inside the root when it scrolls into view. */
function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
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
  }, [root]);
}

/** Tracks the cursor inside an element as CSS variables --mx / --my (no re-renders). */
function spotlight(event: ReactMouseEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/** Current time in India, updated every 30 s. Empty until mounted (avoids hydration mismatch). */
function useIndiaTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/* ============================================================
   FOOTER
============================================================ */

export default function Footer() {
  const [topic, setTopic] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState<string>("");
  const [chars, setChars] = useState(0);
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const indiaTime = useIndiaTime();
  const [paid, setPaid] = useState<Record<PaidWorkspace, boolean>>({
    company: false,
    advisor: false,
  });

  // Paying startups / advisory firms (and the EVC owner) get a direct link to
  // their workspace. Logged-out visitors and Google keep seeing /pricing.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/workspaces", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPaid({ company: data?.company === true, advisor: data?.advisor === true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useReveal(footerRef);

  useEffect(() => {
    function onPrefill(event: Event) {
      const detail = (event as CustomEvent<{ topic?: string; message?: string }>).detail;
      if (!detail) return;
      setTopic(detail.topic && TOPIC_LABELS[detail.topic] ? detail.topic : "");
      const box = formRef.current?.elements.namedItem("message");
      if (box instanceof HTMLTextAreaElement && detail.message) {
        box.value = detail.message;
        setChars(detail.message.length);
      }
      // Make sure the form is visible and draw the eye to it.
      formRef.current?.closest("[data-reveal]")?.classList.add("is-in");
      setFlash(false);
      window.requestAnimationFrame(() => setFlash(true));
      window.setTimeout(() => setFlash(false), 1600);
    }
    window.addEventListener("evc:contact-prefill", onPrefill);
    return () => window.removeEventListener("evc:contact-prefill", onPrefill);
  }, []);

  useEffect(() => {
    if (status !== "sent") return;
    const id = window.setTimeout(() => setStatus("idle"), 6000);
    return () => window.clearTimeout(id);
  }, [status]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }, []);

  const backToTop = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, []);

  async function handleContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();
    const website = String(form.get("website") || "").trim();

    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website, topic }),
      });

      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send your message right now.");
      }

      formElement.reset();
      setChars(0);
      setTopic("");
      setStatus("sent");
      setFeedback(
        result.message || "Thanks for contacting ESOP Value Clarity. Your message has been received."
      );
    } catch (error: unknown) {
      console.error("[FOOTER_CONTACT]", error);
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "We couldn't send your message. Please try again."
      );
    }
  }

  return (
    <footer ref={footerRef} className="evc-footer relative overflow-hidden bg-[#020d1f] text-white">
      {/* Ambient background */}
      <div className="fx-orb pointer-events-none absolute -left-48 top-0 h-[34rem] w-[34rem] rounded-full bg-[#5B9BFF]/[0.09] blur-[140px]" />
      <div className="fx-orb fx-orb-2 pointer-events-none absolute -right-48 top-[40%] h-[30rem] w-[30rem] rounded-full bg-[#F2B421]/[0.08] blur-[140px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F2B421]/40 to-transparent" />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* =====================================================
            CALL TO ACTION BAND (cursor spotlight)
        ====================================================== */}
        <div className="pt-16 md:pt-24">
          <div
            data-reveal
            onMouseMove={spotlight}
            className="fx-reveal fx-spot group/cta relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#042653] via-[#06306a] to-[#0a1d3f] px-6 py-10 sm:px-10 md:py-14"
          >
            <div className="fx-spot-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/cta:opacity-100" />
            <div className="fx-float pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#F2B421]/20 blur-[90px]" />
            <div className="fx-grid pointer-events-none absolute inset-0 opacity-[0.07]" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <h2 className="max-w-2xl text-3xl font-semibold leading-[1.1] tracking-[-0.035em] sm:text-4xl">
                  Equity is only worth something when people{" "}
                  <span className="fx-shine-text">understand it.</span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  Model a grant in minutes for free, or see how EVC runs ESOPs for your whole company.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Magnetic>
                  <Link
                    href="/simulator"
                    className="fx-btn-gold group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl bg-[#F2B421] px-6 text-sm font-semibold text-[#020d1f] shadow-[0_10px_30px_-10px_rgba(242,180,33,0.6)] transition hover:shadow-[0_18px_40px_-12px_rgba(242,180,33,0.75)]"
                  >
                    <span className="relative">Try the free simulator</span>
                    <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/meeting"
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10"
                  >
                    <CalendarDays className="h-4 w-4 transition group-hover:-rotate-6 group-hover:scale-110" />
                    Book a walkthrough
                  </Link>
                </Magnetic>
              </div>
            </div>

            <div className="relative mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-6 text-xs text-slate-400">
              <span>In use at</span>
              {CUSTOMERS.map((c, i) => (
                <span
                  key={c}
                  data-reveal
                  style={{ transitionDelay: `${250 + i * 120}ms` }}
                  className="fx-reveal fx-pop rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-semibold text-slate-200 transition hover:border-[#F2B421]/40 hover:text-white"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================
            BRAND + LINK COLUMNS
        ====================================================== */}
        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          <div data-reveal className="fx-reveal">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F2B421] text-sm font-black tracking-[-0.04em] text-[#042653] transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                EV
              </span>
              <span className="text-lg font-semibold tracking-[-0.02em]">ESOP Value Clarity</span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Equity decision software for India. Employees see what their grant is worth after tax.
              Startups run their cap table and ESOPs. Advisory firms manage ESOP work across clients.
            </p>

            {/* Email with copy button */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 pl-3">
              <Mail className="h-4 w-4 shrink-0 text-[#F2B421]" />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="truncate px-1.5 text-sm font-medium text-slate-200 transition hover:text-[#F2B421]"
              >
                {CONTACT_EMAIL}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={copied ? "Email copied" : "Copy email address"}
                className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                  copied ? "bg-emerald-400/15 text-emerald-300" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {copied ? <Check className="fx-pop-in h-4 w-4" /> : <Copy className="h-3.5 w-3.5" />}
                <span
                  className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#020d1f] transition duration-300 ${
                    copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                  }`}
                >
                  Copied
                </span>
              </button>
            </div>

            <div className="mt-6 flex gap-2">
              <SocialLink href="https://x.com/SheshankSi60747" label="ESOP Value Clarity founder on X">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2H21.5l-7.12 8.138L22.75 22h-6.554l-5.13-6.708L5.2 22H1.94l7.614-8.702L1.5 2h6.72l4.64 6.116L18.244 2z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://github.com/sidhushesank" label="Founder on GitHub">
                <Github className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://sheshank-portfolio.netlify.app/" label="Founder's website">
                <Globe2 className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {LINK_COLUMNS.map((col, ci) => (
              <div key={col.title} data-reveal className="fx-reveal" style={{ transitionDelay: `${ci * 90}ms` }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.workspace && paid[l.workspace] ? WORKSPACE_HREF[l.workspace] : l.href}
                        className="fx-link group inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                      >
                        <span className="fx-underline">{l.label}</span>
                        {l.badge ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                              l.badge === "New"
                                ? "fx-badge-new bg-[#F2B421] text-[#020d1f]"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {l.badge}
                          </span>
                        ) : null}
                        <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================
            CONTACT
        ====================================================== */}
        <div
          data-reveal
          onMouseMove={spotlight}
          className={`fx-reveal fx-spot group/contact relative grid gap-10 overflow-hidden rounded-[28px] border bg-white/[0.03] p-6 transition-colors duration-700 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:p-10 ${
            flash ? "fx-flash border-[#F2B421]/60" : "border-white/10"
          }`}
        >
          <div className="fx-spot-glow fx-spot-soft pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/contact:opacity-100" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F2B421]">Contact</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Talk to us</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Questions, a free trial, a custom plan or a partnership. Every message is read by the founder.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {["Free trials for startups and advisory firms", "Custom plans for larger teams", "Partner and referral enquiries"].map(
                (item, i) => (
                  <li
                    key={item}
                    data-reveal
                    style={{ transitionDelay: `${150 + i * 110}ms` }}
                    className="fx-reveal fx-slide flex items-start gap-2.5"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B421]" />
                    {item}
                  </li>
                )
              )}
            </ul>

            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#042653] text-sm font-semibold text-[#F2B421] ring-1 ring-white/10">
                SS
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#020d1f] bg-emerald-400">
                  <span className="fx-ping absolute inset-0 rounded-full bg-emerald-400" />
                </span>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Sheshank Sidheshwar</p>
                <p className="text-xs text-slate-500">
                  Founder, ESOP Value Clarity
                  {indiaTime ? <span className="text-slate-600"> · {indiaTime} in India</span> : null}
                </p>
              </div>
            </div>
          </div>

          <form ref={formRef} onSubmit={handleContact} className="relative">
            {topic && TOPIC_LABELS[topic] && (
              <div className="fx-pop-in mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#F2B421]/25 bg-[#F2B421]/10 px-4 py-2.5 text-xs font-semibold text-[#FFD877]">
                <span>Topic: {TOPIC_LABELS[topic]}</span>
                <button
                  type="button"
                  onClick={() => setTopic("")}
                  className="text-[11px] font-semibold text-[#FFD877]/80 underline-offset-2 hover:text-white hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400">Name</span>
                <input name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Your name" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400">Work email</span>
                <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@company.com" className={inputClass} />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                Message
                <span className={`tabular-nums transition ${chars > MESSAGE_MAX * 0.9 ? "text-amber-300" : "text-slate-600"}`}>
                  {chars.toLocaleString("en-IN")} / {MESSAGE_MAX.toLocaleString("en-IN")}
                </span>
              </span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={MESSAGE_MAX}
                rows={5}
                onChange={(e) => setChars(e.target.value.length)}
                placeholder="Tell us about your company and what you need..."
                className={`${inputClass} h-auto resize-none py-3 leading-6`}
              />
            </label>

            {/* Honeypot: hidden from people, bots fill it in */}
            <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0">
              <label>
                Website
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                Sent securely. We never share your details.
              </p>

              <button
                type="submit"
                disabled={status === "sending"}
                className={`fx-btn-gold group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-sm font-semibold text-[#020d1f] transition duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
                  status === "sent" ? "bg-emerald-400" : "bg-[#F2B421]"
                }`}
              >
                {status === "sent" ? (
                  <span className="fx-pop-in relative inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Message sent
                  </span>
                ) : status === "sending" ? (
                  <span className="relative inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#020d1f]/30 border-t-[#020d1f]" />
                    Sending...
                  </span>
                ) : (
                  <span className="relative inline-flex items-center gap-2">
                    <Send className="h-4 w-4 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12" />
                    {status === "error" ? "Try again" : "Send message"}
                  </span>
                )}
              </button>
            </div>

            {feedback ? (
              <div
                role="status"
                aria-live="polite"
                className={`fx-pop-in mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-5 ${
                  status === "sent" || (status === "idle" && feedback)
                    ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                    : "border-red-400/20 bg-red-400/[0.08] text-red-200"
                }`}
              >
                {status === "error" ? (
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback}</span>
              </div>
            ) : null}
          </form>
        </div>

        {/* =====================================================
            DISCLAIMER
        ====================================================== */}
        <div data-reveal className="fx-reveal mt-12 flex items-start gap-3 text-xs leading-6 text-slate-500">
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
          <p className="max-w-4xl">
            ESOP Value Clarity provides calculations, scenario modelling and decision-support tools. Modelled
            equity values, tax estimates, dilution and exit outcomes are not guarantees. We do not provide
            financial, investment, legal or tax advice. Check your company&apos;s official documents and take
            qualified professional advice before making material financial decisions.{" "}
            <Link href="/disclaimer" className="inline-flex items-center gap-0.5 text-slate-400 underline-offset-2 hover:text-white hover:underline">
              Read the full disclaimer
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
        </div>

        {/* =====================================================
            GIANT WORDMARK (gold light follows the cursor)
        ====================================================== */}
        <div
          data-reveal
          onMouseMove={spotlight}
          aria-hidden="true"
          className="fx-reveal fx-wordmark-wrap group/wm relative mt-14 select-none"
        >
          <p className="fx-wordmark text-center text-[10.8vw] font-black leading-[0.85] tracking-[-0.06em] lg:text-[134px]">
            ESOP Value Clarity
          </p>
        </div>

        {/* =====================================================
            BOTTOM BAR
        ====================================================== */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ESOP Value Clarity. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="fx-underline transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="fx-underline transition hover:text-white">Terms</Link>
            <Link href="/disclaimer" className="fx-underline transition hover:text-white">Disclaimer</Link>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span>Uppal, Hyderabad, Telangana, India 🇮🇳</span>
            <button
              type="button"
              onClick={backToTop}
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5 text-slate-300 transition hover:border-[#F2B421]/40 hover:text-white"
            >
              Back to top
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 transition group-hover:bg-[#F2B421] group-hover:text-[#020d1f]">
                <ArrowUp className="h-3.5 w-3.5 transition duration-300 group-hover:-translate-y-0.5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ---------- scroll reveal ---------- */
        .evc-footer .fx-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition:
            opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.7s ease;
        }
        .evc-footer .fx-reveal.fx-slide {
          transform: translateX(-14px);
        }
        .evc-footer .fx-reveal.fx-pop {
          transform: scale(0.9);
        }
        .evc-footer .fx-reveal.is-in {
          opacity: 1;
          transform: none;
        }

        /* ---------- cursor spotlight ---------- */
        .evc-footer .fx-spot-glow {
          background: radial-gradient(
            420px circle at var(--mx, 50%) var(--my, 50%),
            rgba(242, 180, 33, 0.16),
            transparent 60%
          );
        }
        .evc-footer .fx-spot-soft {
          background: radial-gradient(
            520px circle at var(--mx, 50%) var(--my, 50%),
            rgba(91, 155, 255, 0.08),
            transparent 60%
          );
        }

        /* ---------- background grid ---------- */
        .evc-footer .fx-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(to left, black, transparent 70%);
          animation: fx-grid-move 18s linear infinite;
        }
        @keyframes fx-grid-move {
          to {
            background-position: 36px 36px;
          }
        }

        /* ---------- floating orbs ---------- */
        .evc-footer .fx-orb {
          animation: fx-drift 16s ease-in-out infinite alternate;
        }
        .evc-footer .fx-orb-2 {
          animation-duration: 20s;
          animation-delay: -6s;
        }
        .evc-footer .fx-float {
          animation: fx-drift 10s ease-in-out infinite alternate;
        }
        @keyframes fx-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(40px, -30px, 0) scale(1.12);
          }
        }

        /* ---------- shimmering text ---------- */
        .evc-footer .fx-shine-text {
          background: linear-gradient(110deg, #f2b421 20%, #fff1c7 40%, #f2b421 60%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: fx-shine 4.5s linear infinite;
        }
        @keyframes fx-shine {
          from {
            background-position: 120% 0;
          }
          to {
            background-position: -120% 0;
          }
        }

        /* ---------- gold buttons: light sweep on hover ---------- */
        .evc-footer .fx-btn-gold::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.55) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }
        .evc-footer .fx-btn-gold:hover::before {
          transform: translateX(120%);
        }

        /* ---------- link underline slide ---------- */
        .evc-footer .fx-underline {
          background-image: linear-gradient(#f2b421, #f2b421);
          background-size: 0% 1px;
          background-position: 0 100%;
          background-repeat: no-repeat;
          transition: background-size 0.35s ease, color 0.2s ease;
          padding-bottom: 2px;
        }
        .evc-footer .fx-link:hover .fx-underline,
        .evc-footer a.fx-underline:hover {
          background-size: 100% 1px;
        }

        /* ---------- "New" badge glow ---------- */
        .evc-footer .fx-badge-new {
          animation: fx-glow 2.4s ease-in-out infinite;
        }
        @keyframes fx-glow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(242, 180, 33, 0.55);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(242, 180, 33, 0);
          }
        }

        /* ---------- online dot ---------- */
        .evc-footer .fx-ping {
          animation: fx-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes fx-ping {
          75%,
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* ---------- pop in ---------- */
        .evc-footer .fx-pop-in {
          animation: fx-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes fx-pop-in {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(4px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* ---------- contact flash when prefilled from pricing ---------- */
        .evc-footer .fx-flash {
          animation: fx-flash 1.6s ease-out;
        }
        @keyframes fx-flash {
          0% {
            box-shadow: 0 0 0 0 rgba(242, 180, 33, 0.5);
          }
          100% {
            box-shadow: 0 0 0 18px rgba(242, 180, 33, 0);
          }
        }

        /* ---------- giant wordmark ---------- */
        .evc-footer .fx-wordmark {
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.07);
          background:
            radial-gradient(
              260px circle at var(--mx, -999px) var(--my, -999px),
              rgba(242, 180, 33, 0.95),
              rgba(242, 180, 33, 0) 70%
            ),
            linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.015));
          -webkit-background-clip: text;
          background-clip: text;
          white-space: nowrap;
        }
        .evc-footer .fx-wordmark-wrap {
          overflow: hidden;
          mask-image: linear-gradient(to bottom, black 55%, transparent);
        }

        /* ---------- respect reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .evc-footer *,
          .evc-footer *::before {
            animation: none !important;
            transition: none !important;
          }
          .evc-footer .fx-reveal {
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </footer>
  );
}

/* ============================================================
   PIECES
============================================================ */

/** Gently pulls its child toward the cursor (desktop only). */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(event: ReactMouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.3;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="transition-transform duration-300 ease-out"
    >
      {children}
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition duration-300 hover:-translate-y-1 hover:border-[#F2B421]/50 hover:text-[#020d1f] hover:shadow-[0_12px_24px_-10px_rgba(242,180,33,0.6)]"
    >
      <span className="absolute inset-0 translate-y-full bg-[#F2B421] transition-transform duration-300 group-hover:translate-y-0" />
      <span className="relative">{children}</span>
    </a>
  );
}
