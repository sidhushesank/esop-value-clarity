"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  Calculator,
  ReceiptIndianRupee,
  GitBranch,
  Clock3,
  Landmark,
  Trophy,
  Scale,
  FileText,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProUserMenu from "./ProUserMenu";

const navItems = [
  {
    href: "/pro",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/pro/offers",
    label: "Offer Intelligence",
    icon: Sparkles,
  },
  {
    href: "/pro/equity",
    label: "Equity",
    icon: WalletCards,
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
    href: "/pro/exercise",
    label: "Exercise",
    icon: Landmark,
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

  const desktopNavRef = useRef<HTMLElement | null>(null);
  const activeDesktopItemRef = useRef<HTMLAnchorElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;

    const updateScrollState = () => {
      const current = desktopNavRef.current;
      if (!current) return;

      const maxScrollLeft = current.scrollWidth - current.clientWidth;
      setCanScrollLeft(current.scrollLeft > 4);
      setCanScrollRight(current.scrollLeft < maxScrollLeft - 4);
    };

    updateScrollState();
    nav.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(nav);

    return () => {
      nav.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const activeItem = activeDesktopItemRef.current;
    if (!activeItem) return;

    window.requestAnimationFrame(() => {
      activeItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  }, [pathname]);

  function scrollDesktopNav(direction: "left" | "right") {
    const nav = desktopNavRef.current;
    if (!nav) return;

    nav.scrollBy({
      left:
        direction === "left"
          ? -Math.max(nav.clientWidth * 0.55, 260)
          : Math.max(nav.clientWidth * 0.55, 260),
      behavior: "smooth",
    });
  }

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
              gap-3
              px-4
              md:px-5
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

                md:text-xl

                xl:shrink-0
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
                  h-11
                  items-center
                  gap-1
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-1
                  shadow-sm
                "
              >
                <Link
                  href="/dashboard"
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-xs
                    font-bold
                    text-slate-500
                    transition

                    hover:bg-slate-100
                    hover:text-slate-900
                  "
                >
                  FREE
                </Link>

                <Link
                  href="/pro"
                  className="
                    rounded-xl
                    bg-slate-950
                    px-3
                    py-2
                    text-xs
                    font-black
                    text-white
                    shadow-sm
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
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    transition

                    hover:bg-slate-100
                    hover:text-slate-900
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

            <div className="relative hidden min-w-0 flex-1 items-center xl:flex">
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white via-white/90 to-transparent transition-opacity duration-200 ${
                  canScrollLeft ? "opacity-100" : "opacity-0"
                }`}
              />

              <button
                type="button"
                aria-label="Scroll navigation left"
                onClick={() => scrollDesktopNav("left")}
                className={`absolute left-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:text-slate-950 active:scale-90 ${
                  canScrollLeft
                    ? "visible scale-100 opacity-100"
                    : "invisible scale-90 opacity-0"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              <nav
                ref={desktopNavRef}
                aria-label="PRO workspace navigation"
                className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onWheel={(event) => {
                  const nav = desktopNavRef.current;

                  if (!nav || nav.scrollWidth <= nav.clientWidth) {
                    return;
                  }

                  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                    nav.scrollLeft += event.deltaY;
                  }
                }}
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      ref={active ? activeDesktopItemRef : undefined}
                      className={`group relative flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                        active
                          ? "bg-blue-50 text-blue-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.04)]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.9}
                        className={`shrink-0 transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 ${
                          item.href === "/pro/offers"
                            ? "group-hover:rotate-12"
                            : ""
                        } ${
                          active
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-700"
                        }`}
                      />
                      <span>{item.label}</span>

                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-blue-600 transition-all duration-300 ease-out ${
                          active
                            ? "w-5 opacity-100"
                            : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-40"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/90 to-transparent transition-opacity duration-200 ${
                  canScrollRight ? "opacity-100" : "opacity-0"
                }`}
              />

              <button
                type="button"
                aria-label="Scroll navigation right"
                onClick={() => scrollDesktopNav("right")}
                className={`absolute right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:translate-x-0.5 hover:border-slate-300 hover:text-slate-950 active:scale-90 ${
                  canScrollRight
                    ? "visible scale-100 opacity-100"
                    : "invisible scale-90 opacity-0"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>


            {/* ================================================= */}
            {/* DESKTOP USER MENU                                */}
            {/* ================================================= */}

            <div className="ml-auto hidden shrink-0 xl:block">
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
                        group
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
                        duration-300
                        ease-out

                        hover:translate-x-1
                        active:translate-x-0
                        active:scale-[0.98]

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
                          transition-all
                          duration-300
                          group-hover:scale-105

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