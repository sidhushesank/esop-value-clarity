"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  Layers3,
  LineChart,
  Loader2,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [error, setError] = useState("");

  const passwordSignals = useMemo(
    () => [
      {
        label: "8+ characters",
        passed: password.length >= 8,
      },
      {
        label: "Upper & lower case",
        passed: /[a-z]/.test(password) && /[A-Z]/.test(password),
      },
      {
        label: "Contains a number",
        passed: /\d/.test(password),
      },
    ],
    [password]
  );

  const passwordStrength = passwordSignals.filter(
    (signal) => signal.passed
  ).length;

  async function handleSignup() {
    if (loading || success) {
      return;
    }

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        return;
      }

      setCreatedEmail(trimmedEmail);
      setSuccess(true);
      setError("");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSignup();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fc] text-slate-950">
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}
      <div className="signup-light-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-[-180px] top-[-180px] h-[540px] w-[540px] rounded-full bg-blue-200/50 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-220px] right-[-140px] h-[560px] w-[560px] rounded-full bg-violet-200/40 blur-[150px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[0.94fr_1.06fr]">
        {/* =====================================================
            SIGNUP FORM
        ====================================================== */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-[540px]">
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

            <div className="mt-9">
              <p className="text-[10px] font-black uppercase tracking-[0.19em] text-blue-600">
                CREATE YOUR WORKSPACE
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#07111f] sm:text-5xl">
                Start with the grant.
                <span className="block text-slate-400">
                  Build the understanding.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Create an account to save ESOP analyses, revisit scenarios and
                build a clearer view of the economics behind employee equity.
              </p>
            </div>

            {success ? (
              <section className="mt-8 overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,.3)]">
                <div className="relative overflow-hidden bg-[#07111f] p-7 text-white">
                  <div className="signup-dark-grid pointer-events-none absolute inset-0 opacity-50" />
                  <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-[70px]" />

                  <div className="relative">
                    <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <Mail className="h-5 w-5" />
                      <span className="signup-pulse absolute inset-0 rounded-2xl border border-emerald-300/20" />
                    </div>

                    <p className="mt-6 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">
                      ACCOUNT CREATED
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                      One step before your workspace opens.
                    </h2>

                    <p className="mt-4 text-sm leading-7 text-slate-400">
                      We&apos;ve sent a verification email
                      {createdEmail ? (
                        <>
                          {" "}to{" "}
                          <span className="font-black text-white">
                            {createdEmail}
                          </span>
                        </>
                      ) : null}
                      . Verify your email before signing in.
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["01", "Open inbox"],
                      ["02", "Verify email"],
                      ["03", "Sign in"],
                    ].map(([number, label]) => (
                      <div
                        key={number}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-mono text-[9px] font-black text-blue-600">
                          {number}
                        </p>
                        <p className="mt-2 text-xs font-black text-slate-800">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <p className="text-xs leading-6 text-slate-600">
                      If the message isn&apos;t visible after a few minutes,
                      check your Spam or Promotions folder.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="group mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07111f] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Go to sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                  </Link>
                </div>
              </section>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,.3)] backdrop-blur sm:p-7"
              >
                {/* NAME */}
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      autoComplete="name"
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm shadow-none transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="mt-5">
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
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm shadow-none transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="mt-5">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-12 text-sm shadow-none transition focus-visible:border-blue-400 focus-visible:ring-blue-100"
                      onChange={(event) => setPassword(event.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:scale-110 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {password.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              index < passwordStrength
                                ? passwordStrength === 1
                                  ? "bg-amber-400"
                                  : passwordStrength === 2
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                        {passwordSignals.map((signal) => (
                          <span
                            key={signal.label}
                            className={`flex items-center gap-1.5 text-[9px] font-bold ${
                              signal.passed
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`grid h-4 w-4 place-items-center rounded-full ${
                                signal.passed
                                  ? "bg-emerald-100"
                                  : "bg-slate-200"
                              }`}
                            >
                              {signal.passed ? (
                                <Check className="h-2.5 w-2.5" />
                              ) : null}
                            </span>
                            {signal.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="mt-5">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Confirm password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                      className={`h-12 rounded-xl bg-slate-50 pl-11 pr-12 text-sm shadow-none transition focus-visible:ring-blue-100 ${
                        confirmPassword &&
                        password !== confirmPassword
                          ? "border-red-300 focus-visible:border-red-400"
                          : confirmPassword &&
                              password === confirmPassword
                            ? "border-emerald-300 focus-visible:border-emerald-400"
                            : "border-slate-200 focus-visible:border-blue-400"
                      }`}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:scale-110 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {confirmPassword ? (
                    <p
                      className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold ${
                        password === confirmPassword
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Passwords match
                        </>
                      ) : (
                        "Passwords do not match yet"
                      )}
                    </p>
                  ) : null}
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-xs leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="group mt-6 h-12 w-full rounded-xl bg-[#07111f] text-sm font-black text-white shadow-[0_15px_35px_-18px_rgba(15,23,42,.6)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      Create my workspace
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    </>
                  )}
                </Button>

                <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-bold text-slate-600 hover:text-blue-600"
                  >
                    Terms
                  </Link>{" "}
                  and acknowledge our{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-slate-600 hover:text-blue-600"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="my-5 h-px bg-slate-200" />

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-black text-slate-950 transition hover:text-blue-600"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </section>

        {/* =====================================================
            PRODUCT STORY
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-[#030817] text-white lg:flex lg:items-center">
          <div className="signup-dark-grid pointer-events-none absolute inset-0 opacity-55" />
          <div className="signup-orb-one pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-blue-600/15 blur-[150px]" />
          <div className="signup-orb-two pointer-events-none absolute -bottom-48 left-[-140px] h-[560px] w-[560px] rounded-full bg-violet-600/10 blur-[150px]" />

          <div className="relative w-full px-12 py-16 xl:px-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.07] px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-blue-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">
                  EMPLOYEE-FIRST EQUITY DECISIONS
                </span>
              </div>

              <h2 className="mt-7 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] xl:text-6xl">
                A grant can look simple.
                <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                  The economics rarely are.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
                Build an account around the questions that actually change
                employee equity—from what is vested and what exercise may cost
                to dilution, possible outcomes and complete job-offer trade-offs.
              </p>

              {/* CONNECTED MODEL */}
              <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                    CONNECTED EQUITY MODEL
                  </p>

                  <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Transparent
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      number: "01",
                      label: "VESTING",
                      title: "What is earned?",
                      icon: Clock3,
                    },
                    {
                      number: "02",
                      label: "DILUTION",
                      title: "What can change?",
                      icon: BarChart3,
                    },
                    {
                      number: "03",
                      label: "EXERCISE",
                      title: "What may it cost?",
                      icon: WalletCards,
                    },
                    {
                      number: "04",
                      label: "OUTCOMES",
                      title: "What could happen?",
                      icon: LineChart,
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.number}
                        className="signup-flow-card group relative rounded-2xl border border-white/[0.07] bg-[#08111f]/90 p-4 transition duration-500 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-blue-400/[0.055]"
                        style={{ animationDelay: `${index * 170}ms` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-[#0b1526] text-blue-300 transition group-hover:-rotate-6 group-hover:scale-110">
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="font-mono text-[9px] font-black text-slate-700">
                            {item.number}
                          </span>
                        </div>

                        <p className="mt-5 text-[8px] font-black uppercase tracking-[0.13em] text-blue-300">
                          {item.label}
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-200">
                          {item.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OFFER INTELLIGENCE */}
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
                <div className="relative overflow-hidden rounded-[24px] border border-violet-400/15 bg-violet-400/[0.055] p-5">
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-[60px]" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-300">
                          OFFER INTELLIGENCE
                        </p>
                        <p className="mt-2 text-lg font-black">
                          Compare beyond headline CTC.
                        </p>
                      </div>

                      <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
                        <Scale className="h-4 w-4" />
                        <span className="signup-pulse absolute inset-0 rounded-xl border border-violet-300/20" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className="rounded-xl border border-white/10 bg-[#08111f] p-3">
                        <p className="text-[8px] font-black text-slate-600">
                          OFFER A
                        </p>
                        <p className="mt-2 text-[11px] font-black">
                          Cash + Equity
                        </p>
                      </div>

                      <div className="relative h-px w-9 bg-gradient-to-r from-blue-400/20 via-white/50 to-violet-400/20">
                        <span className="signup-energy absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.9)]" />
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
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />

                  <p className="mt-4 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-300">
                    PRODUCT PRINCIPLE
                  </p>

                  <p className="mt-2 text-sm font-black">
                    Understand before you decide.
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    Scenarios remain scenarios. Assumptions remain visible.
                    Equity opportunity is not presented as guaranteed cash.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Save analysis",
                  "Revisit scenarios",
                  "Build decision context",
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes signupFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes signupPulse {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes signupEnergy {
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
            transform: translateX(34px);
            opacity: 0;
          }
        }

        @keyframes signupOrbOne {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-50px, 35px) scale(1.1);
          }
        }

        @keyframes signupOrbTwo {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(40px, -25px) scale(1.08);
          }
        }

        .signup-light-grid {
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.032) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(15, 23, 42, 0.032) 1px,
              transparent 1px
            );
          background-size: 38px 38px;
        }

        .signup-dark-grid {
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

        .signup-flow-card {
          animation: signupFloat 6s ease-in-out infinite;
        }

        .signup-pulse {
          animation: signupPulse 2.2s ease-out infinite;
        }

        .signup-energy {
          animation: signupEnergy 1.8s linear infinite;
        }

        .signup-orb-one {
          animation: signupOrbOne 13s ease-in-out infinite;
        }

        .signup-orb-two {
          animation: signupOrbTwo 15s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .signup-flow-card,
          .signup-pulse,
          .signup-energy,
          .signup-orb-one,
          .signup-orb-two {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}