import type { Metadata } from "next";

import Footer from "@/components/sections/Footer";
import KnowledgeHubClient from "@/app/blog/KnowledgeHubClient";

const BASE_URL = "https://esopvalueclarity.com";
const SITE_NAME = "ESOP Value Clarity";
const LINKEDIN_URL =
  "https://www.linkedin.com/in/sheshank-sidheshwar-b84166252/";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: "Equity Intelligence Hub | ESOP Value Clarity",

  description:
    "Decision-first ESOP guides, startup equity frameworks, calculators and scenario tools for employees, founders, HR teams and advisors evaluating stock options, dilution, vesting, exercise cost, tax and offer value.",

  keywords: [
    "ESOP calculator India",
    "startup equity guide",
    "employee stock options India",
    "ESOP value calculator",
    "ESOP dilution calculator",
    "ESOP exercise cost",
    "startup offer equity comparison",
    "ESOP negotiation",
    "vesting schedule",
    "ESOP tax India",
    "RSU vs ESOP",
    "employee equity decision",
    "startup equity calculator",
    "employee equity India",
    "startup compensation",
  ],

  alternates: {
    canonical: "/blog",
  },

  openGraph: {
    title: "Equity Intelligence Hub | ESOP Value Clarity",
    description:
      "Decision-first ESOP guides, calculators and scenario frameworks for startup equity decisions.",
    type: "website",
    url: "/blog",
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ESOP Value Clarity - Equity Intelligence Hub",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Equity Intelligence Hub | ESOP Value Clarity",
    description:
      "Decision-first ESOP guides, calculators and scenario frameworks for startup equity decisions.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const articles = [
  {
    slug: "startup-offered-25000-esops",
    title: "I received 25,000 ESOPs. Is that actually good?",
    category: "Offer decision",
  },
  {
    slug: "should-i-negotiate-esops",
    title: "Should I negotiate ESOPs or salary in my startup offer?",
    category: "Negotiation",
  },
  {
    slug: "esop-exercise-cost",
    title: "How much cash do I need to exercise my ESOPs?",
    category: "Exercise",
  },
  {
    slug: "leaving-startup-esop-options",
    title: "I am leaving my startup. What happens to my vested options?",
    category: "Leaving company",
  },
  {
    slug: "startup-raised-funding-dilution",
    title: "My startup raised funding. Did my ESOP become worthless?",
    category: "Dilution",
  },
  {
    slug: "compare-startup-offers-equity",
    title: "Two startup offers. Which equity package is stronger?",
    category: "Offer comparison",
  },
  {
    slug: "what-is-an-esop",
    title: "What is an ESOP? The practical version employees actually need",
    category: "Foundation",
  },
  {
    slug: "esop-vs-rsu",
    title: "ESOP vs RSU: do not compare unit counts blindly",
    category: "Equity types",
  },
  {
    slug: "dilution-explained",
    title: "ESOP dilution explained without the panic",
    category: "Dilution",
  },
  {
    slug: "vesting-schedule",
    title: "ESOP vesting schedule: granted is not the same as earned",
    category: "Vesting",
  },
];

const hubJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Equity Intelligence Hub",
  description:
    "Decision-first ESOP and startup equity guides from ESOP Value Clarity.",
  url: `${BASE_URL}/blog`,
  inLanguage: "en-IN",

  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
  },

  about: [
    "Employee stock options",
    "Startup equity",
    "ESOP dilution",
    "Vesting schedules",
    "Exercise cost",
    "Offer comparison",
    "Equity compensation",
  ],

  author: {
    "@type": "Person",
    name: "Sheshank Sidheshwar",
    url: LINKEDIN_URL,
  },

  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/og-image.png`,
    },
  },

  mainEntity: {
    "@type": "ItemList",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: `${BASE_URL}/blog/${article.slug}`,
    })),
  },
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(hubJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <KnowledgeHubClient />

      <Footer />
    </>
  );
}