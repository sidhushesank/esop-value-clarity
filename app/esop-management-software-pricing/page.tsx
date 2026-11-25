import type { Metadata } from "next";
import { AnswerFirst } from "@/components/AnswerFirst";
import { softwareSchema } from "@/lib/schema";

/**
 * Targets a query Google ALREADY shows EVC for in AI-Mode-style searches
 * (Search Console, Nov 2026): "how much does esop management software typically
 * cost for a startup with under 50 employees?" (position ~12).
 *
 * Fairness rule: AI engines and Google both distrust pages that trash competitors.
 * State only what each vendor publishes, link it, and say plainly where EVC is
 * the wrong fit. That honesty is what makes the page citable.
 *
 * "Published price" column: from G2 / Capterra listings, checked 25 Nov 2026.
 * Re-check each vendor's own site when updating this page.
 */

const URL = "https://esopvalueclarity.com/esop-management-software-pricing";
const UPDATED = "2026-11-25";

export const metadata: Metadata = {
  title: "ESOP Management Software Pricing in India (2026): What Startups Actually Pay",
  description:
    "What ESOP and cap table software costs for Indian startups under 50 employees: published prices, what needs a sales call, and when a spreadsheet is enough. EVC, Qapita, EquityList, Hissa compared.",
  alternates: { canonical: URL },
};

const rows = [
  {
    vendor: "ESOP Value Clarity (EVC)",
    published: "Yes: Startup plan ₹14,999/year for 25 option holders; Advisor Console ₹60,000/year for 25 client companies; free calculator and cap table builder",
    bestFor: "Pre-seed to Series A startups that want employees to see what their grant is worth in rupees after tax",
    source: { title: "esopvalueclarity.com/pricing", url: "/pricing" },
  },
  {
    vendor: "Qapita",
    published: "Not published. Entry 'Growth' plan listed as 'Contact us'",
    bestFor: "Growth-stage and enterprise equity administration",
    source: { title: "G2: Qapita pricing", url: "https://www.g2.com/compare/eqvista-vs-qapita-vs-equitylist" },
  },
  {
    vendor: "EquityList",
    published: "Not published ('No pricing available' on G2)",
    bestFor: "Startups and scaleups wanting cap table, ESOP and compliance reports in one place",
    source: { title: "G2: EquityList pricing", url: "https://www.g2.com/compare/eqvista-vs-qapita-vs-equitylist" },
  },
  {
    vendor: "Hissa",
    published: "Not published. Price on request after a demo",
    bestFor: "Companies that also want access to employee-share secondary liquidity (Hissa runs an ESOP secondary fund)",
    source: { title: "G2: Hissa pricing", url: "https://www.g2.com/products/hissa/pricing" },
  },
];

export default function Page() {
  return (
    <main className="prose-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema()) }} />

      <h1>ESOP management software pricing in India (2026)</h1>

      <AnswerFirst
        question="How much does ESOP management software cost for a startup with under 50 employees?"
        answer={
          <>
            Most Indian ESOP platforms don&apos;t publish prices and quote after a demo. ESOP Value Clarity publishes
            its price: ₹14,999 a year covers a startup&apos;s cap table and up to 25 option holders, and every employee
            sees their grant&apos;s after-tax value. Below roughly 10 option holders and no funding round coming up, a
            well-kept spreadsheet can still be enough.
          </>
        }
        keyFacts={[
          { label: "EVC Startup plan", value: "₹14,999 / year, 25 option holders" },
          { label: "Free tools", value: "ESOP calculator and cap table builder" },
          { label: "Vendors that publish prices (of 4 compared)", value: "1 confirmed" },
        ]}
        sources={rows.slice(1).map((r) => r.source)}
        writtenBy="Sheshank Sidheshwar, founder, ESOP Value Clarity"
        lastUpdated={UPDATED}
      />

      <p>
        Disclosure: we build EVC, so weigh this page with that in mind. We only list what each vendor publishes,
        with a link, and we say where another tool is the better fit.
      </p>

      <div className="table-scroll">
        <table>
          <caption>Published pricing, checked {UPDATED}</caption>
          <thead>
            <tr>
              <th scope="col">Platform</th>
              <th scope="col">Published price</th>
              <th scope="col">Best fit</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.vendor}>
                <th scope="row">{r.vendor}</th>
                <td>{r.published}</td>
                <td>{r.bestFor}</td>
                <td>
                  <a href={r.source.url}>{r.source.title}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What drives the price</h2>
      <ul>
        <li>Number of option holders or stakeholders on the cap table.</li>
        <li>Whether you need statutory registers and filings (for example SH-6) and Ind AS 102 expense reports.</li>
        <li>Valuation reports, which are a separate professional service in most setups.</li>
        <li>Employee-facing views. Some tools show employees only option counts; others show rupee value after tax.</li>
      </ul>

      <h2>When EVC is the wrong choice</h2>
      <p>
        If you are a large company running several ESOP schemes across countries, with a dedicated equity
        administration team, an enterprise platform will fit better. EVC is built for early-stage Indian startups
        and the CA firms that advise them.
      </p>

      <h2>Who uses EVC</h2>
      <p>Ather Energy and Revolt Motors are paying EVC customers.</p>

      <p>
        <a href="/pricing">See full EVC pricing</a> · <a href="/cap-table">Try the free cap table builder</a> ·{" "}
        <a href="/meeting">Book a 20-minute walkthrough</a>
      </p>
    </main>
  );
}
