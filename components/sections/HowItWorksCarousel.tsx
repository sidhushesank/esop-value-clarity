"use client"

import { Card } from "@/components/ui/card"

const steps = [
  {
    step: "01",
    title: "Grant & Vesting",
    desc: "Understand how much of your ESOP is actually yours."
  },
  {
    step: "02",
    title: "Dilution",
    desc: "See how funding rounds reduce ownership over time."
  },
  {
    step: "03",
    title: "Exit Value",
    desc: "Estimate outcomes at different exit valuations."
  }
]

export default function HowItWorksCarousel() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-semibold mb-12">How it works</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(s => (
            <Card key={s.step} className="p-6 hover:shadow-lg transition">
              <span className="text-slate-300 text-5xl font-bold">
                {s.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="text-slate-600 mt-2">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
