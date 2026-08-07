"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
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
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    try {
      setLoading(true);

      const response = await fetch("/api/guest/create", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      router.push("/simulator");
      router.refresh();
    } catch {
      alert("Unable to continue as guest");
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

            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                ESOP Value Clarity
              </p>

              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h1>

              <p className="text-sm text-slate-500">
                Sign in to explore your ESOP value.
              </p>
            </div>

            <div className="space-y-4">

              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-slate-500 hover:text-slate-900 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

            </div>

            {error && (
              <p className="text-sm text-center text-red-500">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Divider */}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">
                  OR
                </span>
              </div>
            </div>

            {/* Guest Button */}

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGuest}
              disabled={loading}
            >
              Continue as Guest
            </Button>

            {/* Signup Link */}

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign Up
              </Link>
            </p>

            {/* Demo Credentials */}

            <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">
                Demo Credentials
              </p>

              <p>Email: demo@esopclarity.com</p>
              <p>Password: demo123</p>
            </div>

          </CardContent>

        </Card>

      </div>

      {/* RIGHT */}

      <div className="hidden md:flex items-center justify-center bg-slate-900 text-white">

        <div className="max-w-sm space-y-6">

          <h2 className="text-5xl font-bold">
            Clarity over complexity.
          </h2>

          <p className="text-slate-300">
            Understand equity, dilution and exit value using
            transparent assumptions.
          </p>

          <ul className="space-y-2 text-slate-300">
            <li>✓ No spreadsheets required</li>
            <li>✓ No jargon</li>
            <li>✓ Educational demo</li>
          </ul>

        </div>

      </div>

    </div>
  );
}