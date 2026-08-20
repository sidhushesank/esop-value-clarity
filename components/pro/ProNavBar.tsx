"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  ReceiptIndianRupee,
  GitBranch,
  Clock3,
  Trophy,
  Scale,
  FileText,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import ProUserMenu from "./ProUserMenu";

const navItems = [
  {
    href: "/pro",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/pro/simulator",
    label: "Simulator",
    icon: Calculator,
  },
  {
    href: "/pro/tax",
    label: "Tax",
    icon: ReceiptIndianRupee,
  },
  {
    href: "/pro/dilution",
    label: "Dilution",
    icon: GitBranch,
  },
  {
    href: "/pro/vesting",
    label: "Vesting",
    icon: Clock3,
  },
  {
    href: "/pro/exit",
    label: "Exit",
    icon: Trophy,
  },
  {
    href: "/pro/compare",
    label: "Compare",
    icon: Scale,
  },
  {
    href: "/pro/reports",
    label: "Reports",
    icon: FileText,
  },
];

export default function ProNavBar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/pro") {
      return pathname === "/pro";
    }

    return pathname.startsWith(href);
  }

  /* -------------------------------------------------- */
  /* CLOSE MENUS AFTER ROUTE CHANGE                     */
  /* -------------------------------------------------- */

  useEffect(() => {
    setMobileOpen(false);
    setWorkspaceOpen(false);
  }, [pathname]);

  /* -------------------------------------------------- */
  /* PREVENT BODY SCROLL WHILE MOBILE MENU IS OPEN      */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ======================================================= */}
      {/* HEADER                                                  */}
      {/* ======================================================= */}

      <header
        className="
          sticky
          top-0
          z-50
          w-full
          border-b
          border-slate-200/80
          bg-white/90
          backdrop-blur-xl
        "
      >
        <div className="shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
          <div
            className="
              flex
              h-[64px]
              w-full
              items-center
              gap-2
              px-4

              md:px-5

              min-[1900px]:gap-3
            "
          >
            {/* ================================================= */}
            {/* LOGO                                              */}
            {/* ================================================= */}

            <Link
              href="/pro"
              aria-label="ESOP Value Clarity"
              className="
                min-w-0
                shrink
                truncate
                text-base
                font-bold
                tracking-tight
                text-slate-950

                sm:text-lg

                xl:w-[178px]
                xl:shrink-0
                xl:text-[18px]

                min-[1700px]:w-[190px]
                min-[1700px]:text-[19px]

                min-[1900px]:w-auto
                min-[1900px]:text-xl
              "
            >
              ESOP Value Clarity
            </Link>

            {/* ================================================= */}
            {/* DESKTOP WORKSPACE SWITCHER                       */}
            {/* ================================================= */}

            <div className="relative hidden shrink-0 xl:block">
              <div
                className="
                  flex
                  h-10
                  items-center
                  gap-0.5
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-1
                  shadow-sm

                  min-[1900px]:h-11
                  min-[1900px]:gap-1
                "
              >
                <Link
                  href="/dashboard"
                  className="
                    rounded-xl
                    px-2.5
                    py-2
                    text-[11px]
                    font-bold
                    text-slate-500
                    transition

                    hover:bg-slate-100
                    hover:text-slate-900

                    min-[1700px]:px-3
                    min-[1900px]:text-xs
                  "
                >
                  FREE
                </Link>

                <Link
                  href="/pro"
                  className="
                    rounded-xl
                    bg-slate-950
                    px-2.5
                    py-2
                    text-[11px]
                    font-black
                    text-white
                    shadow-sm

                    min-[1700px]:px-3
                    min-[1900px]:text-xs
                  "
                >
                  PRO
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setWorkspaceOpen((value) => !value)
                  }
                  aria-label="Switch workspace"
                  aria-expanded={workspaceOpen}
                  className="
                    flex
                    h-8
                    w-6
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    transition

                    hover:bg-slate-100
                    hover:text-slate-900

                    min-[1900px]:w-7
                  "
                >
                  <ChevronDown
                    size={14}
                    className={`
                      transition-transform

                      ${workspaceOpen ? "rotate-180" : ""}
                    `}
                  />
                </button>
              </div>

              {/* ================================================= */}
              {/* DESKTOP WORKSPACE DROPDOWN                        */}
              {/* ================================================= */}

              {workspaceOpen && (
                <div
                  className="
                    absolute
                    left-0
                    top-[calc(100%+8px)]
                    z-[120]
                    w-[200px]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-1.5
                    shadow-[0_18px_50px_rgba(15,23,42,0.16)]
                  "
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setWorkspaceOpen(false)}
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      px-3
                      py-3
                      text-sm
                      font-semibold
                      text-slate-600
                      transition

                      hover:bg-slate-100
                      hover:text-slate-950
                    "
                  >
                    <span>Free Workspace</span>

                    <span className="text-[10px] font-bold text-slate-400">
                      FREE
                    </span>
                  </Link>

                  <Link
                    href="/pro"
                    onClick={() => setWorkspaceOpen(false)}
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      bg-slate-950
                      px-3
                      py-3
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    <span>PRO Workspace</span>

                    <span className="text-[10px] font-bold text-amber-300">
                      PRO
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* ================================================= */}
            {/* DESKTOP PRO NAVIGATION                           */}
            {/* ================================================= */}

            <nav
              className="
                hidden
                min-w-0
                flex-1
                items-center
                gap-0

                xl:flex

                min-[1900px]:gap-0.5
              "
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex
                      h-10
                      min-w-0
                      shrink
                      items-center
                      gap-1
                      rounded-xl
                      px-1.5
                      text-[12px]
                      font-medium
                      transition-all
                      duration-200

                      min-[1500px]:gap-1.5
                      min-[1500px]:px-2
                      min-[1500px]:text-[13px]

                      min-[1900px]:shrink-0
                      min-[1900px]:gap-2
                      min-[1900px]:px-3
                      min-[1900px]:text-sm

                      ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }
                    `}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.9}
                      className={`
                        shrink-0

                        ${
                          active
                            ? "text-blue-600"
                            : "text-slate-500"
                        }
                      `}
                    />

                    <span className="min-w-0 whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* ================================================= */}
            {/* DESKTOP USER MENU                                */}
            {/* ================================================= */}

            <div
              className="
                ml-auto
                hidden
                shrink-0

                xl:block
              "
            >
              <ProUserMenu />
            </div>

            {/* ================================================= */}
            {/* MOBILE SPACER                                    */}
            {/* ================================================= */}

            <div className="ml-auto xl:hidden" />

            {/* ================================================= */}
            {/* MOBILE HAMBURGER                                 */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={() =>
                setMobileOpen((value) => !value)
              }
              aria-label={
                mobileOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={mobileOpen}
              aria-controls="pro-mobile-navigation"
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-slate-200
                bg-white
                text-slate-700
                shadow-sm
                transition

                hover:bg-slate-50

                active:scale-95

                xl:hidden
              "
            >
              {mobileOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================= */}
      {/* MOBILE MENU                                             */}
      {/* ======================================================= */}

      {mobileOpen && (
        <>
          {/* =================================================== */}
          {/* BACKDROP                                            */}
          {/* =================================================== */}

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="
              fixed
              inset-x-0
              bottom-0
              top-[64px]
              z-[80]
              bg-slate-950/20
              backdrop-blur-[1px]

              xl:hidden
            "
          />

          {/* =================================================== */}
          {/* MOBILE PANEL                                        */}
          {/* =================================================== */}

          <div
            id="pro-mobile-navigation"
            className="
              fixed
              left-0
              right-0
              top-[64px]
              z-[90]

              max-h-[calc(100dvh-64px)]
              overflow-y-auto
              overscroll-contain

              border-b
              border-slate-200
              bg-white

              shadow-[0_18px_45px_rgba(15,23,42,0.14)]

              xl:hidden
            "
          >
            <div
              className="
                mx-auto
                w-full
                px-4
                pb-[calc(20px+env(safe-area-inset-bottom))]
                pt-4

                sm:px-5
              "
            >
              {/* =============================================== */}
              {/* MOBILE WORKSPACE SWITCHER                      */}
              {/* =============================================== */}

              <div className="mb-5">
                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-1.5
                  "
                >
                  <Link
                    href="/dashboard"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className="
                      flex
                      min-h-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-white
                      px-3
                      text-sm
                      font-bold
                      text-slate-600
                      shadow-sm
                      transition

                      hover:text-slate-950

                      active:scale-[0.98]
                    "
                  >
                    FREE
                  </Link>

                  <Link
                    href="/pro"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                    className="
                      flex
                      min-h-12
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-950
                      px-3
                      text-sm
                      font-black
                      text-white
                      shadow-sm

                      active:scale-[0.98]
                    "
                  >
                    PRO
                  </Link>
                </div>
              </div>

              {/* =============================================== */}
              {/* PRO TOOLS TITLE                                 */}
              {/* =============================================== */}

              <div className="mb-2 px-1">
                <p
                  className="
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-[0.18em]
                    text-slate-400
                  "
                >
                  Pro Tools
                </p>
              </div>

              {/* =============================================== */}
              {/* MOBILE NAVIGATION                              */}
              {/* =============================================== */}

              <nav className="grid gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(
                    item.href
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileOpen(false)
                      }
                      className={`
                        flex
                        min-h-[58px]
                        items-center
                        gap-3
                        rounded-2xl
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        transition-all
                        duration-200

                        active:scale-[0.99]

                        ${
                          active
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          transition

                          ${
                            active
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                          }
                        `}
                      >
                        <Icon
                          size={19}
                          strokeWidth={1.9}
                        />
                      </div>

                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* =============================================== */}
              {/* ACCOUNT SECTION                                */}
              {/* =============================================== */}

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p
                  className="
                    mb-2
                    px-1
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-[0.18em]
                    text-slate-400
                  "
                >
                  Account
                </p>

                <div
                  className="
                    flex
                    min-h-[72px]
                    w-full
                    items-center
                    justify-between
                    gap-4
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-3
                  "
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-slate-900
                      "
                    >
                      Profile & settings
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-relaxed
                        text-slate-500
                      "
                    >
                      Manage your account
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ProUserMenu />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}