"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import { Menu, X, Crown } from "lucide-react";

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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5">

        {/* ================================================== */}
        {/* LEFT SIDE                                          */}
        {/* ================================================== */}

        <div className="flex items-center gap-4">

          {/* Logo */}
          <Link
  href="/"
  className="-ml-3 text-lg font-bold tracking-tight text-slate-950 md:text-xl"
>
            ESOP Value Clarity
          </Link>

          {/* ================================================== */}
          {/* FREE / PRO WORKSPACE SWITCHER                      */}
          {/* ================================================== */}

          {user && (
            <div className="hidden items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm md:flex">

              {/* FREE - Active */}
              <Link
                href="/dashboard"
                className="
                  rounded-xl
                  bg-slate-950
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
                "
              >
                FREE
              </Link>

              {/* PRO - Upgrade */}
              <Link
                href="/pricing"
                className="
                  group
                  flex
                  items-center
                  gap-1.5
                  rounded-xl
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  hover:text-slate-950
                "
              >
                <Crown
                  size={12}
                  className="text-amber-500 transition-transform group-hover:scale-110"
                />

                PRO
              </Link>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* DESKTOP NAVIGATION                                  */}
        {/* ================================================== */}

        <nav className="hidden items-center gap-8 md:flex">

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
            href="/blog"
            active={pathname.startsWith("/blog")}
          >
            Blog
          </NavLink>

          <NavLink
            href="/about"
            active={pathname === "/about"}
          >
            About
          </NavLink>

        </nav>

        {/* ================================================== */}
        {/* DESKTOP RIGHT                                      */}
        {/* ================================================== */}

        <div className="hidden md:flex">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex gap-3">

              <Link
                href="/login"
                className="
                  rounded-lg
                  border
                  border-slate-200
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-100
                "
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="
                  rounded-lg
                  bg-slate-950
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Sign Up
              </Link>

            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* MOBILE RIGHT                                        */}
        {/* ================================================== */}

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-2
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            md:hidden
          "
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* ================================================== */}
      {/* MOBILE MENU                                         */}
      {/* ================================================== */}

      {open && (
        <div className="border-t border-slate-200 bg-white shadow-lg md:hidden">

          <nav className="flex flex-col px-6 py-4">

            {/* ---------------------------------------------- */}
            {/* MOBILE WORKSPACE SWITCHER                      */}
            {/* ---------------------------------------------- */}

            {user && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">

                <div className="grid grid-cols-2 gap-1">

                  {/* FREE */}
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="
                      rounded-xl
                      bg-slate-950
                      px-4
                      py-3
                      text-center
                      text-xs
                      font-bold
                      text-white
                    "
                  >
                    FREE
                  </Link>

                  {/* PRO */}
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      rounded-xl
                      px-4
                      py-3
                      text-xs
                      font-bold
                      text-slate-600
                      transition
                      hover:bg-white
                      hover:text-slate-950
                    "
                  >
                    <Crown
                      size={12}
                      className="text-amber-500"
                    />

                    PRO
                  </Link>

                </div>
              </div>
            )}

            {/* ---------------------------------------------- */}
            {/* NAVIGATION                                      */}
            {/* ---------------------------------------------- */}

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
              href="/blog"
              active={pathname.startsWith("/blog")}
              onClick={() => setOpen(false)}
            >
              Blog
            </MobileLink>

            <MobileLink
              href="/about"
              active={pathname === "/about"}
              onClick={() => setOpen(false)}
            >
              About
            </MobileLink>

            {/* ---------------------------------------------- */}
            {/* AUTH                                             */}
            {/* ---------------------------------------------- */}

            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="
                    mt-4
                    rounded-lg
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-center
                    font-medium
                    text-slate-700
                  "
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="
                    mt-3
                    rounded-lg
                    bg-slate-950
                    px-4
                    py-3
                    text-center
                    font-medium
                    text-white
                  "
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

/* ====================================================== */
/* DESKTOP NAV LINK                                       */
/* ====================================================== */

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
      className={`
        text-sm
        transition
        ${
          active
            ? "font-semibold text-slate-950"
            : "text-slate-500 hover:text-slate-950"
        }
      `}
    >
      {children}
    </Link>
  );
}

/* ====================================================== */
/* MOBILE NAV LINK                                        */
/* ====================================================== */

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
      className={`
        py-3
        text-base
        ${
          active
            ? "font-semibold text-slate-950"
            : "text-slate-600"
        }
      `}
    >
      {children}
    </Link>
  );
}