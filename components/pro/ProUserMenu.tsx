"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Crown,
} from "lucide-react";

interface UserData {
  name: string;
  email: string;
}

export default function ProUserMenu() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------------- */
  /* LOAD USER                                           */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (data.success && data.user) {
          setUser({
            name: data.user.name || "User",
            email: data.user.email || "",
          });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }

    loadUser();
  }, []);

  /* -------------------------------------------------- */
  /* CLOSE WHEN CLICKING OUTSIDE                         */
  /* -------------------------------------------------- */

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* -------------------------------------------------- */
  /* CLOSE ON ESCAPE                                     */
  /* -------------------------------------------------- */

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* -------------------------------------------------- */
  /* LOGOUT                                              */
  /* -------------------------------------------------- */

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  /* -------------------------------------------------- */
  /* LOADING STATE                                       */
  /* -------------------------------------------------- */

  if (!user) {
    return (
      <div
        className="
          h-10
          w-10
          rounded-xl
          border
          border-white/50
          bg-white/55
          shadow-sm
          backdrop-blur-xl

          sm:h-11
          sm:w-11

          xl:h-12
          xl:w-[280px]
          xl:rounded-2xl
        "
      />
    );
  }

  /* -------------------------------------------------- */
  /* INITIALS                                            */
  /* -------------------------------------------------- */

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={menuRef}
      className="relative z-[100]"
    >
      {/* ================================================== */}
      {/* USER TRIGGER                                       */}
      {/* ================================================== */}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user menu"
        className={`
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          transition-all
          duration-200

          sm:h-11
          sm:w-11

          xl:h-12
          xl:w-[280px]
          xl:justify-start
          xl:gap-3
          xl:rounded-2xl
          xl:px-2.5

          ${
            open
              ? `
                  border-slate-300
                  bg-white/90
                  shadow-lg
                  shadow-slate-900/10
                  backdrop-blur-xl
                `
              : `
                  border-white/60
                  bg-white/55
                  shadow-sm
                  backdrop-blur-xl
                  hover:border-slate-300/80
                  hover:bg-white/70
                `
          }
        `}
      >
        {/* Avatar */}

        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-slate-950
            text-[11px]
            font-bold
            text-white
            shadow-sm

            sm:h-9
            sm:w-9
            sm:rounded-xl
            sm:text-xs
          "
        >
          {initials}
        </div>

        {/* Desktop user information */}

        <div className="hidden min-w-0 flex-1 text-left xl:block">
          <div className="flex items-center gap-2">
            <p
              className="
                truncate
                text-sm
                font-bold
                leading-tight
                text-slate-900
              "
            >
              {user.name}
            </p>
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span
              className="
                flex
                shrink-0
                items-center
                gap-1
                text-[10px]
                font-extrabold
                text-amber-600
              "
            >
              <Crown size={10} />
              PRO
            </span>

            <span className="text-[10px] text-slate-400">
              •
            </span>

            <span
              className="
                truncate
                text-[11px]
                text-slate-500
              "
            >
              {user.email}
            </span>
          </div>
        </div>

        {/* Desktop chevron */}

        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`
            hidden
            shrink-0
            text-slate-500
            transition-transform
            duration-200

            xl:block

            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* ================================================== */}
      {/* DROPDOWN                                           */}
      {/* ================================================== */}

      {open && (
        <div
          role="menu"
          className="
            fixed
            left-4
            right-4
            top-[72px]
            z-[200]

            max-h-[calc(100dvh-88px)]
            overflow-y-auto
            overflow-x-hidden

            rounded-2xl
            border
            border-slate-200
            bg-white

            shadow-[0_20px_60px_rgba(15,23,42,0.16)]

            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-[calc(100%+10px)]
            sm:w-[300px]
            sm:max-h-none
          "
        >
          {/* ------------------------------------------------ */}
          {/* USER HEADER                                      */}
          {/* ------------------------------------------------ */}

          <div
            className="
              border-b
              border-slate-200
              bg-white
              p-4
            "
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-950
                  text-sm
                  font-bold
                  text-white
                "
              >
                {initials}
              </div>

              {/* User information */}

              <div className="min-w-0 flex-1">
                <p
                  className="
                    truncate
                    text-sm
                    font-bold
                    text-slate-950
                  "
                >
                  {user.name}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-xs
                    text-slate-500
                  "
                >
                  {user.email}
                </p>

                <div
                  className="
                    mt-2
                    inline-flex
                    items-center
                    gap-1
                    rounded-full
                    bg-amber-50
                    px-2
                    py-1
                    text-[10px]
                    font-bold
                    text-amber-700
                    ring-1
                    ring-amber-100
                  "
                >
                  <Crown size={10} />
                  PRO MEMBER
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* NAVIGATION                                       */}
          {/* ------------------------------------------------ */}

          <div className="bg-white p-2">
            <MenuItem
              icon={<LayoutDashboard size={17} />}
              label="PRO Overview"
              onClick={() => {
                setOpen(false);
                router.push("/pro");
              }}
            />

            <MenuItem
              icon={<User size={17} />}
              label="Profile"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
            />

            <MenuItem
              icon={<Settings size={17} />}
              label="Account Settings"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
            />
          </div>

          {/* ------------------------------------------------ */}
          {/* LOGOUT                                           */}
          {/* ------------------------------------------------ */}

          <div
            className="
              border-t
              border-slate-200
              bg-white
              p-2
            "
          >
            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                min-h-12
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-left
                text-sm
                font-semibold
                text-red-600
                transition
                hover:bg-red-50
              "
            >
              <LogOut size={17} />

              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================== */
/* MENU ITEM                                               */
/* ====================================================== */

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className="
        flex
        min-h-12
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        text-left
        text-sm
        font-semibold
        text-slate-800
        transition

        hover:bg-slate-100
        hover:text-slate-950
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-slate-50
          text-slate-700
        "
      >
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}