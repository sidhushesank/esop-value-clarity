"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGuest = () => {
    localStorage.setItem("session", "guest");
    router.push("/simulator");
  };

  const handleLogin = () => {
    // Demo credentials
    if (
      email === "demo@esopclarity.com" &&
      password === "demo123"
    ) {
      localStorage.setItem("session", "user");
      router.push("/simulator");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gradient-to-br from-slate-50 to-slate-100">

      {/* LEFT */}
      <div className="flex items-center justify-center px-6">
        <Card className="w-full max-w-md border border-slate-200 shadow-xl">
          <CardContent className="p-8 space-y-8">

            {/* Brand */}
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                ESOP Value Clarity
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500">
                Sign in to explore your ESOP value in minutes.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <Input
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
            )}

            {/* Login */}
            <Button
              onClick={handleLogin}
              className="w-full h-11 bg-gradient-to-r from-slate-900 to-slate-800"
            >
              Login
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">
                  or
                </span>
              </div>
            </div>

            {/* Guest */}
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleGuest}
            >
              Continue as Guest
            </Button>

            {/* Info */}
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-600">
                Demo credentials
              </p>
              <p>Email: demo@esopclarity.com</p>
              <p>Password: demo123</p>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-slate-400 text-center">
              Demo-only educational tool. No real authentication is performed.
            </p>

          </CardContent>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex items-center justify-center px-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-sm space-y-6">
          <h2 className="text-4xl font-semibold">
            Clarity over complexity.
          </h2>
          <p className="text-slate-300">
            Understand equity, dilution, and exit value using
            transparent assumptions.
          </p>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>✓ No spreadsheets required</li>
            <li>✓ No jargon</li>
            <li>✓ Educational demo</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
