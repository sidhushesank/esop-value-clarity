

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Footer from "@/components/sections/Footer";
import { FileText } from "lucide-react";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Shield,
  ShieldCheck,
  Crown,
  BarChart3,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Loader2,
  Wallet,
  LineChart,
  CheckCircle2,
  Activity,
  Receipt,
  Scale,
  Sparkles,
  Clock3,
  TrendingUp,
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
    <main className="min-h-screen bg-[#f7f9fc] px-6 py-10">
      <section className="relative mx-auto max-w-[1480px] overflow-hidden rounded-[30px] bg-[#030817] p-8 text-white shadow-[0_35px_100px_-45px_rgba(15,23,42,.8)] md:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            <Activity size={16} /> Equity Decision Workspace
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] md:text-5xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Review your saved equity analysis, account settings and decision history,
            then move into the tools that explain vesting, dilution, exercise cost,
            tax, exit scenarios and complete offer economics.
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-[1480px] gap-6 lg:grid-cols-3">
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
              />
              <StatCard
                title="Highest Exit"
                value={`₹${user.stats.highestExit.toLocaleString("en-IN")}`}
                icon={<LineChart />}
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
          {/* =====================================================
              CONNECTED EQUITY DECISION WORKSPACE
              Visible to FREE, PRO and Founder accounts.
              Messaging + CTA adapt to account state.
          ====================================================== */}
          <section className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-[#030817] p-7 text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,.95)] md:p-9">
            <div className="profile-dark-grid pointer-events-none absolute inset-0 opacity-55" />
            <div className="profile-orb-one pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-600/15 blur-[100px]" />
            <div className="profile-orb-two pointer-events-none absolute -bottom-40 left-[28%] h-80 w-80 rounded-full bg-violet-600/10 blur-[110px]" />

            <div className="relative">
              <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-3 py-1.5">
                    <Crown className="h-3.5 w-3.5 text-blue-300" />
                    <span className="text-[9px] font-black uppercase tracking-[0.17em] text-blue-200">
                      {user.account.isFounder
                        ? "FOUNDER PRO · FULL WORKSPACE"
                        : user.account.isPro
                        ? "PRO · DECISION WORKSPACE ACTIVE"
                        : "YOUR NEXT LAYER · PRO"}
                    </span>
                  </div>

                  <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.05] tracking-[-0.05em] md:text-5xl">
                    {user.account.isPro ? (
                      <>
                        Your equity model becomes
                        <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                          a connected decision workspace.
                        </span>
                      </>
                    ) : (
                      <>
                        Your ESOP number is only
                        <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                          the beginning of the decision.
                        </span>
                      </>
                    )}
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                    {user.account.isPro
                      ? "Move across the complete ESOP Value Clarity workflow—from vesting and dilution to exercise economics, tax context, exit scenarios, saved reports and Offer Intelligence."
                      : "PRO turns a saved simulation into a connected equity decision workspace—so you can understand what is vested, what dilution can change, what exercise may cost, what different exits could mean and how an entire job offer compares beyond headline CTC."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      "Vesting",
                      "Dilution",
                      "Exercise",
                      "Exit",
                      "Tax",
                      "Compare",
                      "Reports",
                      "Offers",
                    ].map((item, index) => (
                      <span
                        key={item}
                        className="profile-chip rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-400"
                        style={{ animationDelay: `${index * 110}ms` }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[25px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                      {user.account.isPro ? "WORKSPACE STATUS" : "FREE → PRO"}
                    </p>
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {user.account.isPro ? "Unlocked" : "Available"}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.07] bg-[#08111f] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {user.account.isPro ? "INPUT" : "FREE"}
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        Model the equity
                      </p>
                    </div>

                    <div className="relative h-px w-12 shrink-0 bg-gradient-to-r from-blue-400/20 via-white/60 to-violet-400/20">
                      <span className="profile-energy absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.9)]" />
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl border border-blue-400/20 bg-blue-400/[0.07] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-blue-300">
                        {user.account.isPro ? "DECISION" : "PRO"}
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        Understand the trade-off
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-300">
                      PRODUCT PRINCIPLE
                    </p>
                    <p className="mt-2 text-xs font-black text-white">
                      Scenarios, not predictions. Context, not black boxes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-9">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">
                      THE PRO WORKSPACE
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                      Eight connected layers of equity intelligence.
                    </h3>
                  </div>
                  <p className="max-w-md text-xs leading-6 text-slate-500">
                    Each layer answers a different employee-equity question.
                    Together they explain the economics behind the grant.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      n: "01",
                      title: "Vesting Intelligence",
                      desc: "Track vested and unvested equity, cliffs and time-based ownership.",
                      icon: Clock3,
                      signal: "WHAT IS EARNED?",
                    },
                    {
                      n: "02",
                      title: "Dilution Intelligence",
                      desc: "Model how future funding and share expansion can change ownership.",
                      icon: BarChart3,
                      signal: "WHAT CAN SHRINK?",
                    },
                    {
                      n: "03",
                      title: "Exercise Decision",
                      desc: "Understand strike price, exercise cost and the cash required to act.",
                      icon: Wallet,
                      signal: "WHAT MUST I PAY?",
                    },
                    {
                      n: "04",
                      title: "Exit Scenarios",
                      desc: "Compare company outcomes without presenting a scenario as a forecast.",
                      icon: LineChart,
                      signal: "WHAT COULD HAPPEN?",
                    },
                    {
                      n: "05",
                      title: "Tax Estimation",
                      desc: "Bring estimated tax impact into the economic picture beyond gross value.",
                      icon: Receipt,
                      signal: "WHAT MAY I KEEP?",
                    },
                    {
                      n: "06",
                      title: "Scenario Comparison",
                      desc: "Compare assumptions side by side and identify what drives the difference.",
                      icon: Scale,
                      signal: "WHAT CHANGED?",
                    },
                    {
                      n: "07",
                      title: "Reports & History",
                      desc: "Save analysis, revisit decisions and create clearer equity outputs.",
                      icon: FileText,
                      signal: "WHAT DID I MODEL?",
                    },
                    {
                      n: "08",
                      title: "Offer Intelligence",
                      desc: "Compare salary, variable pay and equity economics across complete job offers.",
                      icon: Crown,
                      signal: "WHICH TRADE-OFF?",
                    },
                  ].map((feature, index) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.n}
                        className="profile-pro-card group relative min-h-[210px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-5 transition duration-500 hover:-translate-y-2 hover:border-blue-400/25 hover:bg-blue-400/[0.055]"
                        style={{ animationDelay: `${index * 120}ms` }}
                      >
                        <span className="absolute right-4 top-4 font-mono text-[9px] font-black text-slate-700">
                          {feature.n}
                        </span>

                        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-[#0b1526] text-blue-300 transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
                          <Icon className="h-4 w-4" />
                        </div>

                        <p className="mt-5 text-[8px] font-black uppercase tracking-[0.13em] text-blue-300">
                          {feature.signal}
                        </p>
                        <h4 className="mt-2 text-sm font-black text-white">
                          {feature.title}
                        </h4>
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                          {feature.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                <div className="relative overflow-hidden rounded-[24px] border border-violet-400/15 bg-violet-400/[0.05] p-5">
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-[60px]" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-300">
                          OFFER INTELLIGENCE
                        </p>
                        <p className="mt-2 text-lg font-black">
                          Two CTCs can hide two very different economics.
                        </p>
                      </div>

                      <div className="relative hidden h-11 w-11 place-items-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300 sm:grid">
                        <Scale className="h-4 w-4" />
                        <span className="profile-pulse absolute inset-0 rounded-xl border border-violet-300/20" />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-[#08111f] p-4">
                        <p className="text-[8px] font-black text-slate-600">OFFER A</p>
                        <p className="mt-2 text-xs font-black">Guaranteed cash</p>
                        <p className="mt-1 text-xs font-black text-blue-300">+ Equity terms</p>
                      </div>

                      <div className="relative h-px w-10 bg-gradient-to-r from-blue-400/20 via-white/50 to-violet-400/20">
                        <span className="profile-energy absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.9)]" />
                      </div>

                      <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.07] p-4">
                        <p className="text-[8px] font-black text-violet-300">OFFER B</p>
                        <p className="mt-2 text-xs font-black">Guaranteed cash</p>
                        <p className="mt-1 text-xs font-black text-violet-300">+ Equity terms</p>
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                      Compare guaranteed compensation separately from uncertain
                      equity opportunity, vesting, dilution and exercise risk.
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[24px] border border-blue-400/15 bg-blue-400/[0.045] p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                    {user.account.isPro ? "DECISION LENS" : "WHY PRO?"}
                  </p>

                  <h4 className="mt-3 text-xl font-black tracking-[-0.025em]">
                    The expensive mistake is not a bad chart.
                  </h4>
                  <p className="mt-2 text-xl font-black tracking-[-0.025em] text-blue-300">
                    It is misunderstanding the equity.
                  </p>

                  <div className="mt-5 space-y-3">
                    {[
                      "See exercise cost before treating options as value.",
                      "See dilution before assuming today's ownership lasts.",
                      "See offer economics before treating headline CTC as cash.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 text-[11px] leading-5 text-slate-400"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-5 rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {user.account.isPro ? (
                    <>
                      <p className="text-lg font-black text-white">
                        Your complete decision workspace is ready.
                      </p>
                      <p className="mt-1 text-lg font-black text-blue-300">
                        Continue where the equity question takes you.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black text-white">
                        Go from “What could this be worth?”
                      </p>
                      <p className="mt-1 text-lg font-black text-blue-300">
                        to “What should I understand before I decide?”
                      </p>
                    </>
                  )}

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    {user.account.isPro
                      ? "Open the connected PRO workspace for deeper equity analysis and Offer Intelligence."
                      : "View pricing and unlock the complete PRO workspace."}
                  </p>
                </div>

                <Link
                  href={user.account.isPro ? "/pro" : "/pricing"}
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-[0_15px_35px_-15px_rgba(37,99,235,.9)] transition hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_20px_45px_-12px_rgba(37,99,235,.75)]"
                >
                  {user.account.isPro ? "Open PRO workspace" : "See what PRO unlocks"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
      <style jsx global>{`
        @keyframes profilePulse {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes profileEnergy {
          0% { transform: translateX(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(40px); opacity: 0; }
        }

        @keyframes profileCardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes profileChipBreathe {
          0%, 100% { opacity: 0.62; }
          50% { opacity: 1; }
        }

        @keyframes profileOrbOne {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-42px, 34px) scale(1.12); }
        }

        @keyframes profileOrbTwo {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(38px, -28px) scale(1.1); }
        }

        .profile-dark-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 34px 34px;
        }

        .profile-pulse { animation: profilePulse 2.2s ease-out infinite; }
        .profile-energy { animation: profileEnergy 1.8s linear infinite; }
        .profile-pro-card { animation: profileCardFloat 6s ease-in-out infinite; }
        .profile-chip { animation: profileChipBreathe 4s ease-in-out infinite; }
        .profile-orb-one { animation: profileOrbOne 12s ease-in-out infinite; }
        .profile-orb-two { animation: profileOrbTwo 14s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .profile-pulse,
          .profile-energy,
          .profile-pro-card,
          .profile-chip,
          .profile-orb-one,
          .profile-orb-two {
            animation: none !important;
          }
        }
      `}</style>

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
      <div className="-mx-6 -mb-10 mt-16">
        <Footer />
      </div>
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
