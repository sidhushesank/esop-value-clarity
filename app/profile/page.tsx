

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Footer from "@/components/sections/Footer";
import { FileText } from "lucide-react";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Shield,
  ShieldCheck,
  Sparkles,
  Brain,
  Rocket,
  Crown,
  BarChart3,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Loader2,
  TrendingUp,
  Wallet,
  LineChart,
  CheckCircle2,
  Activity,
  Receipt,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;

  stats: {
    totalSimulations: number;
    portfolioValue: number;
    highestExit: number;
  };

  account: {
    plan: string;
    verified: boolean;
    status: string;
    isPro: boolean;
    isFounder: boolean;
    expiresAt: string | null;
    billingCycle: string | null;
  };
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  billingCycle: string;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [cancelling, setCancelling] = useState(false);
const [showCancelModal, setShowCancelModal] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setName(data.user.name);
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/payments/history", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPayments(data.payments);
        }
      });
  }, []);

  async function saveProfile() {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (data.success) {
        setUser((prev) =>
          prev ? { ...prev, name: data.user.name } : prev
        );
        window.dispatchEvent(new Event("profile-updated"));
        setEditing(false);
        toast.success("Profile updated successfully!", {
          description: "Your changes have been saved.",
        });
      } else {
        toast.error("Profile update failed", {
          description: data.message,
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Password updated successfully!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error("Failed to update password", {
          description:
            data.message ||
            "Please check your current password and try again.",
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setChangingPassword(false);
    }
  }



  async function cancelSubscription() {
  setCancelling(true);

  try {
    const res = await fetch("/api/subscription/cancel", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      toast.success("Cancellation scheduled", {
  description: `Your PRO access remains active until ${new Date(
    user?.account.expiresAt ?? ""
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}.`,
});

      setUser((prev) =>
        prev
          ? {
              ...prev,
              account: {
                ...prev.account,
                status: "CANCELLED",
              },
            }
          : prev
      );

      setShowCancelModal(false);
    } else {
      toast.error(data.message);
    }
  } catch {
    toast.error("Unable to cancel subscription.");
  } finally {
    setCancelling(false);
  }
}

  const handleJoinWaitlist = async () => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error("Unable to join the waitlist", {
          description: data.message || "Please try again.",
        });
        return;
      }

      setJoinedWaitlist(true);

      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#3b82f6", "#8b5cf6", "#f59e0b"],
        });

        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#3b82f6", "#8b5cf6", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      toast.success(
        data.alreadyJoined
          ? "You're already on the list!"
          : "You're on the list!",
        {
          description: data.message,
        }
      );
    } catch (error) {
      console.error("Waitlist request failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again in a few moments.",
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-72 rounded bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-80 rounded-3xl bg-slate-200" />
            <div className="h-80 rounded-3xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <h1 className="text-3xl font-bold">Please login first.</h1>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-800"
        >
          Login
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            <Activity size={16} /> User Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Manage your equity portfolio, upgrade your security, and discover
            upcoming AI-powered financial tools.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-3xl font-bold text-white shadow-lg">
              {initials}
            </div>

            <h2 className="mt-5 text-center text-2xl font-bold text-slate-900">
              {user.name}
            </h2>
            <p className="text-center font-medium text-slate-500">
              {user.email}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck size={16} />
                {user.account.verified ? "Verified" : "Unverified"}
              </span>

              <span
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold ${
                  user.account.isFounder
                    ? "bg-purple-100 text-purple-700"
                    : user.account.isPro
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Crown size={16} />

                {user.account.isFounder
                  ? "Founder PRO"
                  : user.account.isPro
                  ? "PRO Plan"
                  : "FREE Plan"}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
              <BarChart3 className="text-blue-600" /> Performance
            </h3>

            <div className="space-y-4">
              <StatCard
                title="Total Simulations"
                value={user.stats.totalSimulations.toString()}
                icon={<Activity />}
              />
              <StatCard
                title="Portfolio Value"
                value={`₹${user.stats.portfolioValue.toLocaleString("en-IN")}`}
                icon={<Wallet />}
                trend="+12.5%"
              />
              <StatCard
                title="Highest Exit"
                value={`₹${user.stats.highestExit.toLocaleString("en-IN")}`}
                icon={<LineChart />}
                trend="+8.2%"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Security & Settings
            </h2>
            {user.account.status === "CANCELLED" && user.account.expiresAt && (
  <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div className="flex items-start gap-3">
      <ShieldCheck className="mt-0.5 text-amber-600" size={22} />

      <div>
        <h3 className="font-bold text-amber-900">
          Cancellation Scheduled
        </h3>

        <p className="mt-1 text-sm text-amber-800">
          Your PRO membership remains active until{" "}
          <span className="font-semibold">
            {new Date(user.account.expiresAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>.
          After that your account automatically switches to the Free plan.
        </p>
      </div>
    </div>
  </div>
)}

            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 font-medium text-slate-500">
                <User size={18} /> Full Name
              </div>

              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-medium text-slate-900">
                  {user.name}
                </div>
              )}
            </div>

            <Info icon={<Mail size={18} />} label="Email" value={user.email} />

            <Info
              icon={<Lock size={18} />}
              label="Password"
              value="••••••••••••••"
            />

            <Info
              icon={<Calendar size={18} />}
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />

            <Info
              icon={<Crown size={18} />}
              label="Subscription"
              value={
                user.account.isFounder
                  ? "Founder PRO"
                  : user.account.plan
              }
            />

            <div className="flex items-center justify-between border-b border-slate-100 py-5">
  <div className="flex items-center gap-3 text-slate-600">
    <Shield size={18} />
    <span className="font-semibold text-slate-700">Status</span>
  </div>

  {user.account.status === "CANCELLED" ? (
    <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
  Active • Cancels on Expiry
</span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
      Active
    </span>
  )}
</div>

            {user.account.isPro && user.account.expiresAt && (
              <Info
                icon={<Calendar size={18} />}
                label="Expires"
                value={new Date(
                  user.account.expiresAt
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}

            {user.account.billingCycle && (
              <Info
                icon={<Wallet size={18} />}
                label="Billing"
                value={user.account.billingCycle.replace("_", " ")}
              />
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {editing ? (
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : null}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20"
                >
                  Edit Profile
                </button>
              )}

              <button
                onClick={() => setShowPasswordModal(true)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Change Password
              </button>

              {user.account.isPro &&
                !user.account.isFounder &&
                user.account.status === "ACTIVE" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling}
                    className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Receipt className="text-blue-600" />
                Payment History
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {payments.length} Payments
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <Receipt size={42} className="mx-auto mb-4 text-slate-300" />

                <p className="font-semibold text-slate-700">
                  No payment history yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Once you purchase PRO your invoices and transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-slate-200 p-6 transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          ₹{(payment.amount / 100).toFixed(2)}
                        </h3>

                       <p className="text-sm font-semibold text-slate-700">
  {payment.plan} PLAN
</p>

<p className="text-sm text-slate-500">
  {payment.billingCycle.replace("_", " ")}
</p>

                        <p className="mt-2 text-sm text-slate-400">
                          {new Date(payment.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>

                       {payment.razorpayPaymentId && (
  <p className="mt-2 text-xs font-mono text-slate-400">
    Payment ID{" "}
    {payment.razorpayPaymentId.slice(0, 10)}...
    {payment.razorpayPaymentId.slice(-4)}
  </p>
)}
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            payment.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {payment.status === "SUCCESS" ? "Paid" : "Failed"}
                        </span>

    {payment.status === "SUCCESS" && (
  <button
    onClick={() =>
      window.open(
        `/api/payments/invoice/${payment.id}`,
        "_blank"
      )
    }
    className="flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold transition hover:bg-slate-50"
  >
    <FileText size={16} />
    Download Invoice
  </button>
)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-600/30">
                <Brain size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                AI Intelligence Studio
              </h2>
            </div>

            <p className="relative z-10 mt-3 font-medium text-slate-600">
              We're building the next generation of predictive ESOP analytics.
            </p>

            <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-2">
              <FeatureCard
                title="AI Equity Advisor"
                desc="Personalized vest-and-sell strategies"
              />
              <FeatureCard
                title="Smart Exit Prediction"
                desc="Forecast IPOs and acquisitions"
              />
              <FeatureCard
                title="Tax Optimization"
                desc="Minimize capital gains intelligently"
              />
              <FeatureCard
                title="Company Benchmarking"
                desc="Compare equity against competitors"
              />
              <FeatureCard
                title="Portfolio Health Score"
                desc="Real-time risk assessment"
              />
              <FeatureCard
                title="NLP Financial Insights"
                desc="Chat with your equity data"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('[https://grainy-gradients.vercel.app/noise.svg](https://grainy-gradients.vercel.app/noise.svg)')] opacity-20 mix-blend-overlay" />
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[80px]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 p-2 text-white shadow-lg shadow-yellow-500/30">
                  <Crown size={24} />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Value Clarity{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    PRO
                  </span>
                </h2>
              </div>

              <p className="mt-4 max-w-xl text-lg font-medium text-slate-300">
                Unlock premium predictive modeling, unlimited scenario
                comparisons, and priority AI access designed for top-tier
                professionals.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <ProItem text="Unlimited Simulations" />
                <ProItem text="AI Assistant" />
                <ProItem text="Advanced Reports" />
                <ProItem text="Scenario Comparison" />
                <ProItem text="PDF Export" />
                <ProItem text="Priority Support" />
              </div>

              <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
                <Link
                  href="/pricing"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 font-bold text-slate-950 shadow-xl shadow-yellow-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-yellow-300 hover:to-amber-400"
                >
                  Upgrade to PRO
                  <ArrowRight size={20} />
                </Link>

                <button
                  onClick={handleJoinWaitlist}
                  disabled={joinedWaitlist}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold transition-all duration-300 ${
                    joinedWaitlist
                      ? "cursor-default bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-white text-slate-900 shadow-xl shadow-white/10 hover:scale-[1.02] hover:bg-slate-50"
                  }`}
                >
                  {joinedWaitlist ? (
                    <>
                      <CheckCircle2 className="animate-in zoom-in" size={20} />
                      Joined the Waitlist
                    </>
                  ) : (
                    <>
                      Join the Waitlist
                      <ArrowRight
                        size={20}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
{showCancelModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
    <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
            <X className="text-red-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
  Cancel Subscription
</h2>

<p className="mt-1 text-slate-500">
  You can continue using every PRO feature until your subscription expires.
</p>
          </div>

        </div>

        <button
          onClick={() => setShowCancelModal(false)}
          className="rounded-full p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>

      </div>

     <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
    PRO ACCESS
  </p>

  <h3 className="mt-2 text-lg font-bold text-slate-900">
    Active until{" "}
    {new Date(user!.account.expiresAt!).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </h3>

  <p className="mt-2 text-sm text-slate-600">
    <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm font-medium text-slate-700">
  ✔ No further payments will be charged.
</p>
    After this date your account will automatically switch to the Free plan.
    No further charges will be made.
  </p>
</div>

      <div className="mt-8 flex justify-end gap-3">

        <button
  onClick={() => setShowCancelModal(false)}
  className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
>
  Continue PRO
</button>

        <button
          onClick={cancelSubscription}
          disabled={cancelling}
          className="flex items-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {cancelling ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Cancelling...
            </>
          ) : (
            "Cancel at Expiry"
          )}
        </button>

      </div>

    </div>
  </div>
)}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="font-medium text-slate-500">
              Keep your account secure.
            </p>

            <div className="mt-6 space-y-4">
              <PasswordField
                placeholder="Current Password"
                value={currentPassword}
                setValue={setCurrentPassword}
                show={showCurrentPassword}
                setShow={setShowCurrentPassword}
              />
              <PasswordField
                placeholder="New Password"
                value={newPassword}
                setValue={setNewPassword}
                show={showNewPassword}
                setShow={setShowNewPassword}
              />
              <PasswordField
                placeholder="Confirm Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {changingPassword ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Updating
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-5">
      <div className="flex items-center gap-3 text-slate-600">
        {icon}
        <span className="font-semibold text-slate-700">{label}</span>
      </div>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition-colors group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        {trend && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <TrendingUp size={14} /> {trend}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </h3>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group flex cursor-default flex-col justify-center rounded-2xl border border-blue-100/50 bg-white/60 p-5 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-white hover:shadow-md hover:shadow-blue-500/5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Sparkles size={16} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{title}</h4>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ProItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 font-medium text-slate-200">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-yellow-400">
        <CheckCircle2 size={14} />
      </div>
      {text}
    </div>
  );
}

function PasswordField({
  placeholder,
  value,
  setValue,
  show,
  setShow,
}: {
  placeholder: string;
  value: string;
  setValue: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  return (
    <div className="group relative">
      <Lock
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
      />

      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 font-medium outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
