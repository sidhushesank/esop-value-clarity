"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const pathname = usePathname();
  const isSimulator = pathname === "/simulator";

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-semibold text-lg tracking-tight"
        >
          ESOP Value Clarity
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className={`text-sm ${
              pathname === "/about"
                ? "text-slate-900 font-medium"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            About
          </Link>

          <Button
            asChild
            variant={isSimulator ? "secondary" : "default"}
            disabled={isSimulator}
          >
            <Link href="/simulator">
              {isSimulator ? "Simulator" : "Try Simulator"}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
