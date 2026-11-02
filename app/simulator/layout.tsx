import type { Metadata } from "next";

const TITLE = "Free ESOP Calculator (India): Value, Vesting, Tax and Exit";
const DESCRIPTION =
  "Free ESOP calculator for India. Enter your grant to see vested options, exercise cost, tax at exercise, dilution and take-home value across exit scenarios. No sign-up needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ESOP calculator",
    "ESOP calculator India",
    "ESOP value calculator",
    "ESOP tax calculator",
    "ESOP exercise cost calculator",
    "stock option calculator",
  ],
  alternates: { canonical: "/simulator" },
  openGraph: {
    title: `${TITLE} | ESOP Value Clarity`,
    description: DESCRIPTION,
    url: "/simulator",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity ESOP calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ESOP Value Clarity`,
    description: DESCRIPTION,
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
