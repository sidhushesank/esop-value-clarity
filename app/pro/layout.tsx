"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkProAccess() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!data.success || !data.user) {
          router.replace("/login");
          return;
        }

        const account = data.user.account;

        if (account?.isPro || account?.isFounder) {
          setAllowed(true);
          return;
        }

        router.replace("/pricing");
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    }

    checkProAccess();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b12] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm font-medium text-slate-400">
            Preparing your PRO workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="bg-[#080b12] text-white">
      {children}
    </div>
  );
}