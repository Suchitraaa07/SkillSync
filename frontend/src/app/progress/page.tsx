"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  FolderKanban,
  GitBranch,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ApplicationList } from "@/components/applications/ApplicationList";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { ApplicationSkeleton } from "@/components/applications/ApplicationSkeleton";
import { ApplicationsOverTimeChart } from "@/components/applications/ApplicationsOverTimeChart";
import { ConversionFunnelChart } from "@/components/applications/ConversionFunnelChart";
import { ReferralImpactChart } from "@/components/applications/ReferralImpactChart";
import { RoleSuccessChart } from "@/components/applications/RoleSuccessChart";
import { ApplicationFormValues, ApplicationItem, ApplicationStatus } from "@/components/applications/types";
import { api } from "@/lib/api";
import {
  getApplicationsOverTime,
  getConversionFunnel,
  getReferralImpact,
  getRoleSuccessRate,
  getSummaryMetrics,
} from "@/lib/applicationAnalytics";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { StatItem } from "@/components/progress/StatItem";

type RoadmapProgressSnapshot = {
  roleKey: string;
  roleLabel: string;
  selectedId: string | null;
  progressById: Record<string, "not_started" | "in_progress" | "completed">;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  pendingTasks: number;
  overallProgress: number;
  updatedAt: string;
};

type ToastState = {
  tone: "success" | "error";
  message: string;
};

type ReadinessResponse = {
  readiness: {
    score: number;
    category: string;
    components?: {
      skillMatch?: number;
      projectRelevance?: number;
      experienceScore?: number;
    };
  };
  history: { score: number; category: string; createdAt: string }[];
};

type ProfileIntelligenceResponse = {
  githubGrowth?: {
    score: number;
    totalRepositories: number;
    totalCommits30d: number;
    longestStreakDays: number;
  };
  leetcodeProgress?: {
    score: number;
    totalProblemsSolved: number;
    contestRating: number;
    currentStreakDays: number;
  };
};

type RoadmapItem = {
  week: number;
  focusSkill: string;
  project: string;
  resources: string[];
};

type UpcomingProjectItem = {
  id: string;
  weekLabel: string;
  focus: string;
  project: string;
  resources: string[];
  source: "roadmap" | "custom";
};

type OverallSignal = {
  label: string;
  value: number;
  hint: string;
  icon: typeof TrendingUp;
  tone: "emerald" | "cyan" | "amber" | "violet" | "blue";
};

const ROADMAP_PROGRESS_STORAGE_KEY = "skillsync_roadmap_progress";
const ROADMAP_PROGRESS_UPDATED_EVENT = "skillsync-roadmap-progress-updated";
const UPCOMING_PROJECTS_STORAGE_KEY = "skillsync_progress_upcoming_projects";

const readActiveRoadmapSnapshot = (): RoadmapProgressSnapshot | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ROADMAP_PROGRESS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const activeRoleKey = typeof parsed?.activeRoleKey === "string" ? parsed.activeRoleKey : null;
    const snapshots = parsed?.snapshots && typeof parsed.snapshots === "object" ? parsed.snapshots : {};
    const snapshot = activeRoleKey ? snapshots[activeRoleKey] : null;

    return snapshot && typeof snapshot === "object" ? snapshot : null;
  } catch {
    return null;
  }
};

const MOTIVATIONAL_QUOTES = [
  "Consistency compounds faster than intensity.",
  "Small wins every day create unstoppable momentum.",
  "Your future self is built by today's focused hour.",
  "Progress is proof: keep showing up.",
  "Do one hard thing before noon.",
  "Confidence grows when preparation becomes a habit.",
  "Skill beats luck when repeated daily.",
  "Ship, learn, improve, repeat.",
  "Discipline turns goals into timelines.",
  "You do not need perfect days, only honest ones.",
];

export default function ProgressPage() {
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [dayStartSeed, setDayStartSeed] = useState<number>(Math.floor(Date.now() / 86400000));
  const [readinessData, setReadinessData] = useState<ReadinessResponse | null>(null);
  const [profileIntel, setProfileIntel] = useState<ProfileIntelligenceResponse | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [roadmapSnapshot, setRoadmapSnapshot] = useState<RoadmapProgressSnapshot | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationToast, setApplicationToast] = useState<ToastState | null>(null);
  const [isApplicationSaving, setIsApplicationSaving] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<string | null>(null);
  const [hiddenUpcomingProjectIds, setHiddenUpcomingProjectIds] = useState<string[]>([]);
  const [customUpcomingProjects, setCustomUpcomingProjects] = useState<UpcomingProjectItem[]>([]);
  const [showUpcomingProjectForm, setShowUpcomingProjectForm] = useState(false);
  const [upcomingProjectForm, setUpcomingProjectForm] = useState({
    weekLabel: "",
    focus: "",
    project: "",
  });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!applicationToast) return;
    const timer = window.setTimeout(() => setApplicationToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [applicationToast]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(UPCOMING_PROJECTS_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setHiddenUpcomingProjectIds(
        Array.isArray(parsed?.hiddenIds)
          ? parsed.hiddenIds.filter((item: unknown): item is string => typeof item === "string")
          : []
      );
      setCustomUpcomingProjects(
        Array.isArray(parsed?.customProjects)
          ? parsed.customProjects.filter(
              (item: unknown): item is UpcomingProjectItem => {
                if (!item || typeof item !== "object") return false;
                const candidate = item as Record<string, unknown>;

                return (
                  typeof candidate.id === "string" &&
                  typeof candidate.weekLabel === "string" &&
                  typeof candidate.focus === "string" &&
                  typeof candidate.project === "string" &&
                  Array.isArray(candidate.resources)
                );
              }
            )
          : []
      );
    } catch {
      setHiddenUpcomingProjectIds([]);
      setCustomUpcomingProjects([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      UPCOMING_PROJECTS_STORAGE_KEY,
      JSON.stringify({
        hiddenIds: hiddenUpcomingProjectIds,
        customProjects: customUpcomingProjects,
      })
    );
  }, [customUpcomingProjects, hiddenUpcomingProjectIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const todaySeed = Math.floor(Date.now() / 86400000);
    const storageKey = "skillsync_progress_day_start";
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? Number(raw) : NaN;

    if (Number.isFinite(parsed) && parsed <= todaySeed) {
      setDayStartSeed(parsed);
      return;
    }

    localStorage.setItem(storageKey, String(todaySeed));
    setDayStartSeed(todaySeed);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncRoadmapSnapshot = () => {
      setRoadmapSnapshot(readActiveRoadmapSnapshot());
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ROADMAP_PROGRESS_STORAGE_KEY) {
        syncRoadmapSnapshot();
      }
    };

    const handleRoadmapUpdate = (event: Event) => {
      const detail = (event as CustomEvent<RoadmapProgressSnapshot | null>).detail;
      setRoadmapSnapshot(detail || readActiveRoadmapSnapshot());
    };

    syncRoadmapSnapshot();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ROADMAP_PROGRESS_UPDATED_EVENT, handleRoadmapUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ROADMAP_PROGRESS_UPDATED_EVENT, handleRoadmapUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadLiveData = async () => {
      try {
        if (mounted) setStatus("");
        const [readinessRes, appsRes, roadmapRes, profileIntelRes] = await Promise.all([
          api.get<ReadinessResponse>("/readiness-score"),
          api.get<{ applications: ApplicationItem[] }>("/api/applications"),
          api.get<{ roadmap: RoadmapItem[] }>("/roadmap"),
          api.get<ProfileIntelligenceResponse>("/api/auth/profile-intelligence").catch(() => null),
        ]);

        if (!mounted) return;
        setReadinessData(readinessRes.data);
        setApplications(appsRes.data.applications || []);
        setRoadmap(roadmapRes.data.roadmap || []);
        setProfileIntel(profileIntelRes?.data || null);
      } catch {
        if (!mounted) return;
        setStatus("Showing sample values until resume/job analysis data is available.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadLiveData();
    const pollTimer = setInterval(loadLiveData, 30000);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  const currentScore = readinessData?.readiness?.score ?? 74;

  const interviewCount = useMemo(
    () => applications.filter((item) => item.status === "Interview").length,
    [applications]
  );

  const applicationSummary = useMemo(() => getSummaryMetrics(applications), [applications]);
  const applicationsOverTime = useMemo(() => getApplicationsOverTime(applications), [applications]);
  const conversionFunnel = useMemo(() => getConversionFunnel(applications), [applications]);
  const roleSuccessRates = useMemo(() => getRoleSuccessRate(applications), [applications]);
  const referralImpact = useMemo(() => getReferralImpact(applications), [applications]);
  const githubGrowthScore = Math.max(0, Math.min(100, Math.round(profileIntel?.githubGrowth?.score ?? 0)));
  const leetcodeProgressScore = Math.max(0, Math.min(100, Math.round(profileIntel?.leetcodeProgress?.score ?? 0)));
  const applicationProgressScore = Math.max(
    0,
    Math.min(100, Math.round(applicationSummary.shortlistRate * 0.7 + applicationSummary.offerRate * 0.3))
  );

  const roadmapProgress = roadmapSnapshot?.overallProgress ?? Math.max(15, Math.min(95, Math.round(currentScore)));
  const totalRoadmapTasks = roadmapSnapshot?.totalTasks ?? (roadmap.length || 12);
  const completedTasks =
    roadmapSnapshot?.completedTasks ??
    Math.min(totalRoadmapTasks, Math.round((roadmapProgress / 100) * totalRoadmapTasks));
  const inProgressTasks = roadmapSnapshot?.inProgressTasks ?? 0;
  const pendingTasks = roadmapSnapshot?.pendingTasks ?? Math.max(0, totalRoadmapTasks - completedTasks);

  const roadmapMilestones = [
    { label: "Resume Optimized", done: currentScore >= 60 },
    { label: "First Mock Completed", done: interviewCount > 0 },
    { label: "70+ Overall Score Achieved", done: currentScore >= 70 },
  ];

  const overallProgressScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        currentScore * 0.3 +
          roadmapProgress * 0.25 +
          githubGrowthScore * 0.15 +
          leetcodeProgressScore * 0.15 +
          applicationProgressScore * 0.15
      )
    )
  );

  const overallSignals = useMemo<OverallSignal[]>(
    () => [
      {
        label: "Readiness",
        value: currentScore,
        hint: readinessData?.readiness?.category || "Core signal",
        icon: ShieldCheck,
        tone: "emerald",
      },
      {
        label: "GitHub Growth",
        value: githubGrowthScore,
        hint: `${profileIntel?.githubGrowth?.totalCommits30d || 0} commits / 30d`,
        icon: GitBranch,
        tone: "cyan",
      },
      {
        label: "LeetCode Progress",
        value: leetcodeProgressScore,
        hint: `${profileIntel?.leetcodeProgress?.totalProblemsSolved || 0} solved`,
        icon: Code2,
        tone: "amber",
      },
      {
        label: "Roadmap",
        value: roadmapProgress,
        hint: `${completedTasks}/${totalRoadmapTasks} completed`,
        icon: FolderKanban,
        tone: "violet",
      },
      {
        label: "Applications",
        value: applicationProgressScore,
        hint: `${applicationSummary.shortlistRate}% shortlist`,
        icon: BriefcaseBusiness,
        tone: "blue",
      },
    ],
    [
      applicationProgressScore,
      applicationSummary.shortlistRate,
      completedTasks,
      currentScore,
      githubGrowthScore,
      leetcodeProgressScore,
      profileIntel?.githubGrowth?.totalCommits30d,
      profileIntel?.leetcodeProgress?.totalProblemsSolved,
      readinessData?.readiness?.category,
      roadmapProgress,
      totalRoadmapTasks,
    ]
  );

  const strongestSignal = useMemo(
    () => overallSignals.reduce((best, current) => (current.value > best.value ? current : best), overallSignals[0]),
    [overallSignals]
  );
  const focusSignal = useMemo(
    () => overallSignals.reduce((lowest, current) => (current.value < lowest.value ? current : lowest), overallSignals[0]),
    [overallSignals]
  );

  const roadmapUpcomingProjects = useMemo<UpcomingProjectItem[]>(() => {
    if (roadmap.length) {
      return roadmap.slice(0, 3).map((item, index) => ({
        id: `${item.week}-${item.focusSkill}-${index}`,
        weekLabel: `Week ${item.week}`,
        focus: item.focusSkill || "Focused practice",
        project: item.project || "Project sprint",
        resources: Array.isArray(item.resources) ? item.resources.slice(0, 2) : [],
        source: "roadmap",
      }));
    }

    return [
      {
        id: "fallback-1",
        weekLabel: "Week 1",
        focus: "Portfolio polish",
        project: "Ship one clean case-study update for your strongest project",
        resources: ["Resume bullets", "GitHub README"],
        source: "roadmap",
      },
      {
        id: "fallback-2",
        weekLabel: "Week 2",
        focus: "Interview prep",
        project: "Build a timed mock interview routine with answer notes",
        resources: ["Mock questions", "STAR stories"],
        source: "roadmap",
      },
      {
        id: "fallback-3",
        weekLabel: "Week 3",
        focus: "Proof of work",
        project: "Publish one small feature or mini project to show momentum",
        resources: ["Deployment", "LinkedIn post"],
        source: "roadmap",
      },
    ];
  }, [roadmap]);

  const upcomingProjects = useMemo(
    () => [
      ...customUpcomingProjects,
      ...roadmapUpcomingProjects.filter((item) => !hiddenUpcomingProjectIds.includes(item.id)),
    ],
    [customUpcomingProjects, hiddenUpcomingProjectIds, roadmapUpcomingProjects]
  );

  const handleAddUpcomingProject = () => {
    const project = upcomingProjectForm.project.trim();
    const focus = upcomingProjectForm.focus.trim();
    const weekLabel = upcomingProjectForm.weekLabel.trim() || "Next Sprint";

    if (!project || !focus) return;

    const nextProject: UpcomingProjectItem = {
      id: `custom-${Date.now()}`,
      weekLabel,
      focus,
      project,
      resources: [],
      source: "custom",
    };

    setCustomUpcomingProjects((prev) => [nextProject, ...prev]);
    setUpcomingProjectForm({ weekLabel: "", focus: "", project: "" });
    setShowUpcomingProjectForm(false);
  };

  const handleRemoveUpcomingProject = (projectId: string, source: UpcomingProjectItem["source"]) => {
    if (source === "custom") {
      setCustomUpcomingProjects((prev) => prev.filter((item) => item.id !== projectId));
      return;
    }

    setHiddenUpcomingProjectIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]));
  };

  const handleApplicationCreated = async (values: ApplicationFormValues) => {
    try {
      setIsApplicationSaving(true);
      const { data } = await api.post<{ application: ApplicationItem }>("/api/applications", values);
      setApplications((prev) =>
        [data.application, ...prev].sort(
          (a, b) => new Date(b.dateApplied || b.createdAt).getTime() - new Date(a.dateApplied || a.createdAt).getTime()
        )
      );
      setApplicationToast({ tone: "success", message: "Application saved successfully." });
    } catch (error: any) {
      setApplicationToast({
        tone: "error",
        message: error?.response?.data?.message || "Could not save application.",
      });
      throw error;
    } finally {
      setIsApplicationSaving(false);
    }
  };

  const handleApplicationStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      setBusyApplicationId(id);
      const { data } = await api.put<{ application: ApplicationItem }>(`/api/applications/${id}`, { status });
      setApplications((prev) => prev.map((item) => (item._id === id ? data.application : item)));
      setApplicationToast({ tone: "success", message: "Application status updated." });
    } catch (error: any) {
      setApplicationToast({
        tone: "error",
        message: error?.response?.data?.message || "Could not update status.",
      });
    } finally {
      setBusyApplicationId(null);
    }
  };

  const handleApplicationDelete = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this application?")) {
      return;
    }

    try {
      setBusyApplicationId(id);
      await api.delete(`/api/applications/${id}`);
      setApplications((prev) => prev.filter((item) => item._id !== id));
      setApplicationToast({ tone: "success", message: "Application deleted." });
    } catch (error: any) {
      setApplicationToast({
        tone: "error",
        message: error?.response?.data?.message || "Could not delete application.",
      });
    } finally {
      setBusyApplicationId(null);
    }
  };

  const daySeed = Math.floor(Date.now() / 86400000);
  const dayCount = Math.max(1, daySeed - dayStartSeed + 1);
  const quoteIndex = (dayCount - 1 + quoteOffset) % MOTIVATIONAL_QUOTES.length;
  const dayNumber = String(dayCount).padStart(2, "0");
  const quoteOfDay = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <AuthGuard>
      <AppShell>
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/35 bg-emerald-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
              Performance Dashboard
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
              Live Sync: Every 30s
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="bg-linear-to-r from-slate-100 via-emerald-100 to-amber-100 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl">
              Progress Tracker
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
              Monitor your GitHub, LeetCode, interview and application momentum in one place with actionable, continuously updated progress signals.
            </p>
          </div>

          <div className="h-px w-full bg-linear-to-r from-emerald-300/20 via-slate-500/20 to-transparent" />

          {status ? (
            <p className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{status}</p>
          ) : null}
          {isLoading ? <p className="text-sm text-slate-400">Loading live metrics...</p> : null}

          <div className="mx-auto mt-6 max-w-3xl space-y-3 px-3 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Day {dayNumber}</p>
            <p className="text-lg font-medium leading-relaxed text-slate-100">{quoteOfDay}</p>
            <div className="pt-1">
              <button
                onClick={() => setQuoteOffset((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
                className="inline-flex items-center rounded-xl border border-emerald-300/35 bg-emerald-500/12 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-500/20"
              >
                Refresh Quote
              </button>
            </div>
          </div>
        </section>

        <section>
          <ProgressCard
            title="Overall Progress"
            subtitle="A single progress pulse built from your coding proof, DSA consistency, roadmap execution, and application momentum."
            className="border-cyan-400/15 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(168,85,247,0.14),transparent_26%),linear-gradient(160deg,rgba(12,18,34,0.98),rgba(8,12,24,0.98)_60%,rgba(2,6,18,1))]"
          >
            <div className="grid gap-6 xl:grid-cols-[320px_1fr] xl:items-center">
              <div className="relative flex items-center justify-center">
                <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-cyan-500/12 blur-3xl" />
                <div className="pointer-events-none absolute h-40 w-40 rounded-full bg-violet-500/12 blur-2xl" />
                <div
                  className="relative grid h-64 w-64 place-items-center rounded-full border border-white/10 bg-slate-950/70 shadow-[0_0_45px_rgba(34,211,238,0.16)]"
                  style={{
                    background: `conic-gradient(from 200deg, rgba(16,185,129,0.98) 0deg, rgba(34,211,238,0.98) ${Math.max(
                      0,
                      overallProgressScore * 2.6
                    )}deg, rgba(250,204,21,0.95) ${Math.min(360, overallProgressScore * 3.6)}deg, rgba(51,65,85,0.55) 0deg)`,
                  }}
                >
                  <div className="grid h-48 w-48 place-items-center rounded-full border border-white/6 bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.95),rgba(2,6,23,0.98))] text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Overall</p>
                      <p className="mt-3 bg-linear-to-r from-cyan-100 via-emerald-100 to-amber-100 bg-clip-text text-6xl font-semibold text-transparent">
                        {overallProgressScore}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">out of 100</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Progress Pulse</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-100">A sharper view of where your profile is actually moving</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                      This score blends the same GitHub and LeetCode growth signals visible on Home with your roadmap execution, application funnel, and readiness score from Progress Tracker.
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                    Live Blend
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {overallSignals.map((signal) => (
                    <OverallSignalTile key={signal.label} signal={signal} />
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-slate-700/65 bg-slate-950/45 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-200">Signal Breakdown</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Weighted inputs</p>
                    </div>
                    <div className="space-y-3">
                      {overallSignals.map((signal) => (
                        <OverallSignalBar key={`${signal.label}-bar`} signal={signal} />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Strongest Signal</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-50">{strongestSignal.label}</p>
                      <p className="mt-1 text-sm text-emerald-100/85">{strongestSignal.hint}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Next Focus</p>
                      <p className="mt-2 text-lg font-semibold text-amber-50">{focusSignal.label}</p>
                      <p className="mt-1 text-sm text-amber-100/85">This is the lowest current signal, so improving it will lift your overall progress fastest.</p>
                    </div>
                    {!profileIntel?.githubGrowth && !profileIntel?.leetcodeProgress ? (
                      <div className="rounded-2xl border border-slate-700/65 bg-slate-950/45 p-4">
                        <p className="text-sm leading-relaxed text-slate-400">
                          GitHub and LeetCode scores sync from the same connected profile intelligence shown on Home. Connect those profiles for a fuller overall progress view.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </ProgressCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <ProgressCard title="Roadmap Completion" subtitle="Execution consistency is your strongest accelerator">
            <div className="rounded-xl border border-slate-700/65 bg-slate-900/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">Overall completion</p>
                <span className="text-sm font-semibold text-cyan-200">{roadmapProgress}%</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/85">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 via-cyan-400 to-amber-300 shadow-[0_0_24px_rgba(52,211,153,0.45)] transition-all duration-700"
                  style={{ width: `${roadmapProgress}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatItem label="Completed Tasks" value={String(completedTasks)} delta="On track" icon={CheckCircle2} />
                <StatItem
                  label="Pending Tasks"
                  value={String(pendingTasks)}
                  delta={inProgressTasks > 0 ? `${inProgressTasks} learning now` : "Focus next"}
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Milestone Badges</p>
              <div className="flex flex-wrap gap-2.5">
                {roadmapMilestones.map((milestone) => (
                  <span
                    key={milestone.label}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                      milestone.done
                        ? "border-indigo-300/30 bg-indigo-500/12 text-indigo-100"
                        : "border-slate-600 bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {milestone.label}
                  </span>
                ))}
              </div>
            </div>
          </ProgressCard>

          <ProgressCard title="Upcoming Project Tracker" subtitle="Use your next roadmap steps as concrete build targets.">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/65 bg-slate-900/55 p-3">
                <p className="text-sm text-slate-300">Add your own upcoming project or remove a suggestion you do not want to track.</p>
                <button
                  type="button"
                  onClick={() => setShowUpcomingProjectForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/12 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/22"
                >
                  <Plus className="h-4 w-4" />
                  {showUpcomingProjectForm ? "Close" : "Add Project"}
                </button>
              </div>

              {showUpcomingProjectForm ? (
                <div className="grid gap-3 rounded-xl border border-slate-700/65 bg-slate-900/55 p-4">
                  <input
                    value={upcomingProjectForm.weekLabel}
                    onChange={(event) => setUpcomingProjectForm((prev) => ({ ...prev, weekLabel: event.target.value }))}
                    placeholder="Week label, e.g. Week 4"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
                  />
                  <input
                    value={upcomingProjectForm.focus}
                    onChange={(event) => setUpcomingProjectForm((prev) => ({ ...prev, focus: event.target.value }))}
                    placeholder="Focus area"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
                  />
                  <input
                    value={upcomingProjectForm.project}
                    onChange={(event) => setUpcomingProjectForm((prev) => ({ ...prev, project: event.target.value }))}
                    placeholder="Project or task"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddUpcomingProject}
                      disabled={!upcomingProjectForm.focus.trim() || !upcomingProjectForm.project.trim()}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/12 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/22 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      Save Project
                    </button>
                  </div>
                </div>
              ) : null}

              {!upcomingProjects.length ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/45 px-4 py-6 text-center text-sm text-slate-400">
                  No upcoming projects in this tracker right now. Add one to start planning your next build.
                </div>
              ) : null}

              {upcomingProjects.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-700/65 bg-slate-900/65 p-4 transition duration-300 hover:border-cyan-300/25"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{item.weekLabel}</p>
                      <h3 className="mt-2 text-base font-semibold text-slate-100">{item.project}</h3>
                      <p className="mt-1 text-sm text-slate-400">Focus: {item.focus}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                        {item.source === "custom" ? "Custom" : "Upcoming"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUpcomingProject(item.id, item.source)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-300/20 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {item.resources.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.resources.map((resource) => (
                        <span
                          key={`${item.id}-${resource}`}
                          className="rounded-full border border-slate-600 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </ProgressCard>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Application Analytics</h2>
              <p className="mt-1 text-sm text-slate-400">Track your funnel, referral impact, and role conversion without leaving Progress Tracker.</p>
            </div>
          </div>

          {applicationToast ? (
            <p
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                applicationToast.tone === "success"
                  ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                  : "border-rose-300/30 bg-rose-500/10 text-rose-100"
              }`}
            >
              {applicationToast.message}
            </p>
          ) : null}

          {isLoading ? (
            <ApplicationSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatItem
                    label="Applications"
                    value={String(applicationSummary.totalApplications)}
                    delta="Live"
                    icon={BriefcaseBusiness}
                  />
                  <StatItem
                    label="Shortlist Rate"
                    value={`${applicationSummary.shortlistRate}%`}
                    delta="Conversion"
                    icon={TrendingUp}
                  />
                  <StatItem
                    label="Offer Rate"
                    value={`${applicationSummary.offerRate}%`}
                    delta="Outcome"
                    icon={Sparkles}
                  />
                  <StatItem
                    label="Referral Mix"
                    value={`${applicationSummary.referralRate}%`}
                    delta="Network"
                    icon={CheckCircle2}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/22"
                >
                  <Plus className="h-4 w-4" />
                  Add Application
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <ProgressCard title="Applications Over Time" subtitle="Weekly volume of applications submitted">
                  <ApplicationsOverTimeChart data={applicationsOverTime} />
                </ProgressCard>

                <ProgressCard title="Conversion Funnel" subtitle="Applied to offer progression across your pipeline">
                  <ConversionFunnelChart data={conversionFunnel} />
                </ProgressCard>

                <ProgressCard title="Role Success Rate" subtitle="Percent shortlisted or better for each role">
                  <RoleSuccessChart data={roleSuccessRates} />
                </ProgressCard>

                <ProgressCard title="Referral Impact" subtitle="Referral vs non-referral shortlist success">
                  <ReferralImpactChart data={referralImpact} />
                </ProgressCard>
              </div>

              <ProgressCard title="Tracked Applications" subtitle="Update statuses or delete entries in place">
                <ApplicationList
                  applications={applications}
                  busyId={busyApplicationId}
                  onStatusChange={handleApplicationStatusChange}
                  onDelete={handleApplicationDelete}
                />
              </ProgressCard>
            </div>
          )}
        </section>
        <ApplicationModal
          open={showApplicationModal}
          isSaving={isApplicationSaving}
          onClose={() => setShowApplicationModal(false)}
          onSubmit={async (values) => {
            await handleApplicationCreated(values);
            setShowApplicationModal(false);
          }}
        />
      </AppShell>
    </AuthGuard>
  );
}

function toneClasses(tone: OverallSignal["tone"]) {
  return {
    emerald: {
      pill: "border-emerald-300/25 bg-emerald-500/12 text-emerald-100",
      iconWrap: "border-emerald-300/20 bg-emerald-500/10 text-emerald-200",
      bar: "from-emerald-400 to-teal-300",
    },
    cyan: {
      pill: "border-cyan-300/25 bg-cyan-500/12 text-cyan-100",
      iconWrap: "border-cyan-300/20 bg-cyan-500/10 text-cyan-200",
      bar: "from-cyan-400 to-sky-300",
    },
    amber: {
      pill: "border-amber-300/25 bg-amber-500/12 text-amber-100",
      iconWrap: "border-amber-300/20 bg-amber-500/10 text-amber-200",
      bar: "from-amber-400 to-yellow-300",
    },
    violet: {
      pill: "border-violet-300/25 bg-violet-500/12 text-violet-100",
      iconWrap: "border-violet-300/20 bg-violet-500/10 text-violet-200",
      bar: "from-violet-400 to-fuchsia-300",
    },
    blue: {
      pill: "border-blue-300/25 bg-blue-500/12 text-blue-100",
      iconWrap: "border-blue-300/20 bg-blue-500/10 text-blue-200",
      bar: "from-blue-400 to-indigo-300",
    },
  }[tone];
}

function OverallSignalTile({ signal }: { signal: OverallSignal }) {
  const Icon = signal.icon;
  const styles = toneClasses(signal.tone);

  return (
    <div className="rounded-2xl border border-slate-700/65 bg-slate-950/50 p-3.5 transition duration-300 hover:border-slate-500/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{signal.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{signal.value}%</p>
        </div>
        <div className={`rounded-2xl border p-2.5 ${styles.iconWrap}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{signal.hint}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/90">
        <div className={`h-full rounded-full bg-linear-to-r ${styles.bar}`} style={{ width: `${signal.value}%` }} />
      </div>
    </div>
  );
}

function OverallSignalBar({ signal }: { signal: OverallSignal }) {
  const Icon = signal.icon;
  const styles = toneClasses(signal.tone);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-slate-300">
          <span className={`rounded-full border p-1 ${styles.iconWrap}`}>
            <Icon className="h-3 w-3" />
          </span>
          {signal.label}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${styles.pill}`}>{signal.value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-900/90">
        <div className={`h-full rounded-full bg-linear-to-r ${styles.bar}`} style={{ width: `${signal.value}%` }} />
      </div>
    </div>
  );
}
