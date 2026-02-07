import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            ESOP Value Clarity
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              About
            </Link>

            <Link href="/simulator">
              <Button size="sm">Simulator</Button>
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </>
  );
}
