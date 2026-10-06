"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import TeamWorkspaceDashboard from "@/components/team/TeamWorkspaceDashboard";

export type TeamMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  addedAt: string;
  status: string;
};

export type TeamWorkspace = {
  id: string;
  name: string;
  status: string;
  startedAt: string;
  expiresAt: string;

  access?: {
    isFounder: boolean;
    unlimited: boolean;
  };

  limits: {
    maxMembers: number;
    memberCount: number;
    remainingSlots: number;
  };

  members: TeamMember[];
};

type TeamResponse = {
  success: boolean;

  workspace?: TeamWorkspace;

  access?: {
    isFounder: boolean;
    unlimited: boolean;
  };

  code?: string;
  message?: string;
};

const TEMPORARY_WORKSPACE_NAME =
  "Team Intelligence Workspace";

export default function TeamPage() {
  const router = useRouter();

  const [workspace, setWorkspace] =
    useState<TeamWorkspace | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [renaming, setRenaming] =
    useState(false);

  const [workspaceName, setWorkspaceName] =
    useState("");

  const [setupName, setSetupName] =
    useState("");

  const [error, setError] =
    useState("");

  const [setupError, setSetupError] =
    useState("");

  async function loadWorkspace() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/team",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as TeamResponse;

      if (
        response.ok &&
        data.success &&
        data.workspace
      ) {
        setWorkspace({
          ...data.workspace,
          access:
            data.access,
        });

        /*
         * A successfully purchased Team plan creates the workspace with a
         * temporary name. Start the naming flow immediately.
         */
        if (
          data.workspace.name ===
          TEMPORARY_WORKSPACE_NAME
        ) {
          setSetupName("");
        }

        return;
      }

      if (
        response.status === 403 &&
        data.code ===
          "TEAM_WORKSPACE_REQUIRED"
      ) {
        setWorkspace(null);
        return;
      }

      if (
        response.status === 403 &&
        data.code ===
          "TEAM_WORKSPACE_EXPIRED"
      ) {
        setError(
          data.message ??
            "Your Team Workspace has expired. Please renew the Team plan."
        );
        return;
      }

      setError(
        data.message ??
          "We could not load the Team Intelligence workspace."
      );
    } catch {
      setError(
        "We could not connect to the Team Intelligence workspace."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  async function createFounderWorkspace() {
    const trimmedName =
      workspaceName.trim();

    if (!trimmedName) {
      setError(
        "Please enter a workspace name."
      );
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch(
        "/api/team",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data =
        (await response.json()) as TeamResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ??
            "We could not create the Team Workspace."
        );
        return;
      }

      setWorkspaceName("");

      await loadWorkspace();
    } catch {
      setError(
        "We could not create the Team Workspace. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function renameWorkspace() {
    const trimmedName =
      setupName.trim();

    if (!trimmedName) {
      setSetupError(
        "Please enter a workspace name."
      );
      return;
    }

    if (
      trimmedName.length < 2 ||
      trimmedName.length > 80
    ) {
      setSetupError(
        "Workspace name must be between 2 and 80 characters."
      );
      return;
    }

    setRenaming(true);
    setSetupError("");

    try {
      const response = await fetch(
        "/api/team",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data =
        (await response.json()) as TeamResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.workspace
      ) {
        setSetupError(
          data.message ??
            "We could not save your workspace name."
        );
        return;
      }

      setWorkspace({
        ...data.workspace,
        access:
          data.access ??
          workspace?.access,
      });

      setSetupName("");
      setSetupError("");
    } catch {
      setSetupError(
        "We could not save your workspace name. Please try again."
      );
    } finally {
      setRenaming(false);
    }
  }

  const needsWorkspaceSetup =
    Boolean(
      workspace &&
        workspace.name ===
          TEMPORARY_WORKSPACE_NAME
    );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f8fc] text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-[1560px] items-center justify-center px-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

            <div>
              <p className="text-sm font-black text-slate-950">
                Preparing Team Intelligence
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Connecting to your workspace data...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * POST-PAYMENT / FIRST-TIME TEAM SETUP
   * --------------------------------------------------------------------------
   *
   * Payment verification has already created the Team Workspace.
   * We now ask the purchaser to give it its permanent name.
   */
  if (needsWorkspaceSetup) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-950">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="absolute right-[-120px] top-[20%] h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-[1180px] items-center px-5 py-10 md:px-8">
          <motion.section
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="w-full overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_35px_110px_rgba(15,23,42,0.12)]"
          >
            <div className="relative overflow-hidden bg-[#050816] px-6 py-10 text-white md:px-10 lg:px-14 lg:py-14">
              <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

              <div className="pointer-events-none absolute bottom-[-120px] left-[28%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

              <div className="relative max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                  <Sparkles size={12} />
                  Team Intelligence
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                  Your Team Workspace is ready.
                </h1>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  Your annual Team Intelligence entitlement is active.
                  Give the workspace a name and then you can start adding
                  existing EVC users.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <SetupPill
                    icon={<CheckCircle2 size={15} />}
                    label="Payment verified"
                  />

                  <SetupPill
                    icon={<Users size={15} />}
                    label="Up to 20 members"
                  />

                  <SetupPill
                    icon={<CalendarClock size={15} />}
                    label="12-month workspace"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_0.65fr] lg:p-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  WORKSPACE IDENTITY
                </p>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                  What should your workspace be called?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  This name is visible to you inside the Team Intelligence
                  command center. You can change it later from the workspace
                  settings flow.
                </p>

                <label
                  htmlFor="team-workspace-setup-name"
                  className="mt-7 block text-xs font-black uppercase tracking-[0.14em] text-slate-500"
                >
                  Workspace name
                </label>

                <input
                  id="team-workspace-setup-name"
                  autoFocus
                  value={setupName}
                  onChange={(event) =>
                    setSetupName(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      void renameWorkspace();
                    }
                  }}
                  placeholder="e.g. Acme ESOP Advisory Team"
                  maxLength={80}
                  className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                {setupError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {setupError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void renameWorkspace()
                  }
                  disabled={renaming}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renaming ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving workspace...
                    </>
                  ) : (
                    <>
                      Save workspace name
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                  YOUR TEAM PLAN
                </p>

                <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                  ₹1,45,000
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  annual Team Intelligence
                </p>

                <div className="mt-7 space-y-3">
                  <SetupFeature text="1 Team Workspace" />
                  <SetupFeature text="Up to 20 active members" />
                  <SetupFeature text="Existing EVC users only" />
                  <SetupFeature text="Team-sponsored PRO" />
                  <SetupFeature text="Team analytical workspace" />
                </div>

                <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                    <p className="text-xs leading-5 text-blue-900/75">
                      Added members receive PRO access automatically,
                      but they do not receive Team Admin privileges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <TeamWorkspaceDashboard
      workspace={workspace}
      workspaceName={workspaceName}
      creating={creating}
      error={error}
      onWorkspaceNameChange={
        setWorkspaceName
      }
      onCreateWorkspace={
        createFounderWorkspace
      }
      onReload={loadWorkspace}
      onBack={() =>
        router.push("/pro")
      }
    />
  );
}

function SetupPill({
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

function SetupFeature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
      <CheckCircle2
        size={16}
        className="shrink-0 text-emerald-600"
      />
      {text}
    </div>
  );
}