import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ESOP Value Clarity",
  description:
    "Why ESOP Value Clarity exists: helping employees, founders and advisors understand ESOP grants, vesting, dilution, exercise cost, tax and exit outcomes without hype.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ESOP Value Clarity | ESOP Value Clarity",
    description:
      "Why ESOP Value Clarity exists: helping employees, founders and advisors understand ESOP grants, vesting, dilution, exercise cost, tax and exit outcomes without hype.",
    url: "/about",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About ESOP Value Clarity | ESOP Value Clarity",
    description:
      "Why ESOP Value Clarity exists: helping employees, founders and advisors understand ESOP grants, vesting, dilution, exercise cost, tax and exit outcomes without hype.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
