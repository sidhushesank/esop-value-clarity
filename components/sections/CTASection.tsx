import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold">
          Ready to understand your ESOP value?
        </h2>

        <p className="mt-4 text-slate-300">
          Built to educate, not sell. Transparent assumptions. No hidden logic.
        </p>

        <div className="mt-8">
          <Link href="/simulator">
            <Button size="lg" variant="secondary">
              Try the Simulator
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Educational purpose only. Not financial or legal advice.
        </p>
      </div>
    </section>
  )
}
