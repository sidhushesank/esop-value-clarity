import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

import NavigationShell from "@/components/ui/NavigationShell";
import { STARTUP_PLAN } from "@/lib/company-pricing";
import { ADVISOR_PLAN } from "@/lib/advisor-pricing";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = "https://esopvalueclarity.com";
const siteName = "ESOP Value Clarity";
const logoUrl = `${siteUrl}/brand/evc-mark.png`;
const linkedinUrl =
  "https://www.linkedin.com/in/sheshank-sidheshwar-b84166252/";

const TITLE = "ESOP Value Clarity: ESOP Software, Calculator and Tax Tools for India";
const DESCRIPTION =
  "ESOP software built for India: a free ESOP calculator for employees, cap table and ESOP management for startups, and an Advisor Console for CA firms covering ESOP TDS, foreign RSU tax and Schedule FA.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    default: TITLE,
    template: "%s | ESOP Value Clarity",
  },
  description: DESCRIPTION,
  keywords: [
    "ESOP software India",
    "ESOP management software",
    "ESOP calculator India",
    "ESOP tax calculator",
    "ESOP tax India",
    "cap table software India",
    "free cap table builder",
    "ESOP software for CA firms",
    "ESOP compliance calendar",
    "PAS-3 ESOP allotment",
    "MGT-14 ESOP scheme",
    "ESOP perquisite TDS",
    "ESOP tax deferral startups",
    "ESOP expense Ind AS 102",
    "ESOP accounting ICAI guidance note",
    "foreign RSU tax India",
    "RSU capital gains India",
    "ESPP tax India",
    "Schedule FA foreign shares",
    "SBI TT buying rate Rule 115",
    "Form 67 foreign tax credit",
    "NRI ESOP tax",
    "RNOR ESOP tax",
    "ESOP vesting schedule",
    "ESOP exercise cost",
    "ESOP dilution",
    "startup offer comparison",
    "ESOP buyback India",
  ],
  authors: [
    {
      name: "Sheshank Sidheshwar",
      url: linkedinUrl,
    },
  ],
  creator: "Sheshank Sidheshwar",
  publisher: siteName,
  applicationName: siteName,
  category: "Finance",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: TITLE,
    description:
      "ESOP calculator for employees, ESOP management and Ind AS 102 expense for startups, and ESOP compliance plus foreign RSU tax (Schedule CG, Schedule FA, Form 67) for CA firms. Built for Indian tax and company law.",
    url: siteUrl,
    siteName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1728,
        height: 910,
        alt: "ESOP Value Clarity: ESOP software for employees, startups and CA firms in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "ESOP calculator, ESOP management for startups, and ESOP compliance plus foreign RSU tax for CA firms. Built for India.",
    images: ["/og-image.png"],
  },
};

/* ------------------------------------------------------------------
   Structured data (JSON-LD) for every page: who EVC is, what the
   software does and what it costs. One @graph, linked by @id, so
   search and answer engines see a single entity. Only real features,
   real prices (from the pricing constants) and real profiles.
------------------------------------------------------------------ */

const FEATURES = [
  // Employees
  "ESOP calculator for India: vesting, exercise cost, dilution, perquisite tax and capital gains",
  "Grant letter extraction with field-by-field confirmation",
  "Old and new tax regime, surcharge with marginal relief, 4% cess",
  "Resident, RNOR and NRI tax, with a days-in-India residency check",
  "Bear, Base and Bull exit scenarios",
  "Offer Intelligence: compare cash-and-equity job offers",
  "One-page PDF report",
  // Startups
  "Free cap table builder",
  "Cap table and ESOP pool management for Indian and US companies",
  "ESOP grants with vesting schedules and private employee pages",
  "Option exercises through allotment, with PAS-3, perquisite TDS, startup TDS deferral and Form 3921 tracking",
  "ESOP expense report under Ind AS 102, the ICAI Guidance Note and ASC 718 (Black-Scholes, graded vesting, Excel and PDF)",
  "Compliance calendar with email reminders and .ics export",
  "Team logins with owner, admin and view-only roles, and change history",
  // CA and CS firms
  "Advisor Console for CA and CS firms across client companies",
  "ESOP Diligence Pack: register, approval, valuation and filing checks with a readiness score",
  "Tax-Event Ledger: ESOP perquisite, TDS, deferral, sale and buyback for employers, with 24Q and Form 16 exports",
  "Foreign Equity Tax Pack: RSU and ESPP capital gains from Morgan Stanley (E*TRADE), Schwab and Fidelity exports",
  "SBI TT buying rate conversion under Rule 115",
  "Schedule CG date buckets, Schedule FA A2 and A3 with daily peak value, dividends and foreign tax credit for Form 67",
  "Excel tax working paper for every client",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#org`,
      name: siteName,
      alternateName: ["EVC", "esopvalueclarity.com"],
      url: siteUrl,
      logo: { "@type": "ImageObject", url: logoUrl },
      email: "sheshank@esopvalueclarity.com",
      description:
        "Indian ESOP software company: an ESOP calculator for employees, ESOP and cap table management for startups, and an ESOP compliance and foreign share tax console for CA and CS firms.",
      founder: {
        "@type": "Person",
        "@id": `${siteUrl}/about#founder`,
        name: "Sheshank Sidheshwar",
        jobTitle: "Founder",
        url: `${siteUrl}/about`,
        sameAs: [linkedinUrl, "https://x.com/SheshankSi60747", "https://github.com/sidhushesank"],
      },
      // City-level only: no street address is published.
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        addressCountry: "IN",
      },
      areaServed: { "@type": "Country", name: "India" },
      knowsAbout: [
        "Employee stock options (ESOPs) in India",
        "ESOP taxation: perquisite tax and capital gains",
        "ESOP tax deferral for eligible startups",
        "Cap table management for Indian startups",
        "ESOP accounting under Ind AS 102",
        "Companies Act ESOP compliance: PAS-3, MGT-14, valuation",
        "Taxation of foreign RSUs and ESPP for Indian residents",
        "Schedule FA reporting of foreign assets",
        "Foreign tax credit and Form 67",
        "NRI and RNOR taxation of ESOPs",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      inLanguage: "en-IN",
      publisher: { "@id": `${siteUrl}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: siteName,
      url: siteUrl,
      applicationCategory: "FinanceApplication",
      applicationSubCategory: "Equity management software",
      operatingSystem: "Web",
      inLanguage: "en-IN",
      publisher: { "@id": `${siteUrl}/#org` },
      description: DESCRIPTION,
      audience: [
        { "@type": "Audience", audienceType: "Employees holding ESOPs, RSUs or ESPP in India" },
        { "@type": "BusinessAudience", audienceType: "Indian startups managing ESOPs" },
        { "@type": "BusinessAudience", audienceType: "Chartered accountant and company secretary firms" },
      ],
      featureList: FEATURES,
      offers: [
        { "@type": "Offer", name: "ESOP calculator", price: "0", priceCurrency: "INR", url: `${siteUrl}/simulator` },
        { "@type": "Offer", name: "Cap table builder", price: "0", priceCurrency: "INR", url: `${siteUrl}/cap-table` },
        {
          "@type": "Offer",
          name: `${STARTUP_PLAN.productName} (${STARTUP_PLAN.includedOptionHolders} option holders, per year)`,
          price: String(STARTUP_PLAN.priceRupees),
          priceCurrency: "INR",
          url: `${siteUrl}/pricing#startup`,
        },
        {
          "@type": "Offer",
          name: `Advisor Console (${ADVISOR_PLAN.includedClients} client companies, per year)`,
          price: String(ADVISOR_PLAN.priceRupees),
          priceCurrency: "INR",
          url: `${siteUrl}/pricing#advisor`,
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="directree-verify"
          content="directree-verify=dd177d69e79c2ab19b7c71f5c9dc7d8c"
        />

        <link
          rel="icon"
          href="/favicon.ico"
          sizes="any"
        />
      </head>

      <body
        className={`${inter.className} bg-slate-50 text-slate-900`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />

        <NavigationShell />

        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
        />

        <GoogleAnalytics gaId="G-1MMW7BTNWT" />

        <Analytics />
      </body>
    </html>
  );
}