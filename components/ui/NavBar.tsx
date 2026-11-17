"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import { Menu, X, Crown } from "lucide-react";

interface User {
  name: string;
  email: string;
  account?: {
    plan?: string;
    isPro?: boolean;
    isFounder?: boolean;
    isTeamSponsored?: boolean;
    isTeamMember?: boolean;
    isTeamAdmin?: boolean;
  };
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

  // PRO switch: users who already have PRO go to their PRO workspace;
  // everyone else goes to Pricing to upgrade.
  const hasPro =
    user?.account?.isPro === true ||
    user?.account?.plan === "PRO" ||
    user?.account?.isFounder === true ||
    user?.account?.isTeamSponsored === true ||
    user?.account?.isTeamMember === true ||
    user?.account?.isTeamAdmin === true;

  const proHref = hasPro ? "/pro" : "/pricing";

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
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-md
                  active:translate-y-0
                  active:scale-95
                "
              >
                FREE
              </Link>

              {/* PRO - workspace if subscribed, otherwise Upgrade */}
              <Link
                href={proHref}
                title={hasPro ? "Open your PRO workspace" : "See PRO plans"}
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
                  duration-300
                  hover:-translate-y-0.5
                  active:translate-y-0
                  active:scale-95
                "
              >
                <Crown
                  size={12}
                  className="text-amber-500 transition-transform group-hover:scale-110 duration-300 group-hover:-rotate-12"
                />

                PRO
              </Link>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* DESKTOP NAVIGATION                                  */}
        {/* ================================================== */}

        <nav className="hidden items-center gap-5 md:flex lg:gap-8">

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
            href="/cap-table"
            active={pathname === "/cap-table"}
          >
            <span className="inline-flex items-center gap-1.5">
              Cap Table
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                Free
              </span>
            </span>
          </NavLink>

          <NavLink
            href="/history"
            active={pathname === "/history"}
          >
            History
          </NavLink>

          <NavLink
            href="/pricing"
            active={pathname === "/pricing"}
          >
            Pricing
          </NavLink>

          <NavLink
            href="/blog"
            active={pathname.startsWith("/blog")}
          >
            Blog
          </NavLink>

          <NavLink
            href="/partners/taxbuddy"
            active={pathname.startsWith("/partners")}
          >
            Partners
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
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-sm
                  active:translate-y-0
                  active:scale-95
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
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-md
                  active:translate-y-0
                  active:scale-95
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
            duration-300
            active:scale-90
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
        <div className="border-t border-slate-200 bg-white shadow-lg md:hidden animate-[navSlide_.3s_ease-out]">

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

                  {/* PRO - workspace if subscribed, otherwise Pricing */}
                  <Link
                    href={proHref}
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
              href="/cap-table"
              active={pathname === "/cap-table"}
              onClick={() => setOpen(false)}
            >
              <span className="inline-flex items-center gap-2">
                Cap Table
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                  Free
                </span>
              </span>
            </MobileLink>

            <MobileLink
              href="/history"
              active={pathname === "/history"}
              onClick={() => setOpen(false)}
            >
              History
            </MobileLink>

            <MobileLink
              href="/pricing"
              active={pathname === "/pricing"}
              onClick={() => setOpen(false)}
            >
              Pricing
            </MobileLink>

            <MobileLink
              href="/blog"
              active={pathname.startsWith("/blog")}
              onClick={() => setOpen(false)}
            >
              Blog
            </MobileLink>

            <MobileLink
              href="/partners/taxbuddy"
              active={pathname.startsWith("/partners")}
              onClick={() => setOpen(false)}
            >
              Partners
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

      <style>{`
        @keyframes navSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          header * { transition: none !important; animation: none !important; }
        }
      `}</style>
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
        relative
        inline-flex
        items-center
        py-1.5
        duration-300
        hover:-translate-y-0.5
        active:translate-y-0
        active:scale-95
        after:pointer-events-none
        after:absolute
        after:inset-x-0
        after:-bottom-1
        after:h-[2px]
        after:origin-center
        after:rounded-full
        after:bg-[#F2B421]
        after:transition-transform
        after:duration-300
        after:ease-out
        hover:after:scale-x-100
        ${
          active
            ? "font-semibold text-slate-950 after:scale-x-100"
            : "text-slate-500 hover:text-slate-950 after:scale-x-0"
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
        transition-all
        duration-300
        hover:translate-x-1.5
        hover:text-slate-950
        active:scale-[0.98]
        border-l-2
        pl-3
        ${
          active
            ? "font-semibold text-slate-950 border-[#F2B421]"
            : "text-slate-600 border-transparent hover:border-slate-300"
        }
      `}
    >
      {children}
    </Link>
  );
}