"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Calculator,
  History,
  LogOut,
  User,
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
}

export default function UserMenu() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

 async function handleLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  window.location.href = "/login";
}

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-full border bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
          {initials}
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold">
            {user.name}
          </p>

          <p className="text-xs text-slate-500">
            {user.email}
          </p>
        </div>

        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border bg-white shadow-2xl overflow-hidden z-50">

          <div className="border-b p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
                {initials}
              </div>

              <div>
                <p className="font-semibold">
                  {user.name}
                </p>

                <p className="text-sm text-slate-500">
                  {user.email}
                </p>
              </div>

            </div>

          </div>

          <div className="py-2">

            <MenuItem
              icon={<LayoutDashboard size={18} />}
              text="Dashboard"
              onClick={() => router.push("/dashboard")}
            />

            <MenuItem
              icon={<Calculator size={18} />}
              text="Simulator"
              onClick={() => router.push("/simulator")}
            />

            <MenuItem
              icon={<History size={18} />}
              text="History"
              onClick={() => router.push("/history")}
            />

            <MenuItem
              icon={<User size={18} />}
              text="Profile"
              onClick={() => router.push("/profile")}
            />

          </div>

          <div className="border-t py-2">

            <MenuItem
              icon={<LogOut size={18} />}
              text="Logout"
              danger
              onClick={handleLogout}
            />

          </div>

        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  text,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-3 text-sm transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "hover:bg-slate-100"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}