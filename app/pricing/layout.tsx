import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing: ESOP Management Software and Cap Table Plans",
  description:
    "ESOP Value Clarity pricing: free ESOP calculator, PRO for employees, and annual plans for startups (cap table, ESOPs, PAS-3, Ind AS 102) and CA/CS firms (ESOP compliance, foreign RSU tax, Schedule FA).",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "ESOP Management Software Pricing | ESOP Value Clarity",
    description:
      "ESOP Value Clarity pricing: free ESOP calculator, PRO for employees, and annual plans for startups (cap table, ESOPs, PAS-3, Ind AS 102) and CA/CS firms (ESOP compliance, foreign RSU tax, Schedule FA).",
    url: "/pricing",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ESOP Management Software Pricing | ESOP Value Clarity",
    description:
      "ESOP Value Clarity pricing: free ESOP calculator, PRO for employees, and annual plans for startups (cap table, ESOPs, PAS-3, Ind AS 102) and CA/CS firms (ESOP compliance, foreign RSU tax, Schedule FA).",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
