"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const params = useSearchParams();

  const token = params.get("token");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  async function handleReset() {
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await res.json();

    setMessage(data.message);

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">

      <Card className="w-full max-w-md">

        <CardContent className="p-8 space-y-5">

          <h1 className="text-3xl font-bold">
            Reset Password
          </h1>

          <Input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>

          {message && (
            <p className="text-center text-green-600">
              {message}
            </p>
          )}

        </CardContent>

      </Card>

    </div>
  );
}