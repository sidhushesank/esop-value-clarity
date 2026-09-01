import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";

import NavigationShell from "@/components/ui/NavigationShell";

const inter = Inter({
  subsets: ["latin"],
});

const siteUrl = "https://esop-value-clarity.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "ESOP Value Clarity | Employee Equity Decision Platform",
    template: "%s | ESOP Value Clarity",
  },

  description:
    "ESOP Value Clarity is an employee-first equity decision platform for understanding ESOP grants, vesting, dilution, exercise costs, tax scenarios, exit outcomes and equity-heavy job offers.",

  keywords: [
    "ESOP",
    "ESOP India",
    "ESOP Calculator",
    "Employee Stock Options",
    "Employee Equity",
    "Equity Compensation",
    "Startup Equity",
    "ESOP Vesting",
    "ESOP Dilution",
    "ESOP Exercise Cost",
    "ESOP Tax India",
    "ESOP Exit Value",
    "ESOP Offer Comparison",
    "Startup Offer Comparison",
    "Salary vs ESOP",
    "Equity Offer Analysis",
    "Employee Equity Decision Platform",
  ],

  authors: [
    {
      name: "Sheshank Sidheshwar",
    },
  ],

  creator: "Sheshank Sidheshwar",

  publisher: "ESOP Value Clarity",

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

  openGraph: {
    title:
      "ESOP Value Clarity | Employee Equity Decision Platform",

    description:
      "Understand your ESOP grant, vesting, dilution, exercise economics, tax scenarios and exit outcomes. Compare equity-heavy job offers with assumptions kept visible.",

    url: siteUrl,

    siteName: "ESOP Value Clarity",

    locale: "en_IN",

    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1728,
        height: 910,
        alt:
          "ESOP Value Clarity employee equity decision platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "ESOP Value Clarity | Employee Equity Decision Platform",

    description:
      "Understand ESOP grants, vesting, dilution, exercise, tax and exit scenarios. Compare startup offers without treating uncertain equity like guaranteed salary.",

    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",

  "@type": "WebApplication",

  name: "ESOP Value Clarity",

  url: siteUrl,

  applicationCategory: "FinanceApplication",

  operatingSystem: "Web",

  description:
    "An employee-first equity decision platform for understanding ESOP grants, vesting, dilution, exercise costs, tax scenarios, exit outcomes and equity-heavy job offers.",

  creator: {
    "@type": "Person",
    name: "Sheshank Sidheshwar",
  },

  publisher: {
    "@type": "Organization",
    name: "ESOP Value Clarity",
    url: siteUrl,
  },

  featureList: [
    "ESOP grant intelligence",
    "Grant review and confirmation",
    "Equity profile",
    "Vesting analysis",
    "Dilution modelling",
    "Exercise cost analysis",
    "Tax scenario estimation",
    "Exit scenario modelling",
    "Scenario comparison",
    "Offer intelligence",
    "Cash and equity offer comparison",
    "Reports and analysis history",
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
      </head>

      <body
        className={`${inter.className} bg-slate-50 text-slate-900`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
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
      </body>
    </html>
  );
}