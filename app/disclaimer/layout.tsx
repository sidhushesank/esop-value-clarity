import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "ESOP Value Clarity provides educational estimates, not legal, tax or investment advice. Read how to use its outputs responsibly.",
  alternates: { canonical: "/disclaimer" },
  openGraph: {
    title: "Disclaimer | ESOP Value Clarity",
    description:
      "ESOP Value Clarity provides educational estimates, not legal, tax or investment advice. Read how to use its outputs responsibly.",
    url: "/disclaimer",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclaimer | ESOP Value Clarity",
    description:
      "ESOP Value Clarity provides educational estimates, not legal, tax or investment advice. Read how to use its outputs responsibly.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
