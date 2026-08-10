import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import NavBar from "@/components/ui/NavBar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://esop-value-clarity.vercel.app"),

  title: {
    default: "ESOP Value Clarity",
    template: "%s | ESOP Value Clarity",
  },

  description:
    "A free ESOP calculator and simulator to estimate startup equity value, dilution, vesting and exit scenarios without spreadsheets.",

  keywords: [
    "ESOP",
    "ESOP Calculator",
    "ESOP Simulator",
    "Startup Equity",
    "Employee Stock Options",
    "Equity Calculator",
    "Dilution Calculator",
    "Vesting Calculator",
    "Exit Value",
  ],

  authors: [
    {
      name: "Sheshank",
    },
  ],

  creator: "Sheshank",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "ESOP Value Clarity",
    description:
      "Free ESOP calculator that helps you understand startup equity, dilution and exit value.",
    url: "https://esop-value-clarity.vercel.app",
    siteName: "ESOP Value Clarity",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ESOP Value Clarity",
    description:
      "Free ESOP calculator for startup employees and founders.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ESOP Value Clarity",
  url: "https://esop-value-clarity.vercel.app",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "A free ESOP calculator and simulator to estimate startup equity value, dilution, vesting and exit scenarios.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />

        <NavBar />

        {children}

        <GoogleAnalytics gaId="G-1MMW7BTNWT" />
      </body>
    </html>
  );
}