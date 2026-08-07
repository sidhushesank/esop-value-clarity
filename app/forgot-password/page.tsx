"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      setMessage(data.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">

      <Card className="w-full max-w-md shadow-xl">

        <CardContent className="p-8 space-y-6">

          <div className="space-y-2 text-center">

            <h1 className="text-3xl font-bold">
              Forgot Password
            </h1>

            <p className="text-slate-500">
              Enter your registered email.
            </p>

          </div>

          <Input
            placeholder="Email Address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          {message && (
            <p className="text-center text-sm text-green-600">
              {message}
            </p>
          )}

          <div className="text-center">

            <Link
              href="/login"
              className="text-blue-600 hover:underline"
            >
              Back to Login
            </Link>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}