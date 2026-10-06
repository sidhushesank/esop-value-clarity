"use client";

import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  GitCompareArrows,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import type { TeamMember } from "@/app/team/page";

export default function TeamMemberCard({
  member,
  index,
  onRemove,
}: {
  member: TeamMember;
  index: number;
  onRemove: () => void;
}) {
  const router = useRouter();

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: Math.min(
          index * 0.06,
          0.36
        ),
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
      whileHover={{
        y: -5,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        transition-shadow
        duration-300
        hover:shadow-[0_24px_75px_rgba(15,23,42,0.12)]
      "
    >
      {/* =====================================================
          TOP ACCENT
      ===================================================== */}

      <motion.div
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          bg-gradient-to-r
          from-blue-600
          via-violet-500
          to-emerald-500
        "
        initial={{
          opacity: 0.75,
        }}
        whileHover={{
          opacity: 1,
        }}
      />

      <div className="p-5 sm:p-6">
        {/* ===================================================
            MEMBER HEADER
        =================================================== */}

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <motion.div
              whileHover={{
                scale: 1.05,
                rotate: -2,
              }}
              transition={{
                duration: 0.2,
              }}
              className="
                grid
                h-13
                w-13
                shrink-0
                place-items-center
                rounded-2xl
                bg-gradient-to-br
                from-slate-950
                to-slate-800
                text-sm
                font-black
                text-white
                shadow-[0_8px_25px_rgba(15,23,42,0.16)]
              "
            >
              {getInitials(
                member.name
              )}
            </motion.div>

            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
                  {member.name}
                </p>

                <span
                  className="
                    inline-flex
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-emerald-200
                    bg-emerald-50
                    px-2.5
                    py-1
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-emerald-700
                  "
                >
                  <ShieldCheck
                    size={10}
                  />
                  PRO
                </span>
              </div>

              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {member.email}
              </p>
            </div>
          </div>

          {/* Remove action */}

          <motion.button
            type="button"
            onClick={onRemove}
            title="Remove member"
            aria-label={`Remove ${member.name} from this Team Workspace`}
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.94,
            }}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-400
              shadow-sm
              transition-colors
              hover:border-red-200
              hover:bg-red-50
              hover:text-red-600
            "
          >
            <Trash2
              size={15}
            />
          </motion.button>
        </div>

        {/* ===================================================
            MEMBER INFORMATION
        =================================================== */}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <InfoLine
            icon={
              <UserRound
                size={13}
              />
            }
            label="Account"
            value="Existing EVC user"
          />

          <InfoLine
            icon={
              <CalendarDays
                size={13}
              />
            }
            label="Added"
            value={formatDate(
              member.addedAt
            )}
          />

          <InfoLine
            icon={
              <ShieldCheck
                size={13}
              />
            }
            label="Entitlement"
            value="Team-sponsored PRO"
            accent="green"
          />

          <InfoLine
            icon={
              <FileText
                size={13}
              />
            }
            label="Workspace state"
            value="Active"
            accent="blue"
          />
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="mt-6">
          <p className="mb-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
            Member Intelligence
          </p>

          <div className="grid gap-2 sm:grid-cols-3">
            <ActionButton
              variant="preview"
              label="Preview"
              icon={
                <ArrowUpRight
                  size={15}
                />
              }
              description="Open member view"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    member.userId
                  )}/preview`
                )
              }
            />

            <ActionButton
              variant="compare"
              label="Compare"
              icon={
                <GitCompareArrows
                  size={15}
                />
              }
              description="Compare with team"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    member.userId
                  )}/compare`
                )
              }
            />

            <ActionButton
              variant="analysis"
              label="Analysis"
              icon={
                <BarChartIcon
                  size={15}
                />
              }
              description="Explore analytics"
              onClick={() =>
                router.push(
                  `/team/members/${encodeURIComponent(
                    member.userId
                  )}/analysis`
                )
              }
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM STATUS STRIP
      ===================================================== */}

      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            <span className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
              Live account connection
            </span>
          </div>

          <span className="text-[9px] font-semibold text-slate-400">
            Member intelligence ready
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ==========================================================
   ACTION BUTTON
========================================================== */

function ActionButton({
  label,
  icon,
  description,
  variant,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  description: string;
  variant:
    | "preview"
    | "compare"
    | "analysis";
  onClick: () => void;
}) {
  const styles =
    getActionStyles(
      variant
    );

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`
        group/action
        relative
        overflow-hidden
        rounded-2xl
        border
        px-3.5
        py-3
        text-left
        transition-all
        duration-200

        ${styles.button}
      `}
    >
      <div className="relative z-10 flex items-start gap-3">
        <motion.span
          whileHover={{
            scale: 1.08,
          }}
          className={`
            mt-0.5
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-xl

            ${styles.icon}
          `}
        >
          {icon}
        </motion.span>

        <span className="min-w-0">
          <span
            className={`
              block
              text-xs
              font-black

              ${styles.label}
            `}
          >
            {label}
          </span>

          <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-500">
            {description}
          </span>
        </span>
      </div>

      <motion.span
        className={`
          pointer-events-none
          absolute
          -right-8
          -top-8
          h-20
          w-20
          rounded-full
          blur-2xl

          ${styles.glow}
        `}
        initial={{
          opacity: 0,
        }}
        whileHover={{
          opacity: 1,
        }}
      />
    </motion.button>
  );
}

/* ==========================================================
   ACTION STYLES
========================================================== */

function getActionStyles(
  variant:
    | "preview"
    | "compare"
    | "analysis"
) {
  switch (variant) {
    case "preview":
      return {
        button:
          "border-blue-100 bg-blue-50/60 hover:border-blue-200 hover:bg-blue-50 hover:shadow-[0_10px_30px_rgba(37,99,235,0.10)]",
        icon:
          "bg-white text-blue-600 shadow-sm",
        label:
          "text-blue-800",
        glow:
          "bg-blue-400/20",
      };

    case "compare":
      return {
        button:
          "border-violet-100 bg-violet-50/60 hover:border-violet-200 hover:bg-violet-50 hover:shadow-[0_10px_30px_rgba(124,58,237,0.10)]",
        icon:
          "bg-white text-violet-600 shadow-sm",
        label:
          "text-violet-800",
        glow:
          "bg-violet-400/20",
      };

    case "analysis":
      return {
        button:
          "border-emerald-100 bg-emerald-50/60 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-[0_10px_30px_rgba(5,150,105,0.10)]",
        icon:
          "bg-white text-emerald-600 shadow-sm",
        label:
          "text-emerald-800",
        glow:
          "bg-emerald-400/20",
      };
  }
}

/* ==========================================================
   INFO LINE
========================================================== */

function InfoLine({
  icon,
  label,
  value,
  accent = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?:
    | "slate"
    | "green"
    | "blue";
}) {
  const accentStyles =
    accent === "green"
      ? "text-emerald-600"
      : accent === "blue"
        ? "text-blue-600"
        : "text-slate-500";

  return (
    <motion.div
      whileHover={{
        y: -1,
      }}
      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 transition-colors hover:bg-white hover:shadow-sm"
    >
      <div
        className={`
          flex
          items-center
          gap-1.5
          text-[9px]
          font-black
          uppercase
          tracking-[0.11em]

          ${accentStyles}
        `}
      >
        {icon}
        {label}
      </div>

      <p className="mt-1 text-xs font-bold text-slate-700">
        {value}
      </p>
    </motion.div>
  );
}

/* ==========================================================
   BAR CHART ICON
========================================================== */

function BarChartIcon({
  size = 15,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16V4" />
    </svg>
  );
}

/* ==========================================================
   INITIALS
========================================================== */

function getInitials(
  name: string
) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    initials || "EV"
  );
}

/* ==========================================================
   DATE
========================================================== */

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}