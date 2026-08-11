"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Footer from "@/components/sections/Footer";
import {
  User,
  Mail,
  Lock,
  Calendar,
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
  Activity
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
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Waitlist State
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          description: data.message || "Please check your current password and try again.",
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

  const handleJoinWaitlist = () => {
    setJoinedWaitlist(true);
    
    // Trigger celebration confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#3b82f6", "#8b5cf6", "#f59e0b"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#3b82f6", "#8b5cf6", "#f59e0b"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    toast.success("You're on the list!", {
      description: "We'll notify you as soon as PRO features drop.",
    });
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
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-blue-400 font-semibold">
            <Activity size={16} /> User Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Welcome back, {user.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Manage your equity portfolio, upgrade your security, and discover upcoming AI-powered financial tools.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* PROFILE CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-3xl font-bold text-white shadow-lg">
              {initials}
            </div>

            <h2 className="mt-5 text-center text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-center font-medium text-slate-500">{user.email}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck size={16} />
                {user.account.verified ? "Verified" : "Unverified"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                <Crown size={16} />
                {user.account.plan} Plan
              </span>
            </div>
          </div>

          {/* SAAS STATS */}
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

        {/* RIGHT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* PERSONAL INFO */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Security & Settings</h2>

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
            <Info icon={<Lock size={18} />} label="Password" value="••••••••••••••" />
            <Info
              icon={<Calendar size={18} />}
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />

            <div className="mt-8 flex flex-wrap gap-3">
              {editing ? (
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : null}
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
            </div>
          </div>

          {/* AI FEATURES */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-600/30">
                <Brain size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">AI Intelligence Studio</h2>
            </div>
            
            <p className="relative z-10 mt-3 text-slate-600 font-medium">
              We're building the next generation of predictive ESOP analytics.
            </p>

            <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-2">
              <FeatureCard title="AI Equity Advisor" desc="Personalized vest-and-sell strategies" />
              <FeatureCard title="Smart Exit Prediction" desc="Forecast IPOs and acquisitions" />
              <FeatureCard title="Tax Optimization" desc="Minimize capital gains intelligently" />
              <FeatureCard title="Company Benchmarking" desc="Compare equity against competitors" />
              <FeatureCard title="Portfolio Health Score" desc="Real-time risk assessment" />
              <FeatureCard title="NLP Financial Insights" desc="Chat with your equity data" />
            </div>
          </div>

          {/* PRO WAITLIST */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[80px]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 p-2 text-white shadow-lg shadow-yellow-500/30">
                  <Crown size={24} />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">Value Clarity <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">PRO</span></h2>
              </div>

              <p className="mt-4 max-w-xl text-lg font-medium text-slate-300">
                Unlock premium predictive modeling, unlimited scenario comparisons, and priority AI access designed for top-tier professionals.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <ProItem text="Unlimited Simulations" />
                <ProItem text="AI Assistant" />
                <ProItem text="Advanced Reports" />
                <ProItem text="Scenario Comparison" />
                <ProItem text="PDF Export" />
                <ProItem text="Priority Support" />
              </div>

              <button
                onClick={handleJoinWaitlist}
                disabled={joinedWaitlist}
                className={`mt-10 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl px-8 py-4 font-bold transition-all duration-300 ${
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
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 font-medium">Keep your account secure.</p>

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
                className="flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-slate-900/20"
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

// ---------------------------
// SUB-COMPONENTS
// ---------------------------

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
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
        <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</h3>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group flex flex-col justify-center rounded-2xl border border-blue-100/50 bg-white/60 p-5 backdrop-blur-sm transition-all hover:border-blue-300 hover:bg-white hover:shadow-md hover:shadow-blue-500/5 cursor-default">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Sparkles size={16} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{title}</h4>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{desc}</p>
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
  setShow 
}: { 
  placeholder: string; 
  value: string; 
  setValue: (v: string) => void; 
  show: boolean; 
  setShow: (v: boolean) => void;
}) {
  return (
    <div className="relative group">
      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
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
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}