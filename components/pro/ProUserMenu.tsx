"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronDown,
  Crown,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  teamRole?:
    | "TEAM_ADMIN"
    | "TEAM_MEMBER"
    | null;

  teamWorkspace?:
    | TeamWorkspaceData
    | null;
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

export default function ProUserMenu() {
  const router = useRouter();

  const [user, setUser] =
    useState<UserData | null>(null);

  const [open, setOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          data.success &&
          data.user
        ) {
          setUser(
            data.user
          );
        }
      } catch (error) {
        console.error(
          "Failed to load user:",
          error
        );
      }
    }

    void loadUser();
  }, []);

  useEffect(() => {
    function handleOutsideClick(
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
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
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
          credentials:
            "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      window.location.href =
        "/login";
    }
  }

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

  const initials =
    user.name
      .split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const badge =
    getIdentityBadge(
      user.account
    );

  const canAccessTeam =
    user.account
      ?.isFounder === true ||
    user.account
      ?.isTeamAdmin === true;

  const teamWorkspaceName =
    user.account
      ?.teamWorkspace
      ?.name ||
    "Team Intelligence";

  const badgeConfig =
    getBadgeConfig(
      badge
    );

  const BadgeIcon =
    badgeConfig.icon;

  return (
    <div
      ref={menuRef}
      className="relative z-[100]"
    >
      {/* ====================================================
          USER TRIGGER
      ==================================================== */}

      <motion.button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open PRO user menu"
        whileTap={{
          scale: 0.985,
        }}
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
              ? "border-slate-300 bg-white/95 shadow-lg"
              : "border-white/60 bg-white/55 shadow-sm hover:border-slate-300/80 hover:bg-white/75"
          }
        `}
      >
        {/* Avatar */}

        <div
          className={`
            relative
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-[11px]
            font-black
            text-white
            shadow-sm

            sm:h-9
            sm:w-9
            sm:rounded-xl
          ${
            badge ===
            "FOUNDER"
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

          {(badge ===
            "FOUNDER" ||
            badge ===
              "TEAM_ADMIN" ||
            badge ===
              "TEAM_SPONSORED") && (
            <span
              className="
                absolute
                -bottom-1
                -right-1
                flex
                h-4
                w-4
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-white
                shadow-sm
              "
            >
              <BadgeIcon
                size={8}
                className={
                  badge ===
                  "FOUNDER"
                    ? "text-amber-600"
                    : badge ===
                        "TEAM_ADMIN"
                      ? "text-blue-600"
                      : "text-emerald-600"
                }
              />
            </span>
          )}
        </div>

        {/* Desktop identity */}

        <div className="hidden min-w-0 flex-1 text-left xl:block">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">
            {user.name}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-2">
            <IdentityBadgePill
              badge={badge}
              compact
            />

            <span className="text-[10px] text-slate-400">
              •
            </span>

            <span className="truncate text-[10px] text-slate-500">
              {user.email}
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`
            hidden
            shrink-0
            text-slate-500
            transition-transform
            duration-200
            xl:block
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </motion.button>

      {/* ====================================================
          DROPDOWN
      ==================================================== */}

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.985,
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
              ease: [
                0.2,
                0.8,
                0.2,
                1,
              ],
            }}
            className="
              fixed
              left-4
              right-4
              top-[72px]
              z-[200]
              max-h-[calc(100dvh-88px)]
              overflow-y-auto
              rounded-[24px]
              border
              border-slate-200
              bg-white
              shadow-[0_25px_70px_rgba(15,23,42,0.16)]

              sm:absolute
              sm:left-auto
              sm:right-0
              sm:top-[calc(100%+10px)]
              sm:w-[330px]
              sm:max-h-none
            "
          >
            {/* ------------------------------------------------
                IDENTITY HEADER
            ------------------------------------------------ */}

            <div className="relative overflow-hidden border-b border-slate-200 bg-slate-50 p-5">
              <div
                className={`
                  pointer-events-none
                  absolute
                  -right-16
                  -top-20
                  h-44
                  w-44
                  rounded-full
                  blur-3xl

                  ${
                    badge ===
                    "FOUNDER"
                      ? "bg-amber-300/20"
                      : badge ===
                          "TEAM_ADMIN"
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
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    text-sm
                    font-black
                    text-white
                    shadow-md

                    ${
                      badge ===
                      "FOUNDER"
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
                      badge={
                        badge
                      }
                    />
                  </div>
                </div>
              </div>

              {user.account
                ?.teamWorkspace && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="relative mt-4 rounded-2xl border border-slate-200 bg-white/80 px-3.5 py-3"
                >
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
                        {
                          teamWorkspaceName
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ------------------------------------------------
                NAVIGATION
            ------------------------------------------------ */}

            <div className="bg-white p-2">
              <MenuItem
                icon={
                  <LayoutDashboard
                    size={17}
                  />
                }
                label="PRO Overview"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/pro"
                  );
                }}
              />

              {canAccessTeam && (
                <MenuItem
                  icon={
                    <Users
                      size={17}
                    />
                  }
                  label="Team Intelligence"
                  sublabel={
                    teamWorkspaceName
                  }
                  emphasized
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      "/team"
                    );
                  }}
                />
              )}

              <MenuItem
                icon={
                  <BarChart3
                    size={17}
                  />
                }
                label="Pricing & Plans"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/pricing"
                  );
                }}
              />

              <MenuItem
                icon={
                  <User size={17} />
                }
                label="Profile"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/profile"
                  );
                }}
              />

              <MenuItem
                icon={
                  <Settings
                    size={17}
                  />
                }
                label="Account Settings"
                onClick={() => {
                  setOpen(false);
                  router.push(
                    "/profile"
                  );
                }}
              />
            </div>

            {/* ------------------------------------------------
                ACCESS INFORMATION
            ------------------------------------------------ */}

            <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3">
              <div className="flex items-start gap-2">
                <BadgeIcon
                  size={14}
                  className={`mt-0.5 shrink-0 ${
                    badge ===
                    "FOUNDER"
                      ? "text-amber-600"
                      : badge ===
                          "TEAM_ADMIN"
                        ? "text-blue-600"
                        : badge ===
                            "TEAM_SPONSORED"
                          ? "text-emerald-600"
                          : "text-slate-500"
                  }`}
                />

                <p className="text-[10px] font-semibold leading-5 text-slate-500">
                  {getAccessDescription(
                    badge
                  )}
                </p>
              </div>
            </div>

            {/* ------------------------------------------------
                LOGOUT
            ------------------------------------------------ */}

            <div className="border-t border-slate-200 p-2">
              <MenuItem
                icon={
                  <LogOut
                    size={17}
                  />
                }
                label="Logout"
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

/* ==========================================================
   MENU ITEM
========================================================== */

function MenuItem({
  icon,
  label,
  sublabel,
  onClick,
  danger = false,
  emphasized = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  emphasized?: boolean;
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
        min-h-12
        w-full
        items-center
        gap-3
        rounded-xl
        px-3
        py-3
        text-left
        transition-colors

        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : emphasized
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "text-slate-800 hover:bg-slate-100"
        }
      `}
    >
      <span
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg

          ${
            danger
              ? "bg-red-50 text-red-600"
              : emphasized
                ? "bg-white text-blue-700 shadow-sm"
                : "bg-slate-50 text-slate-700"
          }
        `}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {label}
        </span>

        {sublabel && (
          <span
            className={`
              mt-0.5 block truncate text-[9px] font-black uppercase tracking-[0.1em]
              ${
                emphasized
                  ? "text-blue-500"
                  : "text-slate-400"
              }
            `}
          >
            {sublabel}
          </span>
        )}
      </span>
    </motion.button>
  );
}

/* ==========================================================
   IDENTITY BADGE
========================================================== */

function IdentityBadgePill({
  badge,
  compact = false,
}: {
  badge: IdentityBadge;
  compact?: boolean;
}) {
  const config =
    getBadgeConfig(
      badge
    );

  const Icon =
    config.icon;

  return (
    <motion.span
      initial={{
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
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
        size={
          compact
            ? 9
            : 11
        }
      />

      {config.label}
    </motion.span>
  );
}

/* ==========================================================
   BADGE RESOLUTION
========================================================== */

function getIdentityBadge(
  account?: UserAccountData
): IdentityBadge {
  if (
    account?.isFounder
  ) {
    return "FOUNDER";
  }

  if (
    account?.isTeamAdmin
  ) {
    return "TEAM_ADMIN";
  }

  if (
    account?.isTeamMember ||
    account?.isTeamSponsored
  ) {
    return "TEAM_SPONSORED";
  }

  if (
    account?.isPro
  ) {
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
        label:
          "Free",
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