import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ESOP Value Clarity collects, stores and protects your grant data, documents and account information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | ESOP Value Clarity",
    description:
      "How ESOP Value Clarity collects, stores and protects your grant data, documents and account information.",
    url: "/privacy",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | ESOP Value Clarity",
    description:
      "How ESOP Value Clarity collects, stores and protects your grant data, documents and account information.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
