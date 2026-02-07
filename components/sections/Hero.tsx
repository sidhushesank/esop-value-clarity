import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Hero() {
  return (
    <section className="py-28">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <h1 className="text-5xl font-bold leading-tight">
            Understand your ESOP value
            <span className="text-slate-500"> without confusion.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-600">
            A clear, transparent ESOP simulator that explains equity,
            dilution, and exit value — without spreadsheets or jargon.
          </p>

          <div className="mt-8 flex gap-4">
            <Link href="/simulator">
              <Button size="lg">Try the Simulator</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Right */}
        <Card className="p-6">
          <p className="text-sm text-slate-500 mb-4">Example output</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Value Today</span>
              <strong>₹3,20,000</strong>
            </div>
            <div className="flex justify-between">
              <span>After Dilution</span>
              <strong>₹2,56,000</strong>
            </div>
            <div className="flex justify-between">
              <span>At Exit</span>
              <strong>₹12,80,000</strong>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
