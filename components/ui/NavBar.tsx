"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import { Menu, X } from "lucide-react";

interface User {
  name: string;
  email: string;
}

export default function NavBar() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
  async function loadUser() {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  loadUser();
}, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="text-lg md:text-xl font-bold tracking-tight"
        >
          ESOP Value Clarity
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">

          <NavLink
            href="/dashboard"
            active={pathname === "/dashboard"}
          >
            Dashboard
          </NavLink>

          <NavLink
            href="/simulator"
            active={pathname === "/simulator"}
          >
            Simulator
          </NavLink>

          <NavLink
            href="/history"
            active={pathname === "/history"}
          >
            History
          </NavLink>

          <NavLink
            href="/about"
            active={pathname === "/about"}
          >
            About
          </NavLink>

        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className="h-7 w-7" />
          ) : (
            <Menu className="h-7 w-7" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t bg-white shadow-lg">

          <nav className="flex flex-col px-6 py-4">

            <MobileLink
              href="/dashboard"
              active={pathname === "/dashboard"}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </MobileLink>

            <MobileLink
              href="/simulator"
              active={pathname === "/simulator"}
              onClick={() => setOpen(false)}
            >
              Simulator
            </MobileLink>

            <MobileLink
              href="/history"
              active={pathname === "/history"}
              onClick={() => setOpen(false)}
            >
              History
            </MobileLink>

            <MobileLink
              href="/about"
              active={pathname === "/about"}
              onClick={() => setOpen(false)}
            >
              About
            </MobileLink>

            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-lg border px-4 py-3 text-center font-medium"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-3 rounded-lg bg-slate-900 px-4 py-3 text-center font-medium text-white"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="mt-4">
                <UserMenu />
              </div>
            )}

          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-sm transition ${
        active
          ? "font-semibold text-slate-900"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`py-3 text-base ${
        active
          ? "font-semibold text-slate-900"
          : "text-slate-600"
      }`}
    >
      {children}
    </Link>
  );
}