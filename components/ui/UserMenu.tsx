"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  Crown,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamWorkspaceData {
  id: string;
  name: string;
  startedAt: string;
  expiresAt: string;
  status: string;
}

interface UserAccountData {
  isPro?: boolean;
  isFounder?: boolean;
  isTeamSponsored?: boolean;
  isTeamAdmin?: boolean;
  isTeamMember?: boolean;
  teamRole?: "TEAM_ADMIN" | "TEAM_MEMBER" | null;
  teamWorkspace?: TeamWorkspaceData | null;
}

interface UserData {
  name: string;
  email: string;
  account?: UserAccountData;
}

type IdentityBadge =
  | "FOUNDER"
  | "TEAM_ADMIN"
  | "TEAM_SPONSORED"
  | "PRO"
  | "FREE";

export default function UserMenu() {
  const router = useRouter();

  const [user, setUser] =
    useState<UserData | null>(null);

  const [open, setOpen] =
    useState(false);

  // Paid workspaces this user can open (Advisor Console, Startup Equity Desk).
  // Loaded the first time the menu opens.
  const [workspaces, setWorkspaces] =
    useState<{ company: boolean; advisor: boolean } | null>(null);

  const menuRef =
    useRef<HTMLDivElement>(null);

  async function loadUser() {
    try {
      const response =
        await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

      const data =
        await response.json();

      if (
        data.success &&
        data.user
      ) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    void loadUser();
  }, []);

  useEffect(() => {
    if (!open || workspaces) return;

    fetch("/api/me/workspaces", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) =>
        setWorkspaces({
          company: data?.company === true,
          advisor: data?.advisor === true,
        })
      )
      .catch(() =>
        setWorkspaces({ company: false, advisor: false })
      );
  }, [open, workspaces]);

  useEffect(() => {
    function handleProfileUpdated() {
      void loadUser();
    }

    window.addEventListener(
      "profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      window.location.href =
        "/login";
    }
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badge =
    getIdentityBadge(
      user.account
    );

  const canAccessTeamWorkspace =
    user.account?.isFounder ===
      true ||
    user.account?.isTeamAdmin ===
      true;

  // Founder, or any firm with an active Advisor plan.
  const canAccessAdvisorConsole =
    user.account?.isFounder === true ||
    workspaces?.advisor === true;

  // Founder, or any company with an active Startup plan.
  const canAccessStartupDesk =
    user.account?.isFounder === true ||
    workspaces?.company === true;

  const teamWorkspaceName =
    user.account?.teamWorkspace
      ?.name ||
    "Team Intelligence";

  return (
    <div
      ref={menuRef}
      className="relative z-[100]"
    >
      <motion.button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        aria-expanded={open}
        aria-haspopup="menu"
        whileTap={{
          scale: 0.98,
        }}
        className={`
          flex
          items-center
          gap-3
          rounded-full
          border
          bg-white
          px-3
          py-2
          shadow-sm
          transition-all
          duration-200
          hover:shadow-md

          ${
            open
              ? "border-slate-300 shadow-lg"
              : "border-slate-200"
          }
        `}
      >
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-slate-900
            text-sm
            font-semibold
            text-white
            shadow-sm
          "
        >
          {initials}
        </div>

        <div className="hidden min-w-0 text-left md:block">
          <p className="truncate text-sm font-semibold">
            {user.name}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <IdentityBadgePill
              badge={badge}
              compact
            />

            <span className="max-w-[150px] truncate text-[10px] text-slate-500">
              {user.email}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.985,
            }}
            transition={{
              duration: 0.18,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="
              absolute
              right-0
              mt-3
              flex
              max-h-[calc(100dvh-110px)]
              w-[330px]
              max-w-[calc(100vw-24px)]
              flex-col
              overflow-hidden
              rounded-[24px]
              border
              border-slate-200
              bg-white
              shadow-[0_25px_70px_rgba(15,23,42,0.16)]
            "
          >
            {/* -------------------------------------------------
                IDENTITY HEADER
            ------------------------------------------------- */}

            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-slate-50 p-4">
              <div
                className={`
                  pointer-events-none
                  absolute
                  -right-14
                  -top-16
                  h-40
                  w-40
                  rounded-full
                  blur-3xl

                  ${
                    badge === "FOUNDER"
                      ? "bg-amber-300/20"
                      : badge === "TEAM_ADMIN"
                        ? "bg-blue-300/20"
                        : badge ===
                            "TEAM_SPONSORED"
                          ? "bg-emerald-300/20"
                          : "bg-slate-300/20"
                  }
                `}
              />

              <div className="relative flex items-center gap-3">
                <div
                  className={`
                    flex
                    h-13
                    w-13
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    text-sm
                    font-black
                    text-white
                    shadow-sm

                    ${
                      badge === "FOUNDER"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : badge ===
                            "TEAM_ADMIN"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                          : badge ===
                              "TEAM_SPONSORED"
                            ? "bg-gradient-to-br from-emerald-600 to-teal-700"
                            : "bg-slate-950"
                    }
                  `}
                >
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">
                    {user.name}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user.email}
                  </p>

                  <div className="mt-2">
                    <IdentityBadgePill
                      badge={badge}
                    />
                  </div>
                </div>
              </div>

              {user.account
                ?.teamWorkspace && (
                <div className="relative mt-4 rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <Building2
                      size={14}
                      className="shrink-0 text-blue-600"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        Team Workspace
                      </p>

                      <p className="mt-1 truncate text-xs font-black text-slate-800">
                        {teamWorkspaceName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* -------------------------------------------------
                NAVIGATION (scrolls on short screens; header and
                logout always stay visible)
            ------------------------------------------------- */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <MenuItem
                icon={
                  <LayoutDashboard
                    size={18}
                  />
                }
                text="Dashboard"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/dashboard"
                  );
                }}
              />

              <MenuItem
                icon={
                  <Calculator
                    size={18}
                  />
                }
                text="Simulator"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/simulator"
                  );
                }}
              />

              <MenuItem
                icon={
                  <History
                    size={18}
                  />
                }
                text="History"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/history"
                  );
                }}
              />

              {canAccessTeamWorkspace && (
                <MenuItem
                  icon={
                    <Users
                      size={18}
                    />
                  }
                  text={
                    teamWorkspaceName
                  }
                  subtext="Team Intelligence"
                  highlighted
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      "/team"
                    );
                  }}
                />
              )}

              {canAccessAdvisorConsole && (
                <MenuItem
                  icon={
                    <Briefcase
                      size={18}
                    />
                  }
                  text="Advisor Console"
                  subtext="CA & CS firms"
                  highlighted
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      "/advisor"
                    );
                  }}
                />
              )}

              {canAccessStartupDesk && (
                <MenuItem
                  icon={
                    <Building2
                      size={18}
                    />
                  }
                  text="Startup Equity Desk"
                  subtext="Cap table & ESOP grants"
                  highlighted
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      "/company"
                    );
                  }}
                />
              )}

              <MenuItem
                icon={
                  <User size={18} />
                }
                text="Profile"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/profile"
                  );
                }}
              />
            </div>

            {/* -------------------------------------------------
                ACCESS INFORMATION
            ------------------------------------------------- */}

            <div className="shrink-0 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
              <div className="flex items-center gap-2">
                {badge === "FOUNDER" ? (
                  <Crown
                    size={14}
                    className="text-amber-600"
                  />
                ) : badge ===
                  "TEAM_SPONSORED" ? (
                  <ShieldCheck
                    size={14}
                    className="text-emerald-600"
                  />
                ) : (
                  <ShieldCheck
                    size={14}
                    className="text-blue-600"
                  />
                )}

                <p className="text-[10px] font-semibold leading-4 text-slate-500">
                  {getAccessDescription(
                    badge
                  )}
                </p>
              </div>
            </div>

            {/* -------------------------------------------------
                LOGOUT
            ------------------------------------------------- */}

            <div className="shrink-0 border-t border-slate-200 p-2">
              <MenuItem
                icon={
                  <LogOut
                    size={18}
                  />
                }
                text="Logout"
                danger
                onClick={
                  handleLogout
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  text,
  subtext,
  onClick,
  danger = false,
  highlighted = false,
}: {
  icon: React.ReactNode;
  text: string;
  subtext?: string;
  onClick: () => void;
  danger?: boolean;
  highlighted?: boolean;
}) {
  return (
    <motion.button
      type="button"
      role="menuitem"
      onClick={onClick}
      whileHover={{
        x: 2,
      }}
      whileTap={{
        scale: 0.985,
      }}
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        text-left
        transition-colors

        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : highlighted
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "text-slate-800 hover:bg-slate-100"
        }
      `}
    >
      <span
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl

          ${
            danger
              ? "bg-red-50 text-red-600"
              : highlighted
                ? "bg-white text-blue-700 shadow-sm"
                : "bg-slate-50 text-slate-700"
          }
        `}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {text}
        </span>

        {subtext && (
          <span
            className={`
              mt-0.5 block text-[9px] font-black uppercase tracking-[0.1em]
              ${
                highlighted
                  ? "text-blue-500"
                  : "text-slate-400"
              }
            `}
          >
            {subtext}
          </span>
        )}
      </span>
    </motion.button>
  );
}

function IdentityBadgePill({
  badge,
  compact = false,
}: {
  badge: IdentityBadge;
  compact?: boolean;
}) {
  const config =
    getBadgeConfig(badge);

  const Icon =
    config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        font-black
        uppercase
        tracking-[0.1em]
        ${compact ? "px-2 py-1 text-[8px]" : "px-2.5 py-1.5 text-[9px]"}
        ${config.className}
      `}
    >
      <Icon
        size={compact ? 9 : 11}
      />

      {config.label}
    </span>
  );
}

function getIdentityBadge(
  account?: UserAccountData
): IdentityBadge {
  if (account?.isFounder) {
    return "FOUNDER";
  }

  if (account?.isTeamAdmin) {
    return "TEAM_ADMIN";
  }

  if (
    account?.isTeamMember ||
    account?.isTeamSponsored
  ) {
    return "TEAM_SPONSORED";
  }

  if (account?.isPro) {
    return "PRO";
  }

  return "FREE";
}

function getBadgeConfig(
  badge: IdentityBadge
) {
  switch (badge) {
    case "FOUNDER":
      return {
        label:
          "Founder",
        icon: Crown,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "TEAM_ADMIN":
      return {
        label:
          "Team Admin",
        icon: Building2,
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "TEAM_SPONSORED":
      return {
        label:
          "Team-Sponsored PRO",
        icon: ShieldCheck,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "PRO":
      return {
        label:
          "PRO Member",
        icon: Crown,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    default:
      return {
        label: "Free",
        icon: User,
        className:
          "border-slate-200 bg-slate-100 text-slate-600",
      };
  }
}

function getAccessDescription(
  badge: IdentityBadge
) {
  switch (badge) {
    case "FOUNDER":
      return "Founder access with unrestricted product and Team Intelligence access.";

    case "TEAM_ADMIN":
      return "You administer the Team Intelligence workspace and sponsor its members.";

    case "TEAM_SPONSORED":
      return "PRO access is sponsored through your Team Intelligence workspace.";

    case "PRO":
      return "Your personal PRO subscription is active.";

    default:
      return "You are currently using the free EVC workspace.";
  }
}