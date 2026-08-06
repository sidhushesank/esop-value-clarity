"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
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
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-slate-50 to-slate-100">

      {/* LEFT */}

      <div className="flex items-center justify-center px-6">

        <Card className="w-full max-w-md border border-slate-200 shadow-xl">

          <CardContent className="p-8 space-y-8">

            <div className="text-center space-y-2">

              <p className="text-xs uppercase tracking-widest text-slate-500">
                ESOP Value Clarity
              </p>

              <h1 className="text-3xl font-semibold">
                Create Account
              </h1>

              <p className="text-sm text-slate-500">
                Start calculating your ESOP value in minutes.
              </p>

            </div>

            {/* Success Message */}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <h3 className="font-semibold text-green-700">
                  🎉 Account created successfully!
                </h3>

                <p className="mt-1 text-sm text-green-600">
                  Redirecting to login...
                </p>
              </div>
            )}

            <div className="space-y-4">

              <Input
                placeholder="Full Name"
                value={name}
                disabled={loading || success}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                placeholder="Email"
                value={email}
                disabled={loading || success}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                disabled={loading || success}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                disabled={loading || success}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

            </div>

            {error && (
              <p className="text-center text-sm text-red-500">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleSignup}
              disabled={loading || success}
            >
              {loading
                ? "Creating Account..."
                : success
                ? "Account Created"
                : "Create Account"}
            </Button>

            <p className="text-center text-sm text-slate-600">

              Already have an account?{" "}

              <Link
                href="/login"
                className={`font-medium hover:underline ${
                  success
                    ? "pointer-events-none text-slate-400"
                    : "text-slate-900"
                }`}
              >
                Login
              </Link>

            </p>

          </CardContent>

        </Card>

      </div>

      {/* RIGHT */}

      <div className="hidden md:flex items-center justify-center bg-slate-900 text-white">

        <div className="max-w-sm space-y-6">

          <h2 className="text-5xl font-bold">
            Build your equity future.
          </h2>

          <p className="text-slate-300">
            Save calculations, compare scenarios and understand your ESOPs with confidence.
          </p>

          <ul className="space-y-2 text-slate-300">
            <li>✓ Unlimited calculations</li>
            <li>✓ Save history</li>
            <li>✓ Free forever</li>
          </ul>

        </div>

      </div>

    </div>
  );
}