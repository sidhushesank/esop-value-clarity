import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  Fingerprint,
  LockKeyhole,
  Mail,
  ScanLine,
  Server,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

const LAST_UPDATED = "31 August 2026";

const sections = [
  {
    id: "information-we-collect",
    number: "01",
    title: "Information we collect",
  },
  {
    id: "accounts",
    number: "02",
    title: "Accounts & authentication",
  },
  {
    id: "calculations",
    number: "03",
    title: "Calculations & saved data",
  },
  {
    id: "offer-intelligence",
    number: "04",
    title: "Offer Intelligence",
  },
  {
    id: "documents",
    number: "05",
    title: "Offer documents",
  },
  {
    id: "contact",
    number: "06",
    title: "Contact enquiries",
  },
  {
    id: "how-we-use-data",
    number: "07",
    title: "How information is used",
  },
  {
    id: "third-parties",
    number: "08",
    title: "Service providers",
  },
  {
    id: "retention",
    number: "09",
    title: "Retention & deletion",
  },
  {
    id: "security",
    number: "10",
    title: "Security",
  },
  {
    id: "choices",
    number: "11",
    title: "Your choices",
  },
  {
    id: "changes",
    number: "12",
    title: "Policy changes",
  },
  {
    id: "contact-us",
    number: "13",
    title: "Contact us",
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      {/* =====================================================
          TOP NAVIGATION
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
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-slate-950"
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
              <ShieldCheck className="h-4 w-4 text-blue-300" />

              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">
                Trust Center · Privacy
              </span>
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Your financial context deserves careful handling.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
              This Privacy Policy explains how ESOP Value Clarity
              handles information when you use our equity calculators,
              saved analyses, PRO workspace, Offer Intelligence and
              product contact features.
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
          TRUST SNAPSHOT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Fingerprint,
              label: "Account data",
              title: "Used to operate your account",
              text: "Identity and authentication information support account access and product functionality.",
            },
            {
              icon: ScanLine,
              label: "Offer Intelligence",
              title: "Review before modelling",
              text: "Extracted offer terms are presented for review so important values can be confirmed or corrected.",
            },
            {
              icon: Database,
              label: "Structured data",
              title: "Saved when required",
              text: "Confirmed calculations and offer information may be persisted to provide saved product experiences.",
            },
            {
              icon: ShieldCheck,
              label: "Transparency",
              title: "Unknown stays unknown",
              text: "The product is designed to surface missing information rather than silently inventing financial terms.",
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
          MAIN POLICY
      ====================================================== */}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* SIDEBAR */}

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Privacy policy
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
          <div className="border-b border-slate-200 p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Policy overview
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Privacy at ESOP Value Clarity
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  ESOP Value Clarity provides educational equity
                  calculations, scenario modelling, offer analysis and
                  decision-support tools. Some features require information
                  about you, your equity, compensation or employment offer
                  in order to function.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {/* 01 */}

            <section
              id="information-we-collect"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="01"
                title="Information we collect"
              />

              <p className="leading-7 text-slate-600">
                The information processed by ESOP Value Clarity depends
                on the features you use. It may include information you
                provide directly, information generated through your use
                of the product, and limited technical information needed
                to operate and secure the service.
              </p>

              <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                <Bullet>
                  <strong className="text-slate-900">
                    Account information:
                  </strong>{" "}
                  such as your name, email address and account-related
                  information.
                </Bullet>

                <Bullet>
                  <strong className="text-slate-900">
                    Equity information:
                  </strong>{" "}
                  such as option or share quantities, strike price,
                  valuation assumptions, vesting information, dilution
                  assumptions and exit scenarios.
                </Bullet>

                <Bullet>
                  <strong className="text-slate-900">
                    Compensation information:
                  </strong>{" "}
                  such as fixed compensation, variable compensation,
                  bonuses, employer contributions and other offer terms
                  you choose to provide.
                </Bullet>

                <Bullet>
                  <strong className="text-slate-900">
                    Product activity:
                  </strong>{" "}
                  information associated with calculations, saved
                  analyses and use of product functionality.
                </Bullet>

                <Bullet>
                  <strong className="text-slate-900">
                    Communications:
                  </strong>{" "}
                  information you submit through the product contact
                  form or send directly to our contact address.
                </Bullet>
              </ul>
            </section>

            {/* 02 */}

            <section
              id="accounts"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="02"
                title="Accounts & authentication"
              />

              <p className="leading-7 text-slate-600">
                When you create or use an ESOP Value Clarity account,
                information such as your name and email address is used
                to identify your account, authenticate access and provide
                account-specific features.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                  <p className="text-sm leading-7 text-slate-600">
                    Authentication credentials and security-related
                    information should never be shared through the
                    public contact form.
                  </p>
                </div>
              </div>
            </section>

            {/* 03 */}

            <section
              id="calculations"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="03"
                title="Calculations & saved data"
              />

              <p className="leading-7 text-slate-600">
                ESOP Value Clarity provides calculators and scenario
                modelling features that use the financial and equity
                assumptions you enter. Depending on the feature and your
                account state, calculation inputs and results may be
                stored so that you can access saved analyses and product
                history.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Modelled results are estimates based on the information
                and assumptions supplied to the product. They should not
                be interpreted as verified company valuations or
                guaranteed financial outcomes.
              </p>
            </section>

            {/* 04 */}

            <section
              id="offer-intelligence"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="04"
                title="Offer Intelligence"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                  <FileCheck2 className="h-6 w-6 text-violet-600" />

                  <h3 className="mt-4 font-black">
                    Review & confirmation
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Offer Intelligence is designed to extract structured
                    compensation and equity terms and present important
                    values for review. You may confirm, correct, reject
                    or enter information before it is used for saved
                    offer analysis.
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                  <Database className="h-6 w-6 text-blue-600" />

                  <h3 className="mt-4 font-black">
                    Confirmed offer records
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Confirmed structured offer information may be stored
                    with your account so that you can reopen offers and
                    compare confirmed compensation, equity and related
                    terms.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-violet-200 bg-violet-50/50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-700">
                  Important distinction
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Offer Intelligence is an assistance and
                  decision-support feature. Extracted information should
                  be reviewed against your official offer letter, ESOP
                  plan, grant agreement and other employer documentation.
                </p>
              </div>
            </section>

            {/* 05 */}

            <section
              id="documents"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="05"
                title="Offer documents"
              />

              <p className="leading-7 text-slate-600">
                When you use document-based Offer Intelligence features,
                the document is processed so that relevant employment,
                compensation and equity terms can be identified and
                presented for your review.
              </p>

              <div className="mt-6 rounded-[24px] bg-[#07101f] p-6 text-white">
                <div className="flex items-start gap-4">
                  <Server className="mt-1 h-5 w-5 shrink-0 text-blue-300" />

                  <div>
                    <h3 className="font-black">
                      Current Offer Intelligence design
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      The current Offer Intelligence workflow is designed
                      around application-side document processing,
                      employee review and persistence of the structured
                      offer information required for saved analysis.
                      The product interface should be treated as the
                      authoritative description of the processing mode
                      available for the version you are using.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-600">
                Do not upload documents containing information that is
                unnecessary for the analysis. You are responsible for
                ensuring that you are permitted to provide documents and
                information submitted to the service.
              </p>
            </section>

            {/* 06 */}

            <section
              id="contact"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="06"
                title="Contact enquiries"
              />

              <div className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <p className="leading-7 text-slate-600">
                    When you submit the website contact form, we process
                    the name, email address and message you provide so
                    that the enquiry can be delivered to the ESOP Value
                    Clarity product inbox and responded to.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Please do not submit passwords, authentication
                    credentials or highly sensitive personal information
                    through the contact form.
                  </p>
                </div>
              </div>
            </section>

            {/* 07 */}

            <section
              id="how-we-use-data"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="07"
                title="How information is used"
              />

              <p className="leading-7 text-slate-600">
                Information may be used as reasonably necessary to:
              </p>

              <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
                <Bullet>
                  provide and operate ESOP Value Clarity;
                </Bullet>

                <Bullet>
                  authenticate accounts and maintain account-specific
                  functionality;
                </Bullet>

                <Bullet>
                  perform calculations, scenario modelling and offer
                  analysis requested by you;
                </Bullet>

                <Bullet>
                  save calculations and confirmed offer information where
                  the product provides saved experiences;
                </Bullet>

                <Bullet>
                  respond to product enquiries and feedback;
                </Bullet>

                <Bullet>
                  maintain security, troubleshoot errors and prevent
                  misuse;
                </Bullet>

                <Bullet>
                  improve product reliability, usability and feature
                  performance.
                </Bullet>
              </ul>
            </section>

            {/* 08 */}

            <section
              id="third-parties"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="08"
                title="Service providers"
              />

              <p className="leading-7 text-slate-600">
                ESOP Value Clarity relies on technical infrastructure
                and service providers to operate the application. These
                may include hosting, database, authentication, payment,
                communications and other infrastructure providers used by
                the deployed version of the service.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Providers may process information only to the extent
                necessary for the relevant service or as otherwise
                permitted by their terms and applicable law.
              </p>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm leading-7 text-amber-950">
                  Third-party services may maintain their own privacy
                  policies and security practices. ESOP Value Clarity
                  does not control independent third-party websites you
                  choose to visit through external links.
                </p>
              </div>
            </section>

            {/* 09 */}

            <section
              id="retention"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="09"
                title="Retention & deletion"
              />

              <p className="leading-7 text-slate-600">
                Information may be retained for as long as reasonably
                necessary to provide the service, maintain saved
                functionality, meet security and operational needs,
                resolve disputes, enforce applicable terms or satisfy
                legal obligations.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Product features may allow certain records to be archived
                or removed. Where a direct deletion control is not
                available, you may contact us regarding a reasonable
                request concerning your information.
              </p>
            </section>

            {/* 10 */}

            <section
              id="security"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="10"
                title="Security"
              />

              <p className="leading-7 text-slate-600">
                We use reasonable technical and organisational measures
                intended to protect the service and information processed
                through it. However, no website, database, transmission
                method or storage system can be guaranteed to be
                completely secure.
              </p>

              <div className="mt-6 flex items-start gap-4 rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-6">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />

                <p className="text-sm leading-7 text-slate-600">
                  You should use a strong account password, protect access
                  to your email and devices, and avoid sharing account
                  credentials with other people.
                </p>
              </div>
            </section>

            {/* 11 */}

            <section
              id="choices"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="11"
                title="Your choices"
              />

              <p className="leading-7 text-slate-600">
                Depending on the functionality available to you and
                applicable law, you may be able to review, update,
                archive or delete certain information directly through
                the product.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                You may also contact ESOP Value Clarity if you have a
                privacy-related question or a request concerning personal
                information associated with your account.
              </p>
            </section>

            {/* 12 */}

            <section
              id="changes"
              className="scroll-mt-8 border-b border-slate-100 p-7 sm:p-10"
            >
              <SectionHeading
                number="12"
                title="Changes to this policy"
              />

              <p className="leading-7 text-slate-600">
                ESOP Value Clarity will continue to evolve. This Privacy
                Policy may therefore be updated when product features,
                data practices, infrastructure or legal requirements
                change.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                When this policy is materially revised, the updated
                version will be published on this page with an updated
                effective date.
              </p>
            </section>

            {/* 13 */}

            <section
              id="contact-us"
              className="scroll-mt-8 p-7 sm:p-10"
            >
              <SectionHeading
                number="13"
                title="Contact us"
              />

              <p className="leading-7 text-slate-600">
                Questions about this Privacy Policy or the handling of
                information through ESOP Value Clarity can be sent to:
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
                      Privacy enquiries
                    </p>

                    <p className="mt-1 font-black text-slate-950">
                      esopvalueclarity@gmail.com
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
              </a>
            </section>
          </div>
        </article>
      </section>

      {/* =====================================================
          LEGAL NOTICE
      ====================================================== */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 rounded-[26px] bg-slate-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <UserRoundCheck className="mt-1 h-5 w-5 shrink-0 text-blue-300" />

              <div>
                <h2 className="font-black">
                  Privacy is only one part of informed use.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review the Terms of Use and product Disclaimer to
                  understand the rules of the service and the limitations
                  of equity calculations, tax estimates and offer
                  comparisons.
                </p>
              </div>
            </div>

            <Link
              href="/terms"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black transition hover:bg-blue-500"
            >
              Read Terms
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
                className="font-bold text-slate-950"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-slate-950"
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