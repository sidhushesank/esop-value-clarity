import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Product Conversation",
  description:
    "Book a 20-minute conversation to see the ESOP Value Clarity workflow on your real use case and decide whether PRO is worth it.",
  alternates: { canonical: "/meeting" },
  openGraph: {
    title: "Book a Product Conversation | ESOP Value Clarity",
    description:
      "Book a 20-minute conversation to see the ESOP Value Clarity workflow on your real use case and decide whether PRO is worth it.",
    url: "/meeting",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Product Conversation | ESOP Value Clarity",
    description:
      "Book a 20-minute conversation to see the ESOP Value Clarity workflow on your real use case and decide whether PRO is worth it.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
