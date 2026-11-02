import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for ESOP Value Clarity: free ESOP simulator, PRO for individuals, and annual plans for startups (cap table and ESOP grants), CA and CS firms, and teams.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | ESOP Value Clarity",
    description:
      "Simple pricing for ESOP Value Clarity: free ESOP simulator, PRO for individuals, and annual plans for startups (cap table and ESOP grants), CA and CS firms, and teams.",
    url: "/pricing",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | ESOP Value Clarity",
    description:
      "Simple pricing for ESOP Value Clarity: free ESOP simulator, PRO for individuals, and annual plans for startups (cap table and ESOP grants), CA and CS firms, and teams.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
