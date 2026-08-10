import Link from "next/link";
import {
  Mail,
  Github,
  Globe,
  MessageCircle,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-14 lg:grid-cols-[1.5fr_0.9fr]">

          {/* LEFT */}

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-violet-500 text-white font-bold shadow-lg">
                EV
              </div>

              <div>

                <h2 className="text-2xl font-bold tracking-tight text-white">
                  ESOP Value Clarity
                </h2>

                <p className="text-sm text-emerald-400">
                  Understand Equity. Build Wealth.
                </p>

              </div>

            </div>

            <p className="mt-8 max-w-2xl text-[15px] leading-8 text-slate-400">
              ESOP Value Clarity is a modern equity intelligence platform
              designed to help startup employees, founders and aspiring
              investors better understand the real-world value of equity.
              Through transparent calculations, dilution simulations,
              vesting projections and exit modelling, the platform turns
              complex ownership data into clear financial insights.
            </p>

            <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur">

              <div className="flex items-center gap-3">

                <ShieldCheck className="h-6 w-6 text-emerald-400" />

                <h3 className="font-semibold text-white">
                  Transparency First
                </h3>

              </div>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                Every estimate is generated using transparent assumptions
                instead of hidden algorithms. The platform is intended for
                educational and informational purposes only and should not
                be considered financial, legal, investment or tax advice.
              </p>

            </div>

          </div>

          {/* RIGHT */}

          <div>

            <h3 className="text-xl font-semibold text-white">
              Connect
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Questions, feedback or collaboration?
              Feel free to reach out.
            </p>

            <div className="mt-8 space-y-4">

              <Link
                href="mailto:sidhusheshank@gmail.com"
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.06]"
              >
                <Mail className="h-5 w-5 text-emerald-400" />

                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    Email
                  </p>
                  <p className="text-white">
                    sidhusheshank@gmail.com
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
              </Link>

              <Link
                href="https://wa.me/917842638157"
                target="_blank"
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-green-500/30 hover:bg-white/[0.06]"
              >
                <MessageCircle className="h-5 w-5 text-green-400" />

                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    WhatsApp
                  </p>
                  <p className="text-white">
                    +91 7842638157
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
              </Link>

              <Link
                href="https://github.com/sidhushesank"
                target="_blank"
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <Github className="h-5 w-5 text-white" />

                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    GitHub
                  </p>
                  <p className="text-white">
                    github.com/sidhushesank
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
              </Link>

              <Link
                href="https://x.com/SheshankSi60747"
                target="_blank"
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-sky-500/30 hover:bg-white/[0.06]"
              >
                <svg
                  className="h-5 w-5 fill-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2H21.5l-7.12 8.138L22.75 22h-6.554l-5.13-6.708L5.2 22H1.94l7.614-8.702L1.5 2h6.72l4.64 6.116L18.244 2z" />
                </svg>

                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    X
                  </p>
                  <p className="text-white">
                    @SheshankSi60747
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
              </Link>

              <Link
                href="https://sheshank-portfolio.netlify.app/"
                target="_blank"
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.06]"
              >
                <Globe className="h-5 w-5 text-violet-400" />

                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    Portfolio
                  </p>
                  <p className="text-white">
                    sheshank-portfolio.netlify.app
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-white" />
              </Link>

            </div>

          </div>

        </div>

        <div className="mt-14 border-t border-white/10 pt-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="font-medium text-white">
                © {new Date().getFullYear()} ESOP Value Clarity
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Empowering founders and startup professionals with transparent equity insights.
              </p>

            </div>

            <p className="max-w-lg text-right text-sm leading-6 text-slate-500">
              Built with a focus on clarity, transparency and financial education.
              Every calculation is explainable, every assumption is visible,
              because understanding your equity should never feel like a black box.
            </p>

          </div>

        </div>

      </div>
    </footer>
  );
}