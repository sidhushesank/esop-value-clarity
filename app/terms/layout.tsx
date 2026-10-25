import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of ESOP Value Clarity, including subscriptions, acceptable use and limits of the estimates it produces.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | ESOP Value Clarity",
    description:
      "The terms that govern your use of ESOP Value Clarity, including subscriptions, acceptable use and limits of the estimates it produces.",
    url: "/terms",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | ESOP Value Clarity",
    description:
      "The terms that govern your use of ESOP Value Clarity, including subscriptions, acceptable use and limits of the estimates it produces.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
