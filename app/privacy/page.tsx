import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Fingerprint,
  Globe2,
  History,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

const LAST_UPDATED = "25 November 2026";
const PRIVACY_EMAIL = "sheshank@esopvalueclarity.com";

const sections = [
  { id: "who-we-are", number: "01", title: "Who we are" },
  { id: "information-we-collect", number: "02", title: "Information we collect" },
  { id: "accounts", number: "03", title: "Accounts, logins & teams" },
  { id: "pro", number: "04", title: "Calculator & EVC PRO" },
  { id: "startup-desk", number: "05", title: "Startup Equity Desk" },
  { id: "advisor-console", number: "06", title: "Advisor Console" },
  { id: "customer-data", number: "07", title: "Data customers upload" },
  { id: "history-reminders", number: "08", title: "Change history & reminders" },
  { id: "payments", number: "09", title: "Payments" },
  { id: "contact", number: "10", title: "Contact & meetings" },
  { id: "cookies", number: "11", title: "Cookies & analytics" },
  { id: "how-we-use-data", number: "12", title: "How information is used" },
  { id: "third-parties", number: "13", title: "Service providers" },
  { id: "retention", number: "14", title: "Retention & deletion" },
  { id: "security", number: "15", title: "Security" },
  { id: "rights", number: "16", title: "Your rights" },
  { id: "children", number: "17", title: "Children" },
  { id: "changes", number: "18", title: "Policy changes" },
  { id: "contact-us", number: "19", title: "Contact & grievances" },
];

function SectionHeading({ number, title }: { number: string; title: string }) {
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
      <span>{children}</span>
    </li>
  );
}

function Section({
  id,
  number,
  title,
  last,
  children,
}: {
  id: string;
  number: string;
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-8 p-7 sm:p-10 ${last ? "" : "border-b border-slate-100"}`}
    >
      <SectionHeading number={number} title={title} />
      {children}
    </section>
  );
}

function Note({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "amber" | "emerald";
  children: React.ReactNode;
}) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/60 text-slate-600",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    emerald: "border-emerald-200 bg-emerald-50/60 text-slate-600",
  }[tone];

  return (
    <div className={`mt-6 rounded-2xl border p-5 text-sm leading-7 ${styles}`}>
      {children}
    </div>
  );
}

const P = "leading-7 text-slate-600";
const LIST = "mt-6 space-y-4 text-sm leading-7 text-slate-600";
const B = "text-slate-900";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      {/* TOP NAVIGATION */}
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

      {/* HERO */}
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
              Your equity and tax data, handled carefully.
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
              This Privacy Policy explains what ESOP Value Clarity collects
              and why, across the free ESOP calculator, EVC PRO, the Startup
              Equity Desk and the Advisor Console for CA and CS firms. It also
              explains your rights under India&apos;s Digital Personal Data
              Protection Act, 2023 (DPDP Act).
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                Effective: {LAST_UPDATED}
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-300">
                Hyderabad, India
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SNAPSHOT */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Fingerprint,
              label: "No selling",
              title: "We don't sell your data",
              text: "Personal data is used to run the product you signed up for. It is not sold or used for advertising.",
            },
            {
              icon: Building2,
              label: "Customer data",
              title: "Your firm decides",
              text: "Employee and client data uploaded by a startup or CA firm is processed only on that customer's instructions.",
            },
            {
              icon: LockKeyhole,
              label: "Access",
              title: "Private by default",
              text: "Documents sit in private storage. Share links need a passcode. Team members are Admin or Viewer.",
            },
            {
              icon: History,
              label: "Accountability",
              title: "Every change logged",
              text: "Changes on the desk and in the Advisor Console record who made them and when.",
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
                <h2 className="mt-2 text-lg font-black tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* MAIN POLICY */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Privacy policy
            </p>
            <nav className="mt-4 max-h-[70vh] space-y-1 overflow-y-auto">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
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
                  ESOP Value Clarity is ESOP software for India: a calculator
                  and PRO workspace for employees, an equity desk for
                  startups, and a compliance and tax console for CA and CS
                  firms. These products need information about equity,
                  compensation, tax and, for business customers, their
                  employees or clients. This policy explains how that
                  information is handled.
                </p>
              </div>
            </div>
          </div>

          <div>
            {/* 01 */}
            <Section id="who-we-are" number="01" title="Who we are">
              <p className={P}>
                ESOP Value Clarity (&quot;EVC&quot;, &quot;we&quot;,
                &quot;us&quot;) is a sole proprietorship registered in India
                (Udyam), based in Hyderabad, Telangana, and operates
                esopvalueclarity.com.
              </p>
              <ul className={LIST}>
                <Bullet>
                  For your own account, and for data you enter about
                  yourself (for example in the calculator or EVC PRO), EVC is
                  the <strong className={B}>Data Fiduciary</strong> under the
                  DPDP Act.
                </Bullet>
                <Bullet>
                  For data a business customer uploads about other people
                  (a startup&apos;s employees and shareholders, or a CA
                  firm&apos;s clients), the customer is the Data Fiduciary
                  and EVC acts as its{" "}
                  <strong className={B}>Data Processor</strong>. Section 07
                  explains this.
                </Bullet>
              </ul>
            </Section>

            {/* 02 */}
            <Section
              id="information-we-collect"
              number="02"
              title="Information we collect"
            >
              <p className={P}>
                What we process depends on the features you use:
              </p>
              <ul className={LIST}>
                <Bullet>
                  <strong className={B}>Account details:</strong> name,
                  email address, a hashed password, plan and billing status,
                  and team memberships.
                </Bullet>
                <Bullet>
                  <strong className={B}>Equity and compensation:</strong>{" "}
                  options or shares, exercise price, valuations, vesting,
                  salary and offer terms, tax regime, and tax residency
                  details such as days spent in India.
                </Bullet>
                <Bullet>
                  <strong className={B}>Company records</strong> (Startup
                  Equity Desk): cap table, shareholders, ESOP schemes,
                  grants, grant letters, exercises, allotments, filing dates,
                  TDS details and expense settings.
                </Bullet>
                <Bullet>
                  <strong className={B}>Client records</strong> (Advisor
                  Console): client companies, their ESOP data, employees in
                  the tax ledger (name, employee reference, optional PAN,
                  income and net pay estimates), and individuals in the
                  Foreign Equity Tax Pack (name, optional email, broker
                  transactions).
                </Bullet>
                <Bullet>
                  <strong className={B}>Records of activity:</strong> change
                  history, reminder emails sent, items marked done, and share
                  link views.
                </Bullet>
                <Bullet>
                  <strong className={B}>Payments:</strong> payment and order
                  references from Razorpay. We do not receive or store card,
                  UPI PIN or bank login details.
                </Bullet>
                <Bullet>
                  <strong className={B}>Communications:</strong> contact
                  form messages, meeting bookings, waitlist sign-ups and
                  emails you send us.
                </Bullet>
                <Bullet>
                  <strong className={B}>Technical data:</strong> login
                  cookies, IP address and email used for short-lived
                  security limits, and analytics about how pages are used.
                </Bullet>
              </ul>
            </Section>

            {/* 03 */}
            <Section id="accounts" number="03" title="Accounts, logins & teams">
              <ul className={LIST}>
                <Bullet>
                  Passwords are stored only as bcrypt hashes. We can&apos;t
                  see your password.
                </Bullet>
                <Bullet>
                  Login uses a signed cookie. Password reset links are
                  single-use and expire.
                </Bullet>
                <Bullet>
                  To stop password guessing and spam, we count login,
                  signup and password-reset attempts per IP address and per
                  email address. These counters reset after 15 minutes to an
                  hour and are used for nothing else.
                </Bullet>
                <Bullet>
                  Owners of a Startup Equity Desk or Advisor firm can add
                  team members as <strong className={B}>Admin</strong> (can
                  edit) or <strong className={B}>Viewer</strong> (read only).
                  Team members can see the data of the desk or firm they
                  were added to. The owner chooses who to add and can remove
                  them.
                </Bullet>
              </ul>
              <Note>
                Never send passwords or login details through the contact
                form or by email.
              </Note>
            </Section>

            {/* 04 */}
            <Section id="pro" number="04" title="Calculator & EVC PRO">
              <ul className={LIST}>
                <Bullet>
                  The free calculator and free cap table builder work on the
                  numbers you type. Guest results may be kept in your browser
                  or saved so you can continue them after signing up.
                </Bullet>
                <Bullet>
                  In EVC PRO, grant letters you upload (PDF) are kept in
                  private file storage linked to your account. The text is
                  read on our server so the fields can be shown to you to
                  confirm or correct. Nothing is used until you confirm it.
                </Bullet>
                <Bullet>
                  Offer Intelligence saves the offer terms you confirm so you
                  can reopen and compare offers.
                </Bullet>
                <Bullet>
                  The tax page saves your inputs, including your residency
                  status (Resident, RNOR or NRI), days in India if you use the
                  helper, and the share of the vesting period worked in India.
                </Bullet>
              </ul>
              <p className={`mt-5 ${P}`}>
                All results are estimates based on what you enter. They are
                not tax, legal or valuation advice.
              </p>
            </Section>

            {/* 05 */}
            <Section id="startup-desk" number="05" title="Startup Equity Desk">
              <ul className={LIST}>
                <Bullet>
                  A startup stores its cap table, shareholders, ESOP schemes,
                  grants and option holders, exercises, PAS-3 and share
                  certificate dates, TDS amounts and challan references,
                  Form 3921 dates (US companies) and ESOP expense inputs.
                </Bullet>
                <Bullet>
                  Grant letters are kept in private file storage.
                </Bullet>
                <Bullet>
                  An option holder can view their grant through a private
                  link protected by a passcode (stored only as a hash). If
                  they accept the grant online, the acceptance time is
                  recorded for the company.
                </Bullet>
                <Bullet>
                  Excel imports are read into records. The uploaded file
                  itself is not kept.
                </Bullet>
              </ul>
            </Section>

            {/* 06 */}
            <Section id="advisor-console" number="06" title="Advisor Console">
              <ul className={LIST}>
                <Bullet>
                  A CA or CS firm stores its client companies, their ESOP
                  data, approvals and valuations, and a tax ledger of
                  employees and tax events. PAN is optional.
                </Bullet>
                <Bullet>
                  Diligence reports can be shared by link with a passcode
                  and expiry. Each view of a share link records the time, the
                  browser type and a one-way hash of the viewer&apos;s IP
                  address, so the firm can see that the link was opened.
                </Bullet>
                <Bullet>
                  <strong className={B}>Foreign Equity Tax Pack:</strong>{" "}
                  the firm uploads a client&apos;s broker statements (Excel
                  or CSV). The transactions read from them (vests, purchases,
                  sales, dividends, tax withheld, broker name) are saved
                  against that client. The uploaded file itself is not kept.
                </Bullet>
                <Bullet>
                  To value these transactions we fetch public market data:
                  SBI TT buying rates from a public archive, and daily share
                  prices and stock splits from Yahoo Finance. Only ticker
                  symbols and dates are used for these requests. No client
                  name or personal data is sent.
                </Bullet>
              </ul>
            </Section>

            {/* 07 */}
            <Section id="customer-data" number="07" title="Data customers upload about others">
              <div className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                <Users className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <div className="space-y-3 text-sm leading-7 text-slate-600">
                  <p>
                    When a startup uploads data about its employees and
                    shareholders, or a CA/CS firm uploads data about its
                    clients, that customer decides what is uploaded and why.
                    EVC processes it only to provide the service to that
                    customer, and does not use it for any other purpose.
                  </p>
                  <p>
                    The customer is responsible for having a lawful basis
                    (such as consent or a legitimate use under the DPDP Act)
                    and for giving any notice required to the people
                    concerned.
                  </p>
                  <p>
                    If you are an employee or client whose data was uploaded
                    by a company or firm, please contact them first. If you
                    contact us, we will pass your request to them and help
                    them respond.
                  </p>
                </div>
              </div>
              <Note tone="amber">
                Upload only what is needed. Don&apos;t upload bank account
                numbers, Aadhaar numbers or passwords. EVC does not need them.
              </Note>
            </Section>

            {/* 08 */}
            <Section
              id="history-reminders"
              number="08"
              title="Change history & reminders"
            >
              <ul className={LIST}>
                <Bullet>
                  <strong className={B}>Change history:</strong> changes on
                  the desk, to Advisor clients and to foreign-tax clients are
                  logged with the name of the person who made them, what
                  changed and when. This exists so firms and companies have an
                  audit trail. It can be viewed and exported by the desk or
                  firm.
                </Bullet>
                <Bullet>
                  <strong className={B}>Compliance calendar:</strong> due
                  dates are worked out from the records already in the
                  account. Reminder emails are sent to the reminder email set
                  by the desk or firm, or to the owner. We log which reminder
                  was sent and when, so it isn&apos;t sent twice. Marking an
                  item done stops its reminders.
                </Bullet>
                <Bullet>
                  Reminder and account emails are service emails, not
                  marketing.
                </Bullet>
              </ul>
            </Section>

            {/* 09 */}
            <Section id="payments" number="09" title="Payments">
              <p className={P}>
                Payments for EVC PRO, the Startup plan and the Advisor plan
                are handled by Razorpay. You enter payment details on
                Razorpay, under Razorpay&apos;s own privacy policy. We receive
                the order and payment references, the amount and the status,
                and keep them for billing, support and accounting records.
              </p>
            </Section>

            {/* 10 */}
            <Section id="contact" number="10" title="Contact & meetings">
              <div className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-6">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <div className="space-y-3 text-sm leading-7 text-slate-600">
                  <p>
                    <strong className={B}>Contact form and email:</strong>{" "}
                    we use your name, email and message to reply.
                  </p>
                  <p>
                    <strong className={B}>Booking a meeting:</strong> your
                    name, email and chosen time are used to create the event
                    in our Google Calendar and send the invite.
                  </p>
                  <p>
                    <strong className={B}>Waitlist:</strong> your email is
                    used to tell you when the feature you signed up for is
                    available.
                  </p>
                </div>
              </div>
            </Section>

            {/* 11 */}
            <Section id="cookies" number="11" title="Cookies & analytics">
              <ul className={LIST}>
                <Bullet>
                  <strong className={B}>Essential cookie:</strong> keeps you
                  logged in. The site can&apos;t work without it.
                </Bullet>
                <Bullet>
                  <strong className={B}>Analytics:</strong> we use Google
                  Analytics and Vercel Web Analytics to see which pages are
                  visited and how the site performs. Google Analytics sets
                  cookies; you can block them in your browser or with
                  Google&apos;s opt-out add-on without affecting the product.
                </Bullet>
                <Bullet>
                  Your browser may store calculator inputs and display
                  settings locally on your device.
                </Bullet>
                <Bullet>We don&apos;t use advertising cookies.</Bullet>
              </ul>
            </Section>

            {/* 12 */}
            <Section id="how-we-use-data" number="12" title="How information is used">
              <p className={P}>We use information only to:</p>
              <ul className={LIST}>
                <Bullet>run your account and the features you use;</Bullet>
                <Bullet>
                  carry out the calculations, reports, workbooks and reminders
                  you or your firm ask for;
                </Bullet>
                <Bullet>process payments and manage plans and team seats;</Bullet>
                <Bullet>reply to enquiries and give support;</Bullet>
                <Bullet>
                  keep the service secure, prevent misuse and fix errors;
                </Bullet>
                <Bullet>
                  understand site usage in aggregate and improve the product;
                </Bullet>
                <Bullet>meet legal, tax and accounting obligations.</Bullet>
              </ul>
              <Note tone="emerald">
                We don&apos;t sell personal data, share it for advertising, or
                use one customer&apos;s data for another customer.
              </Note>
            </Section>

            {/* 13 */}
            <Section id="third-parties" number="13" title="Service providers">
              <p className={P}>
                We use these providers to run EVC. Each gets only what it
                needs for its service:
              </p>
              <div className="table-scroll mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Used for</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {[
                      ["Vercel", "Website and application hosting; Web Analytics"],
                      ["Supabase", "Database and private file storage"],
                      ["Razorpay", "Payments"],
                      ["Resend and our email provider", "Account, billing and reminder emails"],
                      ["Google", "Analytics; Calendar for booked meetings"],
                      ["SBI FX RateKeeper archive, Yahoo Finance", "Public exchange rates, share prices and splits (no personal data sent)"],
                    ].map(([name, use]) => (
                      <tr key={name}>
                        <td className="px-4 py-3 font-bold text-slate-900">{name}</td>
                        <td className="px-4 py-3">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <Globe2 className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm leading-7 text-slate-600">
                  Some of these providers may store or process data outside
                  India. We do this only as permitted under the DPDP Act and
                  rely on the providers&apos; security commitments.
                </p>
              </div>
              <p className={`mt-5 ${P}`}>
                We may also disclose information where the law requires it,
                for example to a court or government authority with legal
                power to ask for it.
              </p>
            </Section>

            {/* 14 */}
            <Section id="retention" number="14" title="Retention & deletion">
              <ul className={LIST}>
                <Bullet>
                  Account and product data are kept while your account or
                  your firm&apos;s plan is active.
                </Bullet>
                <Bullet>
                  Archived clients and records are hidden, not deleted, so
                  they can be restored. Ask us if you want them deleted.
                </Bullet>
                <Bullet>
                  When you ask us to delete your account, or a business
                  customer asks us to delete its workspace, we delete the
                  data within a reasonable time, except records we must keep
                  by law (such as payment and invoice records).
                </Bullet>
                <Bullet>
                  Security counters for login and reset attempts last 15
                  minutes to an hour.
                </Bullet>
                <Bullet>
                  Change history is kept for as long as the desk or firm
                  account exists, because it is the customer&apos;s audit
                  trail.
                </Bullet>
              </ul>
            </Section>

            {/* 15 */}
            <Section id="security" number="15" title="Security">
              <ul className={LIST}>
                <Bullet>Encrypted connections (HTTPS) across the site.</Bullet>
                <Bullet>
                  Passwords and share-link passcodes stored as one-way hashes.
                </Bullet>
                <Bullet>
                  Single-use, expiring password reset links; rate limits on
                  logins, signups and resets.
                </Bullet>
                <Bullet>
                  Documents in private storage, served only to people with
                  access.
                </Bullet>
                <Bullet>
                  Admin and Viewer roles, and a change history of every edit.
                </Bullet>
              </ul>
              <p className={`mt-5 ${P}`}>
                No system is completely secure. If we become aware of a
                personal data breach, we will inform affected users and the
                Data Protection Board of India as the DPDP Act requires.
                Please use a strong password and don&apos;t share your login.
              </p>
            </Section>

            {/* 16 */}
            <Section id="rights" number="16" title="Your rights">
              <p className={P}>Under the DPDP Act you can:</p>
              <ul className={LIST}>
                <Bullet>
                  ask for a summary of the personal data we process about you
                  and who we share it with;
                </Bullet>
                <Bullet>ask us to correct, complete or update it;</Bullet>
                <Bullet>
                  ask us to erase it, where we no longer need it or are not
                  required by law to keep it;
                </Bullet>
                <Bullet>withdraw consent you have given;</Bullet>
                <Bullet>
                  nominate someone to exercise these rights if you die or
                  become unable to;
                </Bullet>
                <Bullet>
                  raise a grievance with us, and if not resolved, complain to
                  the Data Protection Board of India.
                </Bullet>
              </ul>
              <p className={`mt-5 ${P}`}>
                You can edit most of your own data directly in the product.
                For anything else, email{" "}
                <a href={`mailto:${PRIVACY_EMAIL}`} className="font-bold text-blue-600">
                  {PRIVACY_EMAIL}
                </a>
                . If your data was uploaded by your employer or CA firm, see
                section 07.
              </p>
            </Section>

            {/* 17 */}
            <Section id="children" number="17" title="Children">
              <p className={P}>
                EVC is for adults. We don&apos;t knowingly collect personal
                data from anyone under 18. If you think a child has given us
                personal data, contact us and we will delete it.
              </p>
            </Section>

            {/* 18 */}
            <Section id="changes" number="18" title="Changes to this policy">
              <p className={P}>
                We update this policy when the product or the law changes.
                The new version is published here with a new effective date.
                For material changes we will also notify account holders by
                email.
              </p>
            </Section>

            {/* 19 */}
            <Section id="contact-us" number="19" title="Contact & grievances" last>
              <p className={P}>
                For privacy questions, requests or grievances, contact our
                Grievance Officer:
              </p>
              <a
                href={`mailto:${PRIVACY_EMAIL}`}
                className="group mt-6 flex max-w-xl items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      Grievance Officer · Sheshank Sidheshwar
                    </p>
                    <p className="mt-1 font-black text-slate-950">{PRIVACY_EMAIL}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ESOP Value Clarity, Hyderabad, Telangana, India
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
              </a>
              <p className="mt-5 text-sm leading-7 text-slate-500">
                We aim to reply within 7 working days and to resolve
                grievances within the time set by the DPDP Act and its Rules.
              </p>
            </Section>
          </div>
        </article>
      </section>

      {/* LEGAL NOTICE */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 rounded-[26px] bg-slate-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-3xl items-start gap-4">
              <UserRoundCheck className="mt-1 h-5 w-5 shrink-0 text-blue-300" />
              <div>
                <h2 className="font-black">Privacy is only one part of informed use.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Read the Terms of Use and the Disclaimer for the rules of the
                  service and the limits of equity calculations, tax estimates
                  and compliance reminders.
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
            <p>© {new Date().getFullYear()} ESOP Value Clarity</p>
            <div className="flex gap-5">
              <Link href="/privacy" className="font-bold text-slate-950">Privacy</Link>
              <Link href="/terms" className="transition hover:text-slate-950">Terms</Link>
              <Link href="/disclaimer" className="transition hover:text-slate-950">Disclaimer</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
