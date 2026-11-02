import type { Metadata } from "next";

import CapTableBuilder from "@/components/captable-free/CapTableBuilder";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Free Cap Table Builder",
  description:
    "Build your startup's cap table for free, no sign-up needed. See fully diluted ownership, model a funding round with an ESOP top-up, and see how each shareholder is diluted.",
  alternates: { canonical: "/cap-table" },
  openGraph: {
    title: "Free Cap Table Builder | ESOP Value Clarity",
    description:
      "Build your cap table for free, model your next round and see dilution for every shareholder. No sign-up needed.",
    url: "/cap-table",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
};

export default function CapTablePage() {
  return (
    <>
      <main>
        <CapTableBuilder />
      </main>
      <Footer />
    </>
  );
}
