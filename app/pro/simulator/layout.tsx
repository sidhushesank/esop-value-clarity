import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ESOP Value Simulator",
  description:
    "Free ESOP simulator: model what your stock options could be worth after vesting, dilution, exercise cost and tax, with every assumption kept visible.",
  alternates: { canonical: "/simulator" },
  openGraph: {
    title: "ESOP Value Simulator | ESOP Value Clarity",
    description:
      "Model what your stock options could be worth after vesting, dilution, exercise cost and tax.",
    url: "/simulator",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Simulator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ESOP Value Simulator | ESOP Value Clarity",
    description:
      "Model what your stock options could be worth after vesting, dilution, exercise cost and tax.",
    images: ["/og-image.png"],
  },
};

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
