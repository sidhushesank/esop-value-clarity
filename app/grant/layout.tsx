import type { ReactNode } from "react";

import Footer from "@/components/sections/Footer";

export default function GrantLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
