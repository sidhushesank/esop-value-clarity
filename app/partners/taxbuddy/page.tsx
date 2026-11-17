import type { Metadata } from "next";

import TaxBuddyPartnerPage from "@/components/partners/TaxBuddyPartnerPage";

// Root layout adds " | ESOP Value Clarity" to the page title.
const TITLE = "Partner: TaxBuddy";
const SOCIAL_TITLE = "ESOP Value Clarity × TaxBuddy";
const DESCRIPTION =
  "Plan the ESOP decision with ESOP Value Clarity before you exercise, sell or leave. File the tax with TaxBuddy's experts after. How the two fit together.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/partners/taxbuddy" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    url: "/partners/taxbuddy",
    type: "website",
    siteName: "ESOP Value Clarity",
    locale: "en_IN",
    images: [{ url: "/og-image.png", width: 1728, height: 910, alt: "ESOP Value Clarity" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <TaxBuddyPartnerPage />;
}
