import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plans for employees, HR teams and advisory firms using ESOP Value Clarity to model ESOP value, dilution, exercise cost, tax scenarios and offers.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | ESOP Value Clarity",
    description:
      "Plans for employees, HR teams and advisory firms using ESOP Value Clarity to model ESOP value, dilution, exercise cost, tax scenarios and offers.",
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
      "Plans for employees, HR teams and advisory firms using ESOP Value Clarity to model ESOP value, dilution, exercise cost, tax scenarios and offers.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
