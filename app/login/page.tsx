"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  Layers3,
  LineChart,
  Loader2,
  LockKeyhole,
  PieChart,
  Scale,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (loading || guestLoading) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    if (loading || guestLoading) return;

    try {
      setGuestLoading(true);
      setError("");

      const response = await fetch("/api/guest/create", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to continue as guest");
        return;
      }

      router.push("/simulator");
      router.refresh();
    } catch {
      setError("Unable to continue as guest");
    } finally {
      setGuestLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleLogin();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fc] text-slate-950">
      <div className="login-light-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[540px] w-[540px] rounded-full bg-blue-200/50 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-220px] right-[-140px] h-[560px] w-[560px] rounded-full bg-violet-200/40 blur-[150px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-[520px]">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 text-sm font-black text-slate-700"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#07111f] text-xs font-black text-white shadow-lg shadow-slate-200">
                EV
              </div>
              <div>
                <p className="leading-none">ESOP Value Clarity</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Employee Equity Intelligence
                </p>
              </div>
            </Link>

            <div className="mt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.19em] text-blue-600">
                SECURE ACCOUNT ACCESS
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] sm:text-5xl">
                Continue your
                <span className="block text-slate-400">
                  equity decision story.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Sign in to reopen saved ESOP analyses, review your account,
                continue modelling and access your PRO decision workspace.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-9 rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,.3)] backdrop-blur sm:p-7"
            >
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Email
                </label>

                <div className="relative">
                  <Fingerprint className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    autoComplete="email"
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm shadow-none transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-black text-blue-600 transition hover:text-blue-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    required
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-12 text-sm shadow-none transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
                    onChange={(event) => setPassword(event.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:scale-110 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">{error}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading || guestLoading}
                className="group mt-6 h-12 w-full rounded-xl bg-[#07111f] text-sm font-black text-white shadow-[0_15px_35px_-18px_rgba(15,23,42,.6)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your workspace
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </>
                )}
              </Button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Or explore first
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGuest}
                disabled={loading || guestLoading}
                className="group h-12 w-full rounded-xl border-slate-200 bg-white text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50"
              >
                {guestLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening simulator...
                  </>
                ) : (
                  <>
                    Continue as guest
                    <Calculator className="ml-2 h-4 w-4 text-blue-600 transition-transform group-hover:rotate-6" />
                  </>
                )}
              </Button>

              <p className="mt-6 text-center text-sm text-slate-500">
                New to ESOP Value Clarity?{" "}
                <Link
                  href="/signup"
                  className="font-black text-slate-950 transition hover:text-blue-600"
                >
                  Create an account
                </Link>
              </p>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Your account gives you access to saved analysis and account-specific features.
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[#030817] text-white lg:flex lg:items-center">
          <div className="login-dark-grid pointer-events-none absolute inset-0 opacity-55" />
          <div className="login-orb-one pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-blue-600/15 blur-[150px]" />
          <div className="login-orb-two pointer-events-none absolute -bottom-48 left-[-140px] h-[560px] w-[560px] rounded-full bg-violet-600/10 blur-[150px]" />

          <div className="relative w-full px-12 py-16 xl:px-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-4 py-2">
                <Sparkles className="h-4 w-4 text-blue-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                  CONNECTED EQUITY WORKSPACE
                </span>
              </div>

              <h2 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] xl:text-6xl">
                Your grant is a starting point.
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  The decision needs context.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
                ESOP Value Clarity connects the parts employees usually have
                to decode separately—from vesting and dilution to exercise
                economics, exit scenarios and complete offer comparison.
              </p>

              <div className="mt-10 grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                      EQUITY DECISION FLOW
                    </p>

                    <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Explainable
                    </span>
                  </div>

                  <div className="relative mt-6">
                    <div className="absolute bottom-5 left-[18px] top-5 w-px bg-gradient-to-b from-blue-400/80 via-cyan-400/35 to-transparent" />

                    {[
                      {
                        label: "VESTING",
                        detail: "What is actually earned?",
                        icon: Clock3,
                      },
                      {
                        label: "DILUTION",
                        detail: "What can change after funding?",
                        icon: BarChart3,
                      },
                      {
                        label: "EXERCISE",
                        detail: "What cash could be required?",
                        icon: WalletCards,
                      },
                      {
                        label: "OUTCOMES",
                        detail: "What could different exits mean?",
                        icon: LineChart,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="login-flow-card group relative mb-2 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#08111f]/90 p-4 transition duration-500 last:mb-0 hover:translate-x-2 hover:border-blue-400/20 hover:bg-blue-400/[0.055]"
                          style={{ animationDelay: `${index * 180}ms` }}
                        >
                          <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-[#0b1526] text-blue-300 transition group-hover:-rotate-6 group-hover:scale-110">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-blue-300">
                              {item.label}
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-300">
                              {item.detail}
                            </p>
                          </div>

                          <span className="font-mono text-[9px] font-black text-slate-700">
                            0{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-[24px] border border-violet-400/15 bg-violet-400/[0.055] p-5">
                    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-violet-500/10 blur-[55px]" />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-300">
                          OFFER INTELLIGENCE
                        </p>

                        <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
                          <Scale className="h-4 w-4" />
                          <span className="login-pulse absolute inset-0 rounded-xl border border-violet-300/20" />
                        </div>
                      </div>

                      <p className="mt-4 text-lg font-black leading-6">
                        Compare the economics behind the CTC.
                      </p>

                      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="rounded-xl border border-white/10 bg-[#08111f] p-3">
                          <p className="text-[8px] font-black text-slate-600">
                            OFFER A
                          </p>
                          <p className="mt-2 text-[11px] font-black">
                            Cash + Equity
                          </p>
                        </div>

                        <div className="relative h-px w-8 bg-gradient-to-r from-blue-400/20 via-white/50 to-violet-400/20">
                          <span className="login-energy absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.9)]" />
                        </div>

                        <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.07] p-3">
                          <p className="text-[8px] font-black text-violet-300">
                            OFFER B
                          </p>
                          <p className="mt-2 text-[11px] font-black">
                            Cash + Equity
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/[0.05] p-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-300">
                          PRODUCT PRINCIPLE
                        </p>

                        <p className="mt-2 text-sm font-black">
                          Scenarios, not predictions.
                        </p>

                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                          Assumptions stay visible so modeled value is never
                          presented as guaranteed future wealth.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  {
                    icon: PieChart,
                    value: "Ownership",
                    label: "Understand the stake",
                  },
                  {
                    icon: Layers3,
                    value: "Dilution",
                    label: "Stress-test change",
                  },
                  {
                    icon: BriefcaseBusiness,
                    value: "Offers",
                    label: "Compare trade-offs",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.value}
                      className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]"
                    >
                      <Icon className="h-4 w-4 text-blue-300 transition-transform group-hover:-rotate-6 group-hover:scale-110" />
                      <p className="mt-4 text-xs font-black">{item.value}</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-600">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes loginFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes loginPulse {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes loginEnergy {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translateX(32px);
            opacity: 0;
          }
        }

        @keyframes loginOrbOne {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-50px, 35px) scale(1.1);
          }
        }

        @keyframes loginOrbTwo {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(40px, -25px) scale(1.08);
          }
        }

        .login-light-grid {
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.032) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(15, 23, 42, 0.032) 1px,
              transparent 1px
            );
          background-size: 38px 38px;
        }

        .login-dark-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 34px 34px;
        }

        .login-flow-card {
          animation: loginFloat 6s ease-in-out infinite;
        }

        .login-pulse {
          animation: loginPulse 2.2s ease-out infinite;
        }

        .login-energy {
          animation: loginEnergy 1.8s linear infinite;
        }

        .login-orb-one {
          animation: loginOrbOne 13s ease-in-out infinite;
        }

        .login-orb-two {
          animation: loginOrbTwo 15s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-flow-card,
          .login-pulse,
          .login-energy,
          .login-orb-one,
          .login-orb-two {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
