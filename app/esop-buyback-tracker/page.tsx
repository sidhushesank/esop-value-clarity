import type { Metadata } from "next";
import { AnswerFirst } from "@/components/AnswerFirst";
import { LIQUIDITY_EVENTS, TRACKER_LAST_UPDATED, summarise } from "@/data/esop-liquidity-events";
import { datasetSchema } from "@/lib/schema";

const URL = "https://esopvalueclarity.com/esop-buyback-tracker";

export const metadata: Metadata = {
  title: "India ESOP Buyback Tracker 2026: Every Startup Buyback, Sourced",
  description:
    "Every ESOP buyback and liquidity programme announced by Indian startups in 2026: amount, who was eligible, price per option and source. Free CSV download, updated as deals are announced.",
  alternates: { canonical: URL },
};

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00+05:30").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Page() {
  const s = summarise();
  const events = [...LIQUIDITY_EVENTS].sort((a, b) => b.date.localeCompare(a.date));
  const latest = events[0];

  return (
    <main className="prose-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetSchema({
              name: "India ESOP Buyback and Liquidity Tracker 2026",
              description:
                "ESOP buybacks, secondary sales and liquidity programmes announced by Indian startups in 2026, with amount, eligibility, price per option and source for each.",
              url: URL,
              csvUrl: `${URL}/data.csv`,
              dateModified: TRACKER_LAST_UPDATED,
              keywords: ["ESOP buyback India", "ESOP liquidity", "startup buyback 2026", "employee stock options India"],
            }),
          ),
        }}
      />

      <h1>India ESOP Buyback Tracker 2026</h1>

      <AnswerFirst
        question="How many Indian startups have run ESOP buybacks in 2026?"
        answer={
          <>
            ESOP Value Clarity has tracked {s.count} ESOP buyback and liquidity programmes by Indian startups in
            2026 so far. Disclosed amounts total ₹{s.disclosedInrCrore} crore plus ${s.disclosedUsdMillion} million;{" "}
            {s.undisclosedAmount} programme{s.undisclosedAmount === 1 ? "" : "s"} did not disclose a size. The most
            recent is {latest.company} ({fmtDate(latest.date)}).
          </>
        }
        keyFacts={[
          { label: "Programmes tracked (2026)", value: String(s.count) },
          { label: "Disclosed in rupees", value: `₹${s.disclosedInrCrore} crore` },
          { label: "Disclosed in dollars", value: `$${s.disclosedUsdMillion} million` },
          { label: "Typical cap per employee", value: "5–10% of vested options where disclosed" },
        ]}
        writtenBy="Sheshank Sidheshwar, founder, ESOP Value Clarity"
        lastUpdated={TRACKER_LAST_UPDATED}
      />

      <p>
        Every row comes from a public report, linked below, and has its own ESOP Value Clarity write-up. Where a
        company did not disclose a figure, the cell says so; we do not estimate. Use the data freely with a link
        back. <a href="/esop-buyback-tracker/data.csv">Download the CSV</a>.
      </p>

      <div className="table-scroll">
        <table>
          <caption>ESOP buybacks and liquidity programmes, India, 2026 (newest first)</caption>
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Announced</th>
              <th scope="col">Size</th>
              <th scope="col">Who could sell</th>
              <th scope="col">Price per option</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.company + e.date}>
                <th scope="row">
                  <a href={e.evcArticle}>{e.company}</a>
                </th>
                <td>
                  <time dateTime={e.date}>{fmtDate(e.date)}</time>
                </td>
                <td>
                  {e.amountInrCrore != null
                    ? `₹${e.amountInrCrore} crore`
                    : e.amountUsdMillion != null
                      ? `$${e.amountUsdMillion} million`
                      : "Not disclosed"}
                </td>
                <td>{[e.employeesCovered, e.eligibility].filter(Boolean).join(". ") || "Not disclosed"}</td>
                <td>{e.pricePerOptionInr != null ? `₹${e.pricePerOptionInr} (reported)` : "Not disclosed"}</td>
                <td>{e.primarySources.map((p) => p.title).join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What a buyback means for your tax</h2>
      <p>
        Selling options or shares back in a buyback can be taxed differently depending on whether you sell
        unexercised options or shares you already hold. See{" "}
        <a href="/blog/esop-buyback-vs-secondary-sale">ESOP buyback vs secondary sale</a> and{" "}
        <a href="/blog/esop-taxation-india">ESOP tax in India 2026</a>, or run your own numbers in the{" "}
        <a href="/simulator">ESOP calculator</a>.
      </p>

      <h2>Missing a buyback?</h2>
      <p>
        Email <a href="mailto:sheshank@esopvalueclarity.com">sheshank@esopvalueclarity.com</a> with a public source
        and we will add it within a day.
      </p>
    </main>
  );
}
