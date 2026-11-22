/**
 * JSON-LD builders. Honest note: Google says no special schema is needed for
 * AI Overviews / AI Mode, and an Ahrefs test found schema alone did not move AI
 * citations. Keep it because it tells every engine, unambiguously, who EVC is,
 * what it costs and who sells it (entity clarity), and it still powers rich
 * results in classic Google. It is hygiene, not the lever.
 *
 * Usage in a server component:
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema()) }} />
 */

const SITE = "https://esopvalueclarity.com";

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#org`,
    name: "ESOP Value Clarity",
    alternateName: ["EVC", "esopvalueclarity.com"],
    url: SITE,
    logo: `${SITE}/logo-512.png`, // make sure a 512x512 PNG exists here
    email: "sheshank@esopvalueclarity.com",
    founder: {
      "@type": "Person",
      "@id": `${SITE}/about#founder`,
      name: "Sheshank Sidheshwar",
      jobTitle: "Founder",
      url: `${SITE}/about`,
      // YOUR personal profiles go here (not the company ones), e.g.
      // "https://www.linkedin.com/in/<your-handle>", "https://x.com/<handle>",
      // "https://github.com/sidhushesank". sameAs is how engines merge mentions
      // of you across the web into one person entity.
      sameAs: [],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    areaServed: { "@type": "Country", name: "India" },
    knowsAbout: [
      "Employee stock options (ESOPs) in India",
      "ESOP taxation under the Income-tax Act, 2025",
      "ESOP vesting and exercise",
      "Cap table management for Indian startups",
      "ESOP buybacks and secondary sales in India",
    ],
    // Official EVC profiles. Add G2 / Capterra / Techjockey listing URLs here as they go live.
    sameAs: [
      "https://www.linkedin.com/company/esop-value-clarity",
      "https://www.youtube.com/@esopvalueclarity",
      "https://www.producthunt.com/products/esop-value-clarity",
    ],
  };
}

export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE}/#app`,
    name: "ESOP Value Clarity",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: SITE,
    publisher: { "@id": `${SITE}/#org` },
    description:
      "ESOP calculator and equity platform for India: grant-letter extraction, vesting, exercise cost, perquisite and capital gains tax, dilution, offer comparison, cap tables for startups, and an advisor console for CA firms.",
    // Prices as shown on the live homepage on 22 Nov 2026. Update with pricing changes.
    offers: [
      { "@type": "Offer", name: "Free ESOP simulator", price: "0", priceCurrency: "INR", url: `${SITE}/simulator` },
      { "@type": "Offer", name: "PRO Monthly", price: "2999", priceCurrency: "INR", url: `${SITE}/pricing` },
      { "@type": "Offer", name: "PRO Annual", price: "24999", priceCurrency: "INR", url: `${SITE}/pricing` },
      { "@type": "Offer", name: "Startup plan (25 option holders, per year)", price: "14999", priceCurrency: "INR", url: `${SITE}/pricing#startup` },
      { "@type": "Offer", name: "Advisor Console (25 client companies, per year)", price: "60000", priceCurrency: "INR", url: `${SITE}/pricing#advisor` },
      { "@type": "Offer", name: "Team Intelligence (up to 20 members, per year)", price: "145000", priceCurrency: "INR", url: `${SITE}/pricing` },
    ],
  };
}

export function datasetSchema(opts: {
  name: string;
  description: string;
  url: string;
  csvUrl: string;
  dateModified: string;
  keywords: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    dateModified: opts.dateModified,
    keywords: opts.keywords,
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@id": `${SITE}/#org` },
    spatialCoverage: "India",
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: opts.csvUrl }],
  };
}

export function articleSchema(opts: {
  headline: string;
  url: string;
  datePublished: string;
  dateModified: string;
  reviewedBy?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    mainEntityOfPage: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: { "@id": `${SITE}/about#founder` },
    publisher: { "@id": `${SITE}/#org` },
    ...(opts.reviewedBy ? { reviewedBy: { "@type": "Person", name: opts.reviewedBy } } : {}),
  };
}