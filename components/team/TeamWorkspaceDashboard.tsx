"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  ChevronDown,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TeamMemberCard from "@/components/team/TeamMemberCard";
import TeamAnalyticalView from "@/components/team/TeamAnalyticalView";

import type {
  TeamMember,
  TeamWorkspace,
} from "@/app/team/page";

export default function TeamWorkspaceDashboard({
  workspace,
  workspaceName,
  creating,
  error,
  onWorkspaceNameChange,
  onCreateWorkspace,
  onReload,
  onBack,
}: {
  workspace: TeamWorkspace | null;
  workspaceName: string;
  creating: boolean;
  error: string;
  onWorkspaceNameChange: (value: string) => void;
  onCreateWorkspace: () => void;
  onReload: () => void;
  onBack: () => void;
}) {
  const [view, setView] =
    useState<"base" | "analytical">("base");

  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const [memberEmail, setMemberEmail] =
    useState("");

  const [memberError, setMemberError] =
    useState("");

  const [addingMember, setAddingMember] =
    useState(false);

  const [exportOpen, setExportOpen] =
    useState(false);

  const [exporting, setExporting] =
    useState<"csv" | "xlsx" | null>(null);

  const [exportError, setExportError] =
    useState("");

  const [removeMemberTarget, setRemoveMemberTarget] =
    useState<TeamMember | null>(null);

  const [removingMember, setRemovingMember] =
    useState(false);

  const isFounder =
    workspace?.access?.isFounder === true;

  async function addMember() {
    const email = memberEmail.trim();

    if (!email) {
      setMemberError(
        "Enter the EVC email address of an existing user."
      );
      return;
    }

    setAddingMember(true);
    setMemberError("");

    try {
      const response = await fetch(
        "/api/team/members",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMemberError(
          data.message ??
            "We could not add this member."
        );
        return;
      }

      setMemberEmail("");
      setAddMemberOpen(false);

      await onReload();
    } catch {
      setMemberError(
        "We could not add this member. Please try again."
      );
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(
    userId: string
  ) {
    if (removingMember) {
      return;
    }

    setRemovingMember(true);
    setMemberError("");

    try {
      const response =
        await fetch(
          `/api/team/members/${encodeURIComponent(
            userId
          )}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setMemberError(
          data.message ??
            "We could not remove this member."
        );

        return;
      }

      setRemoveMemberTarget(
        null
      );

      await onReload();
    } catch {
      setMemberError(
        "We could not remove this member. Please try again."
      );
    } finally {
      setRemovingMember(false);
    }
  }

  async function exportTeamData(
    format: "csv" | "xlsx"
  ) {
    if (exporting) {
      return;
    }

    setExporting(format);
    setExportError("");
    setExportOpen(false);

    try {
      const response = await fetch(
        `/api/team/export?format=${format}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) ?? "";

      if (
        !response.ok ||
        contentType.includes("application/json")
      ) {
        let message =
          "We could not generate the Team export.";

        try {
          const data =
            await response.json();

          if (
            data?.message
          ) {
            message =
              data.message;
          }
        } catch {
          // Keep the safe fallback message.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const disposition =
        response.headers.get(
          "content-disposition"
        );

      let filename =
        format === "csv"
          ? "EVC-Team-Intelligence.csv"
          : "EVC-Team-Intelligence.xlsx";

      const filenameMatch =
        disposition?.match(
          /filename="([^"]+)"/i
        );

      if (
        filenameMatch?.[1]
      ) {
        filename =
          filenameMatch[1];
      }

      const objectUrl =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        objectUrl;

      anchor.download =
        filename;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        objectUrl
      );
    } catch (error) {
      console.error(
        "[TEAM_EXPORT_UI_ERROR]",
        error
      );

      setExportError(
        error instanceof Error
          ? error.message
          : "We could not generate the Team export. Please try again."
      );
    } finally {
      setExporting(null);
    }
  }

  if (!workspace) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-12">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Back to PRO Workspace
          </button>

          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="mt-8 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.10)]"
          >
            <div className="relative overflow-hidden bg-[#07111f] px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-28 left-[35%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
                  <Sparkles size={14} />
                  Team Intelligence
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                  Create your team workspace.
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  One professional workspace for the people you
                  sponsor into EVC PRO. Add only existing EVC
                  users and manage up to 20 members from one
                  command center.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <EntitlementPill
                    icon={<Users size={15} />}
                    label="Up to 20 members"
                  />

                  <EntitlementPill
                    icon={<ShieldCheck size={15} />}
                    label="Team-sponsored PRO"
                  />

                  <EntitlementPill
  icon={
    isFounder ? (
      <Sparkles size={15} />
    ) : (
      <CalendarClock size={15} />
    )
  }
  label={
    isFounder
      ? "Unlimited founder access"
      : "12-month workspace"
  }
/>
                </div>
              </div>
            </div>

            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.65fr] lg:p-12">
              <div>
                <label
                  htmlFor="workspace-name"
                  className="text-xs font-black uppercase tracking-[0.16em] text-slate-500"
                >
                  Workspace name
                </label>

                <input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) =>
                    onWorkspaceNameChange(
                      event.target.value
                    )
                  }
                  placeholder="e.g. EVC Advisory Team"
                  maxLength={80}
                  className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onCreateWorkspace();
                    }
                  }}
                />

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  disabled={creating}
                  onClick={onCreateWorkspace}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Creating workspace...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Team Workspace
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Team plan
                </p>

                <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                  ₹1,45,000
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  per year
                </p>

                <div className="mt-6 space-y-3">
                  <FeatureLine text="One workspace" />
                  <FeatureLine text="Up to 20 active members" />
                  <FeatureLine text="Existing EVC users only" />
                  <FeatureLine text="Team-sponsored PRO access" />
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[4%] top-[8%] h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="absolute right-[2%] top-[20%] h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1560px] px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              PRO
            </button>

            <span className="text-slate-300">
              /
            </span>

            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-slate-950">
                {workspace.name}
              </p>

              <p className="text-xs font-semibold text-slate-400">
                Team Intelligence Workspace
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setExportOpen(
                    (current) => !current
                  )
                }
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />

                {exporting
                  ? "Exporting..."
                  : "Export"}

                <ChevronDown
                  size={13}
                  className={`transition-transform ${
                    exportOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {exportOpen && (
                <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                  <button
                    type="button"
                    onClick={() =>
                      void exportTeamData(
                        "csv"
                      )
                    }
                    disabled={Boolean(exporting)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Download size={16} />
                    </span>

                    <span>
                      <span className="block text-xs font-black text-slate-950">
                        Export CSV
                      </span>

                      <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
                        Clean consolidated Team table
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void exportTeamData(
                        "xlsx"
                      )
                    }
                    disabled={Boolean(exporting)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                      <FileSpreadsheet
                        size={16}
                      />
                    </span>

                    <span>
                      <span className="block text-xs font-black text-slate-950">
                        Export Excel
                      </span>

                      <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
                        Full formatted Team workbook
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={
                workspace.limits.remainingSlots <= 0
              }
              onClick={() => {
                setMemberError("");
                setAddMemberOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} />
              Add member
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {exportError && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {exportError}
          </div>
        )}

        <section className="mt-7 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-[#07111f] px-6 py-8 text-white md:px-8 lg:px-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="pointer-events-none absolute bottom-[-100px] left-[40%] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                    <Activity size={12} />
                    Live workspace
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
                    <ShieldCheck size={12} />
                    Team-sponsored PRO
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                  Your equity intelligence command center.
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                  One place to see the EVC users you sponsor,
                  open their work, compare members and move into
                  professional team analytics.
                </p>
              </div>

              <div className="min-w-[240px] rounded-3xl border border-white/10 bg-white/[0.06] p-5">
  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
    {isFounder
      ? "Founder access"
      : "Workspace term"}
  </p>

  {isFounder ? (
    <>
      <p className="mt-2 text-2xl font-black text-white">
        Unlimited
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        <p className="text-[10px] font-semibold text-emerald-300">
          No renewal required
        </p>
      </div>
    </>
  ) : (
    <>
      <p className="mt-2 text-xl font-black text-white">
        {formatDate(workspace.startedAt)}
        {" → "}
        {formatDate(workspace.expiresAt)}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-full rounded-full bg-blue-400" />
      </div>

      <p className="mt-2 text-[10px] font-semibold text-slate-500">
        Annual Team Intelligence entitlement
      </p>
    </>
  )}
</div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <WorkspaceKpi
              icon={<Users size={18} />}
              label="Members"
              value={`${workspace.limits.memberCount}/${workspace.limits.maxMembers}`}
              caption={`${workspace.limits.remainingSlots} remaining`}
            />

            <WorkspaceKpi
              icon={<LayoutGrid size={18} />}
              label="Workspace view"
              value={
                view === "base"
                  ? "Base"
                  : "Analytical"
              }
              caption="Switch view above"
            />

            <WorkspaceKpi
              icon={<BarChart3 size={18} />}
              label="Team analytics"
              value={
                view === "analytical"
                  ? "Active"
                  : "Ready"
              }
              caption="Power BI-style layer"
            />

            <WorkspaceKpi
              icon={<CalendarClock size={18} />}
              label={
                isFounder
                  ? "Access"
                  : "Expires"
              }
              value={
                isFounder
                  ? "Unlimited"
                  : formatShortDate(
                      workspace.expiresAt
                    )
              }
              caption={
                isFounder
                  ? "Founder access"
                  : "Annual renewal"
              }
            />
          </div>

          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Workspace mode
              </p>

              <p className="mt-1 text-sm font-black text-slate-950">
                {view === "base"
                  ? "Member command center"
                  : "Team analytical intelligence"}
              </p>
            </div>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <ViewButton
                active={view === "base"}
                icon={<LayoutGrid size={14} />}
                label="Base View"
                onClick={() =>
                  setView("base")
                }
              />

              <ViewButton
                active={view === "analytical"}
                icon={<BarChart3 size={14} />}
                label="Analytical View"
                onClick={() =>
                  setView("analytical")
                }
              />
            </div>
          </div>

          {view === "base" ? (
            <section className="p-5 md:p-7 lg:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Sponsored members
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    Your team at a glance.
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Every card is connected to a real EVC account.
                    Preview, compare and analysis actions operate
                    on that member&apos;s persisted EVC data.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    workspace.limits.remainingSlots <= 0
                  }
                  onClick={() => {
                    setMemberError("");
                    setAddMemberOpen(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add another member
                </button>
              </div>

              {workspace.members.length === 0 ? (
                <EmptyMembers
                  onAdd={() => {
                    setMemberError("");
                    setAddMemberOpen(true);
                  }}
                />
              ) : (
                <div className="mt-7 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                  {workspace.members.map(
                    (member, index) => (
                      <TeamMemberCard
                        key={member.membershipId}
                        member={member}
                        index={index}
                        onRemove={() =>
                          setRemoveMemberTarget(
                            member
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          ) : (
            <TeamAnalyticalView />
          )}
        </section>
      </div>

      {addMemberOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.97,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  Add Team Member
                </p>

                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  Add an existing EVC user
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  The account must already exist. Once added,
                  the member receives Team-sponsored PRO access.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAddMemberOpen(false)
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <label
                htmlFor="team-member-email"
                className="text-xs font-black uppercase tracking-[0.14em] text-slate-500"
              >
                Registered EVC email
              </label>

              <input
                id="team-member-email"
                type="email"
                value={memberEmail}
                onChange={(event) =>
                  setMemberEmail(
                    event.target.value
                  )
                }
                placeholder="member@example.com"
                className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void addMember();
                  }
                }}
              />

              {memberError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700">
                  {memberError}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setAddMemberOpen(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void addMember()
                  }
                  disabled={addingMember}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingMember ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Add member
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {removeMemberTarget && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-md"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                if (!removingMember) {
                  setMemberError("");
                  setRemoveMemberTarget(
                    null
                  );
                }
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.94,
                y: 18,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 10,
              }}
              transition={{
                duration: 0.24,
                ease: [
                  0.2,
                  0.8,
                  0.2,
                  1,
                ],
              }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_35px_110px_rgba(15,23,42,0.28)]"
            >
              <div className="relative overflow-hidden bg-[#07111f] px-6 py-7 text-white">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

                <div className="relative flex items-start gap-4">
                  <motion.div
                    initial={{
                      scale: 0.8,
                      rotate: -8,
                    }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                    }}
                    transition={{
                      delay: 0.05,
                      duration: 0.25,
                    }}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-red-300/20 bg-red-500/10 text-red-300"
                  >
                    <AlertTriangle
                      size={21}
                    />
                  </motion.div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">
                      Remove Team Member
                    </p>

                    <h3 className="mt-2 text-xl font-black tracking-tight">
                      Remove this member?
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      This will remove the user from
                      your Team Workspace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">
                      {getInitials(
                        removeMemberTarget.name
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {removeMemberTarget.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                        {removeMemberTarget.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <p className="text-xs leading-5 text-blue-900/75">
                      Removing this member only removes
                      their Team Workspace membership.
                      Their EVC account and personal data
                      are not deleted.
                    </p>
                  </div>
                </div>

                {memberError && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -4,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold leading-5 text-red-700"
                  >
                    {memberError}
                  </motion.div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <motion.button
                    type="button"
                    disabled={removingMember}
                    onClick={() => {
                      setMemberError("");
                      setRemoveMemberTarget(
                        null
                      );
                    }}
                    whileHover={{
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    type="button"
                    disabled={removingMember}
                    onClick={() =>
                      void removeMember(
                        removeMemberTarget.userId
                      )
                    }
                    whileHover={{
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingMember ? (
                      <>
                        <RefreshCw
                          size={15}
                          className="animate-spin"
                        />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2
                          size={15}
                        />
                        Remove Member
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-500 hover:bg-white hover:text-slate-950"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function WorkspaceKpi({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>

        <span className="text-[10px] font-black uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-400">
        {caption}
      </p>
    </div>
  );
}

function EntitlementPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-xs font-semibold text-slate-300">
      {icon}
      {label}
    </div>
  );
}

function FeatureLine({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
      {text}
    </div>
  );
}

function EmptyMembers({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm">
        <Users size={24} />
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-950">
        No members added yet.
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Add an existing EVC user and they will receive
        Team-sponsored PRO access automatically.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        <Plus size={15} />
        Add first member
      </button>
    </div>
  );
}

function getInitials(
  name: string
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }
  );
}