import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import NavBar from "@/components/ui/NavBar";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESOP Value Clarity",
  description: "Understand your ESOP value clearly and simply.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <NavBar />
        {children}
      </body>

      <GoogleAnalytics gaId="G-1MMW7BTNWT" />
    </html>
  );
}