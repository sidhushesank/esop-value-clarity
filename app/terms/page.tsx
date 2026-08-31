import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Ban,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const LAST_UPDATED = "31 August 2026";

const sections = [
  {
    id: "acceptance",
    number: "01",
    title: "Acceptance of Terms",
  },
  {
    id: "service",
    number: "02",
    title: "The service",
  },
  {
    id: "accounts",
    number: "03",
    title: "Accounts & access",
  },
  {
    id: "free-pro",
    number: "04",
    title: "Free & PRO features",
  },
  {
    id: "calculations",
    number: "05",
    title: "Calculations & modelling",
  },
  {
    id: "offer-intelligence",
    number: "06",
    title: "Offer Intelligence",
  },
  {
    id: "documents",
    number: "07",
    title: "Documents & user content",
  },
  {
    id: "payments",
    number: "08",
    title: "Payments & subscriptions",
  },
  {
    id: "acceptable-use",
    number: "09",
    title: "Acceptable use",
  },
  {
    id: "intellectual-property",
    number: "10",
    title: "Intellectual property",
  },
  {
    id: "availability",
    number: "11",
    title: "Availability & changes",
  },
  {
    id: "third-parties",
    number: "12",
    title: "Third-party services",
  },
  {
    id: "disclaimers",
    number: "13",
    title: "Important disclaimers",
  },
  {
    id: "liability",
    number: "14",
    title: "Limitation of liability",
  },
  {
    id: "termination",
    number: "15",
    title: "Suspension & termination",
  },
  {
    id: "changes",
    number: "16",
    title: "Changes to these Terms",
  },
  {
    id: "contact",
    number: "17",
    title: "Contact",
  },
];

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span className="mt-1 font-mono text-xs font-black tracking-[0.16em] text-blue-600">
        {number}
      </span>

      <h2 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-[28px]">
        {title}
      </h2>
    </div>
  );
}

function Bullet({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
      <span>{children}</span>
    </li>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      {/* =====================================================
          TRUST CENTER NAVIGATION
      ====================================================== */}

      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ESOP Value Clarity
          </Link>

          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <Link
              href="/privacy"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm"
            >
              Terms
            </Link>

            <Link
              href="/disclaimer"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#030817]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="absolute right-[-100px] top-[-80px] h-[460px] w-[460px] rounded-full bg-violet-600/10 blur-[130px]" />

          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-4 py-2">
              <Scale className="h-4 w-4 text-blue-300" />

              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">
                Trust Center · Terms of Use
              </span>
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Clear rules for a product built around clarity.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
              These Terms explain the conditions that apply when you
              access ESOP Value Clarity, use its calculators, create
              scenarios, save analyses, access PRO functionality or use
              Offer Intelligence.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                Effective: {LAST_UPDATED}
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                ESOP Value Clarity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT PRINCIPLES
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Calculator,
              label: "Modelling",
              title: "Inputs drive outputs",
              text: "Calculations depend on the assumptions and information supplied to the product.",
            },
            {
              icon: FileCheck2,
              label: "Offer Intelligence",
              title: "Confirm before comparing",
              text: "Important extracted offer terms should be reviewed before they are used in comparison.",
            },
            {
              icon: Gauge,
              label: "Decision support",
              title: "Signals, not instructions",
              text: "Product scores and comparisons support analysis rather than making employment decisions for you.",
            },
            {
              icon: ShieldCheck,
              label: "Responsibility",
              title: "Official documents prevail",
              text: "Employer agreements, plan documents and professional advice remain authoritative.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-45px_rgba(15,23,42,.4)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  {item.label}
                </p>

                <h2 className="mt-2 text-lg font-black tracking-tight">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          TERMS
      ====================================================== */}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* SIDEBAR */}

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Terms of Use
            </p>

            <nav className="mt-4 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="font-mono text-[10px] font-black text-slate-300 transition group-hover:text-blue-600">
                    {section.number}
                  </span>

                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}

        <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_-65px_rgba(15,23,42,.45)]">
          {/* INTRO */}

          <div className="border-b border-slate-200 p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Agreement
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Terms for using ESOP Value Clarity
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  Please read these Terms together with our Privacy Policy
                  and Disclaimer. By accessing or using ESOP Value
                  Clarity, you agree to these Terms to the extent
                  permitted by applicable law.
                </p>
              </div>
            </div>
          </div>

          {/* 01 */}

          <section
            id="acceptance"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="01"
              title="Acceptance of Terms"
            />

            <p className="leading-7 text-slate-600">
              These Terms of Use govern your access to and use of ESOP
              Value Clarity, including the public website, calculators,
              account functionality, saved analyses, PRO workspace,
              Offer Intelligence and other features made available
              through the service.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              If you do not agree with these Terms, you should not use
              the service.
            </p>
          </section>

          {/* 02 */}

          <section
            id="service"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="02"
              title="The service"
            />

            <p className="leading-7 text-slate-600">
              ESOP Value Clarity is an equity education,
              scenario-modelling and decision-support product designed
              to help users understand financial and economic concepts
              associated with employee equity and employment offers.
            </p>

            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <Bullet>
                equity and ESOP scenario modelling;
              </Bullet>

              <Bullet>
                vesting and ownership calculations;
              </Bullet>

              <Bullet>
                dilution and exit-value modelling;
              </Bullet>

              <Bullet>
                tax-related estimation tools where available;
              </Bullet>

              <Bullet>
                saved calculations and analysis history;
              </Bullet>

              <Bullet>
                document-assisted Offer Intelligence;
              </Bullet>

              <Bullet>
                side-by-side offer comparison and decision-support
                signals.
              </Bullet>
            </ul>

            <div className="mt-6 rounded-[22px] border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <p className="text-sm leading-7 text-slate-600">
                  Product functionality may evolve over time. The
                  availability and implementation of individual
                  features may therefore change.
                </p>
              </div>
            </div>
          </section>

          {/* 03 */}

          <section
            id="accounts"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="03"
              title="Accounts & access"
            />

            <p className="leading-7 text-slate-600">
              Certain functionality may require an account. You are
              responsible for providing accurate account information
              and for maintaining the confidentiality and security of
              your credentials.
            </p>

            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <Bullet>
                Do not share your password or authentication credentials
                with other people.
              </Bullet>

              <Bullet>
                You are responsible for activity performed through your
                account unless applicable law provides otherwise.
              </Bullet>

              <Bullet>
                Notify us if you reasonably believe your account has
                been compromised.
              </Bullet>

              <Bullet>
                You must not access or attempt to access another user's
                account or saved information without authorization.
              </Bullet>
            </ul>
          </section>

          {/* 04 */}

          <section
            id="free-pro"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="04"
              title="Free & PRO features"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                <BadgeCheck className="h-6 w-6 text-slate-700" />

                <h3 className="mt-4 font-black">
                  Free experience
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Certain calculators, educational material or other
                  functionality may be made available without a paid
                  subscription, subject to applicable product limits.
                </p>
              </div>

              <div className="rounded-[22px] border border-violet-200 bg-violet-50/50 p-6">
                <BriefcaseBusiness className="h-6 w-6 text-violet-700" />

                <h3 className="mt-4 font-black">
                  PRO workspace
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  PRO may provide additional functionality such as
                  advanced modelling, saved analyses, Offer
                  Intelligence, reports or other premium product
                  capabilities.
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600">
              Feature availability, usage limits and the distinction
              between Free and PRO functionality may change as the
              product develops.
            </p>
          </section>

          {/* 05 */}

          <section
            id="calculations"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="05"
              title="Calculations & modelling"
            />

            <p className="leading-7 text-slate-600">
              Calculations generated by ESOP Value Clarity depend on
              user-provided values, assumptions and modelling rules.
              Results can change materially when those assumptions
              change.
            </p>

            <div className="mt-6 rounded-[24px] bg-[#07101f] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                Modelling principle
              </p>

              <h3 className="mt-2 text-xl font-black">
                A scenario is not a prediction.
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Exit values, company valuations, dilution assumptions,
                ownership percentages, tax estimates and other modelled
                outcomes are analytical scenarios. They are not
                guarantees that a company, security or ESOP will achieve
                the modelled outcome.
              </p>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              You are responsible for checking the inputs used in any
              calculation and determining whether the assumptions are
              appropriate for your circumstances.
            </p>
          </section>

          {/* 06 */}

          <section
            id="offer-intelligence"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="06"
              title="Offer Intelligence"
            />

            <p className="leading-7 text-slate-600">
              Offer Intelligence assists with extracting, reviewing,
              structuring and comparing employment-offer information.
              The feature may analyse information including fixed
              compensation, variable compensation, bonuses, employer
              contributions, equity grants, strike price, FMV,
              vesting, dilution and exercise conditions.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/50 p-6">
                <FileCheck2 className="h-6 w-6 text-emerald-700" />

                <h3 className="mt-4 font-black">
                  You review the terms
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Extracted information should be confirmed, corrected
                  or rejected before relying on it for comparison.
                </p>
              </div>

              <div className="rounded-[22px] border border-amber-200 bg-amber-50/60 p-6">
                <CircleAlert className="h-6 w-6 text-amber-700" />

                <h3 className="mt-4 font-black">
                  Missing stays visible
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Missing information can reduce comparison confidence.
                  An incomplete offer should not be treated as though
                  unknown terms were zero or economically irrelevant.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-violet-200 bg-violet-50/50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-700">
                Comparison signals
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Labels such as a stronger current comparison signal,
                cash leader, equity opportunity or similar product
                outputs describe the result of the current comparison
                methodology and confirmed inputs.
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-slate-900">
                They are not instructions or recommendations to accept,
                reject, resign from or choose a particular job.
              </p>
            </div>
          </section>

          {/* 07 */}

          <section
            id="documents"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="07"
              title="Documents & user content"
            />

            <p className="leading-7 text-slate-600">
              You may be able to provide information or upload documents
              for analysis. You remain responsible for the content you
              submit.
            </p>

            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <Bullet>
                You should only provide information that you are
                authorized to provide.
              </Bullet>

              <Bullet>
                Do not intentionally upload unlawful, malicious or
                infringing material.
              </Bullet>

              <Bullet>
                Avoid including information that is unnecessary for the
                requested analysis.
              </Bullet>

              <Bullet>
                Official employer documents remain the authoritative
                source for the legal terms of your compensation and
                equity arrangements.
              </Bullet>
            </ul>

            <p className="mt-6 text-sm leading-7 text-slate-600">
              You retain any rights you hold in information and
              documents you provide. You grant ESOP Value Clarity the
              limited permission necessary to process that material for
              the functionality you request, subject to the Privacy
              Policy.
            </p>
          </section>

          {/* 08 */}

          <section
            id="payments"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="08"
              title="Payments & subscriptions"
            />

            <div className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
              <CreditCard className="mt-1 h-5 w-5 shrink-0 text-blue-600" />

              <div>
                <p className="leading-7 text-slate-600">
                  Where paid plans or subscriptions are offered, the
                  applicable price, billing period and plan information
                  presented during purchase form part of your
                  subscription arrangement.
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Payment processing may be performed through a
                  third-party payment provider. Additional terms from
                  that provider may apply to the payment transaction.
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              Promotional access, administrative grants, trials or other
              non-standard PRO access may be subject to separate
              conditions and may expire or be withdrawn according to
              those conditions.
            </p>
          </section>

          {/* 09 */}

          <section
            id="acceptable-use"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="09"
              title="Acceptable use"
            />

            <p className="leading-7 text-slate-600">
              You agree not to misuse ESOP Value Clarity. In particular,
              you must not knowingly:
            </p>

            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <Bullet>
                attempt to gain unauthorized access to accounts,
                databases, servers or restricted product functionality;
              </Bullet>

              <Bullet>
                interfere with the security, availability or normal
                operation of the service;
              </Bullet>

              <Bullet>
                introduce malware, harmful code or automated activity
                intended to overload or damage the service;
              </Bullet>

              <Bullet>
                use the service for unlawful, fraudulent or abusive
                activity;
              </Bullet>

              <Bullet>
                attempt to access another user's private calculations,
                offers or account information without authorization;
              </Bullet>

              <Bullet>
                falsely represent ESOP Value Clarity calculations or
                comparison signals as certified financial, tax, legal or
                investment advice.
              </Bullet>
            </ul>

            <div className="mt-6 flex items-start gap-4 rounded-[22px] border border-red-200 bg-red-50/60 p-6">
              <Ban className="mt-1 h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm leading-7 text-slate-600">
                Access may be restricted where necessary to protect the
                service, other users or the integrity of the platform.
              </p>
            </div>
          </section>

          {/* 10 */}

          <section
            id="intellectual-property"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="10"
              title="Intellectual property"
            />

            <p className="leading-7 text-slate-600">
              ESOP Value Clarity, including its product design,
              interface, original text, software, calculations,
              visualisations, branding and product-specific
              functionality, may be protected by intellectual property
              and other applicable rights.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              These Terms give you permission to use the service for its
              intended purpose. They do not transfer ownership of the
              product, software or branding to you.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Third-party software, libraries, trademarks and other
              materials remain subject to the rights and licences of
              their respective owners.
            </p>
          </section>

          {/* 11 */}

          <section
            id="availability"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="11"
              title="Availability & changes"
            />

            <p className="leading-7 text-slate-600">
              We aim to provide a reliable service, but uninterrupted or
              error-free availability cannot be guaranteed.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Features may be added, changed, limited, redesigned,
              suspended or removed as the product develops. Maintenance,
              infrastructure failures, third-party outages, security
              events or other circumstances may temporarily affect
              availability.
            </p>
          </section>

          {/* 12 */}

          <section
            id="third-parties"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="12"
              title="Third-party services"
            />

            <p className="leading-7 text-slate-600">
              The service may depend on or link to third-party
              infrastructure, payment providers, hosting services or
              external websites.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Third-party services are governed by their own terms,
              policies and availability. ESOP Value Clarity does not
              control independent third-party websites or services
              merely because they are linked from or integrated with
              the product.
            </p>
          </section>

          {/* 13 */}

          <section
            id="disclaimers"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="13"
              title="Important disclaimers"
            />

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-4">
                <CircleAlert className="mt-1 h-6 w-6 shrink-0 text-amber-700" />

                <div>
                  <h3 className="text-lg font-black text-amber-950">
                    ESOP outcomes are uncertain by nature.
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-amber-950/80">
                    Company performance, future fundraising, dilution,
                    vesting, liquidity, taxes, exercise requirements,
                    employment conditions and exit outcomes can
                    materially affect the value ultimately realised from
                    employee equity.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 leading-7 text-slate-600">
              ESOP Value Clarity provides educational calculations,
              scenario modelling and decision-support tools. It does not
              provide individualized financial, investment, legal,
              employment or tax advice.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Please read the separate{" "}
              <Link
                href="/disclaimer"
                className="font-black text-blue-600 hover:text-blue-700"
              >
                Product Disclaimer
              </Link>{" "}
              for additional information.
            </p>
          </section>

          {/* 14 */}

          <section
            id="liability"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="14"
              title="Limitation of liability"
            />

            <p className="leading-7 text-slate-600">
              To the maximum extent permitted by applicable law, ESOP
              Value Clarity is provided without guarantees concerning
              investment outcomes, company performance, employment
              outcomes or the future realizable value of equity.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              You remain responsible for decisions made using
              information produced by or entered into the service,
              including decisions concerning employment, exercise of
              options, sale or holding of securities, tax matters,
              financial planning or investment.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Nothing in these Terms excludes or limits liability where
              doing so would be prohibited by applicable law.
            </p>
          </section>

          {/* 15 */}

          <section
            id="termination"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="15"
              title="Suspension & termination"
            />

            <p className="leading-7 text-slate-600">
              Access to some or all of the service may be suspended,
              restricted or terminated where reasonably necessary,
              including in response to misuse, security concerns,
              violation of these Terms or discontinuation of a feature
              or service.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Where applicable, account or subscription functionality
              may also end according to the applicable plan,
              cancellation or expiration conditions.
            </p>
          </section>

          {/* 16 */}

          <section
            id="changes"
            className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
          >
            <SectionHeading
              number="16"
              title="Changes to these Terms"
            />

            <p className="leading-7 text-slate-600">
              These Terms may be updated as ESOP Value Clarity evolves,
              including when product functionality, pricing,
              infrastructure or legal requirements change.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              Updated Terms will be published on this page with a revised
              effective date. Continued use of the service after an
              updated version becomes effective may constitute
              acceptance to the extent permitted by applicable law.
            </p>
          </section>

          {/* 17 */}

          <section
            id="contact"
            className="scroll-mt-8 p-7 sm:p-10"
          >
            <SectionHeading
              number="17"
              title="Contact"
            />

            <p className="leading-7 text-slate-600">
              Questions about these Terms or ESOP Value Clarity can be
              sent to:
            </p>

            <a
              href="mailto:esopvalueclarity@gmail.com"
              className="group mt-6 flex max-w-xl items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Product enquiries
                  </p>

                  <p className="mt-1 font-black text-slate-950">
                    esopvalueclarity@gmail.com
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
            </a>
          </section>
        </article>
      </section>

      {/* =====================================================
          NEXT DOCUMENT
      ====================================================== */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 rounded-[26px] bg-slate-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <Landmark className="mt-1 h-5 w-5 shrink-0 text-blue-300" />

              <div>
                <h2 className="font-black">
                  Understand what the numbers cannot promise.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Our Disclaimer explains the limitations of ESOP
                  valuations, tax estimates, dilution scenarios, exit
                  modelling and Offer Intelligence comparison signals.
                </p>
              </div>
            </div>

            <Link
              href="/disclaimer"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black transition hover:bg-blue-500"
            >
              Read Disclaimer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} ESOP Value Clarity
            </p>

            <div className="flex gap-5">
              <Link
                href="/privacy"
                className="transition hover:text-slate-950"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="font-bold text-slate-950"
              >
                Terms
              </Link>

              <Link
                href="/disclaimer"
                className="transition hover:text-slate-950"
              >
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}