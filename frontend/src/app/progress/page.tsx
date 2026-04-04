"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronUp, ClipboardCheck, Rocket, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { api } from "@/lib/api";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { ProgressTrackerCards } from "@/components/progress/ProgressTrackerCards";
import { StatItem } from "@/components/progress/StatItem";
import { TrendChart } from "@/components/progress/TrendChart";

type PeriodKey = "weekly" | "monthly";

type GrowthPoint = {
  label: string;
  primary: number;
};

type ImprovementStat = {
  label: string;
  value: string;
  delta: string;
};

type SkillProgress = {
  skill: string;
  progress: number;
  improvement: string;
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

type AppItem = {
  _id: string;
  company: string;
  role: string;
  status: "Saved" | "Applied" | "Interview" | "Rejected" | "Offer";
  fitScore: number;
  createdAt?: string;
  appliedAt?: string;
};

type RoadmapItem = {
  week: number;
  focusSkill: string;
  project: string;
  resources: string[];
};

const fallbackGrowth = [
  { label: "Jan", primary: 52 },
  { label: "Feb", primary: 58 },
  { label: "Mar", primary: 63 },
  { label: "Apr", primary: 68 },
  { label: "May", primary: 71 },
  { label: "Jun", primary: 74 },
] satisfies GrowthPoint[];

const formatDelta = (value: number) => {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
};

const shortlistStatuses = new Set(["Interview", "Offer"]);

const monthLabel = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: "short" });

const toScoreOutOfTen = (score: number) => Number((Math.max(0, Math.min(100, score)) / 10).toFixed(1));

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
  const [period, setPeriod] = useState<PeriodKey>("weekly");
  const [animateBars, setAnimateBars] = useState(false);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [dayStartSeed, setDayStartSeed] = useState<number>(Math.floor(Date.now() / 86400000));
  const [readinessData, setReadinessData] = useState<ReadinessResponse | null>(null);
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 120);
    return () => clearTimeout(timer);
  }, []);

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
    let mounted = true;

    const loadLiveData = async () => {
      try {
        if (mounted) setStatus("");
        const [readinessRes, appsRes, roadmapRes] = await Promise.all([
          api.get<ReadinessResponse>("/readiness-score"),
          api.get<{ applications: AppItem[] }>("/applications"),
          api.get<{ roadmap: RoadmapItem[] }>("/roadmap"),
        ]);

        if (!mounted) return;
        setReadinessData(readinessRes.data);
        setApplications(appsRes.data.applications || []);
        setRoadmap(roadmapRes.data.roadmap || []);
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

  const history = useMemo(() => readinessData?.history || [], [readinessData]);
  const currentScore = readinessData?.readiness?.score ?? 74;
  const scoreComponents = useMemo(
    () => readinessData?.readiness?.components || {},
    [readinessData]
  );

  const growthTrend = useMemo(() => {
    if (!history.length) return fallbackGrowth;
    const points = history.slice(-6).map((item, index) => ({
      label: item.createdAt ? monthLabel(item.createdAt) : `P${index + 1}`,
      primary: Math.max(0, Math.min(100, item.score)),
    }));
    return points.length ? points : fallbackGrowth;
  }, [history]);

  const scoreChange = useMemo(() => {
    if (history.length < 2) return 0;
    return history[history.length - 1].score - history[0].score;
  }, [history]);

  const shortlistRate = useMemo(() => {
    if (!applications.length) return 8;
    const shortlisted = applications.filter((item) => shortlistStatuses.has(item.status)).length;
    return Math.round((shortlisted / applications.length) * 100);
  }, [applications]);

  const interviewCount = useMemo(
    () => applications.filter((item) => item.status === "Interview").length,
    [applications]
  );

  const appsByMonth = useMemo(() => {
    if (!applications.length) return fallbackGrowth.map((item) => ({ ...item, secondary: Math.round(item.primary * 0.25) }));

    const buckets = new Map<string, { primary: number; secondary: number; date: Date }>();

    applications.forEach((app) => {
      const rawDate = app.appliedAt || app.createdAt;
      const date = rawDate ? new Date(rawDate) : new Date();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = buckets.get(key) || { primary: 0, secondary: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
      current.primary += 1;
      if (shortlistStatuses.has(app.status)) current.secondary += 1;
      buckets.set(key, current);
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6)
      .map((item) => ({
        label: item.date.toLocaleDateString(undefined, { month: "short" }),
        primary: item.primary,
        secondary: item.secondary,
      }));
  }, [applications]);

  const interviewTrend = useMemo(() => {
    const source = growthTrend.length ? growthTrend : fallbackGrowth;
    return source.map((item, idx) => ({
      label: `M${idx + 1}`,
      primary: toScoreOutOfTen(item.primary),
    }));
  }, [growthTrend]);

  const currentInterviewScore = interviewTrend[interviewTrend.length - 1]?.primary ?? 7.4;
  const initialInterviewScore = interviewTrend[0]?.primary ?? 5.8;

  const skillTrackerData: SkillProgress[] = useMemo(() => {
    const skillMatch = Math.max(0, Math.min(100, Math.round(scoreComponents.skillMatch ?? currentScore)));
    const systemDesign = Math.max(0, Math.min(100, Math.round(scoreComponents.projectRelevance ?? currentScore - 8)));
    const dsa = Math.max(0, Math.min(100, Math.round(scoreComponents.experienceScore ?? currentScore - 4)));
    const improvementBase = Math.max(2, Math.abs(Math.round(scoreChange / 2)));

    return [
      { skill: "React", progress: skillMatch, improvement: `+${improvementBase + 4}%` },
      { skill: "System Design", progress: systemDesign, improvement: `+${improvementBase + 2}%` },
      { skill: "DSA", progress: dsa, improvement: `+${improvementBase + 3}%` },
    ];
  }, [currentScore, scoreComponents, scoreChange]);

  const improvementByPeriod: Record<PeriodKey, ImprovementStat[]> = useMemo(() => {
    const divisor = period === "weekly" ? 4 : 2;
    const resumeChange = formatDelta(scoreChange / divisor);
    const skillMatchChange = formatDelta(((scoreComponents.skillMatch ?? currentScore) - 50) / (period === "weekly" ? 8 : 5));
    const interviewChange = formatDelta((currentInterviewScore - initialInterviewScore) * (period === "weekly" ? 4 : 7));
    const shortlistChange = formatDelta(shortlistRate / (period === "weekly" ? 5 : 2.5));

    return {
      weekly: [
        { label: "Resume Score Change", value: resumeChange, delta: "Week over week" },
        { label: "Skill Match Increase", value: skillMatchChange, delta: "Week over week" },
        { label: "Interview Performance", value: interviewChange, delta: "Week over week" },
        { label: "Shortlist Rate", value: shortlistChange, delta: "Week over week" },
      ],
      monthly: [
        { label: "Resume Score Change", value: formatDelta((scoreChange / divisor) * 2), delta: "Month over month" },
        { label: "Skill Match Increase", value: formatDelta(((scoreComponents.skillMatch ?? currentScore) - 50) / 2.5), delta: "Month over month" },
        { label: "Interview Performance", value: formatDelta((currentInterviewScore - initialInterviewScore) * 7), delta: "Month over month" },
        { label: "Shortlist Rate", value: formatDelta(shortlistRate / 2), delta: "Month over month" },
      ],
    };
  }, [currentScore, currentInterviewScore, initialInterviewScore, period, scoreChange, scoreComponents.skillMatch, shortlistRate]);

  const currentStats = improvementByPeriod[period];

  const roadmapProgress = Math.max(15, Math.min(95, Math.round(currentScore)));
  const totalRoadmapTasks = roadmap.length || 12;
  const completedTasks = Math.min(totalRoadmapTasks, Math.round((roadmapProgress / 100) * totalRoadmapTasks));
  const pendingTasks = Math.max(0, totalRoadmapTasks - completedTasks);

  const roadmapMilestones = [
    { label: "Resume Optimized", done: currentScore >= 60 },
    { label: "First Mock Completed", done: interviewCount > 0 },
    { label: "70+ Overall Score Achieved", done: currentScore >= 70 },
  ];

  const projectedScore = Math.min(100, Math.round(currentScore + Math.max(5, scoreChange / 3 || 6)));
  const fullRoadmapScore = Math.min(100, projectedScore + Math.max(4, Math.round(pendingTasks / 2)));

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

        <section className="grid gap-4 xl:grid-cols-2">
          <ProgressCard title="Weekly / Monthly Improvements">
            <div className="mb-4 inline-flex rounded-xl border border-slate-700 bg-slate-900/80 p-1">
              {(["weekly", "monthly"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPeriod(tab)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
                    period === tab
                      ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/35"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentStats.map((item) => (
                <StatItem key={item.label} label={item.label} value={item.value} delta={item.delta} icon={TrendingUp} />
              ))}
            </div>
          </ProgressCard>

          <ProgressCard title="Skill Development Tracker" subtitle="Track depth-building momentum across key domains">
            <div className="space-y-4">
              {skillTrackerData.map((item) => (
                <div key={item.skill} className="rounded-xl border border-slate-700/65 bg-slate-900/60 p-3.5 transition duration-300 hover:border-emerald-300/25">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-100">{item.skill}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-200">
                      <ChevronUp className="h-4 w-4" />
                      {item.improvement}
                    </span>
                  </div>
                  <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/85">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-400 via-cyan-400 to-amber-300 shadow-[0_0_26px_rgba(52,211,153,0.45)] transition-all duration-700"
                      style={{ width: animateBars ? `${item.progress}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ProgressCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_1.3fr]">
          <ProgressCard title="Interview Performance Tracker" subtitle="Consistency in mocks is pushing your confidence curve upward">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatItem label="Total Mocks Taken" value={String(interviewCount)} delta="Live from tracker" icon={ClipboardCheck} />
              <StatItem label="Avg Score Trend" value={`${initialInterviewScore} → ${currentInterviewScore}`} delta={`${currentInterviewScore - initialInterviewScore >= 0 ? "+" : ""}${(currentInterviewScore - initialInterviewScore).toFixed(1)} jump`} icon={TrendingUp} />
              <StatItem label="Communication Score" value={String(toScoreOutOfTen(scoreComponents.skillMatch ?? 76))} delta={formatDelta(((scoreComponents.skillMatch ?? 76) - 60) / 4)} />
              <StatItem label="Technical Depth Score" value={String(toScoreOutOfTen(scoreComponents.experienceScore ?? 72))} delta={formatDelta(((scoreComponents.experienceScore ?? 72) - 58) / 4)} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-700/65 bg-slate-900/60 p-3">
              <TrendChart data={interviewTrend} variant="mini" height={140} />
            </div>
          </ProgressCard>

          <ProgressCard title="Applications Analytics" subtitle="Applications vs shortlist conversion over recent months">
            <TrendChart data={appsByMonth} variant="dual" height={240} />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatItem label="Success Rate" value={`${shortlistRate}%`} delta={formatDelta(shortlistRate / 6)} icon={Rocket} />
              <StatItem
                label="Monthly Avg Applications"
                value={String(Math.round(appsByMonth.reduce((sum, item) => sum + item.primary, 0) / Math.max(1, appsByMonth.length)))}
                delta="Live"
              />
              <StatItem
                label="Monthly Avg Shortlists"
                value={String(Math.round(appsByMonth.reduce((sum, item) => sum + (item.secondary || 0), 0) / Math.max(1, appsByMonth.length)))}
                delta="Live"
              />
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
                <StatItem label="Pending Tasks" value={String(pendingTasks)} delta="Focus next" />
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

          <ProgressCard title="Momentum Insight" subtitle="If you sustain this execution pace, interview readiness compounds quickly.">
            <div className="rounded-xl border border-slate-700/65 bg-slate-900/65 p-4">
              <p className="text-sm leading-relaxed text-slate-300">
                Your profile currently improves faster in interview and project-readiness dimensions than resume depth. Prioritize
                one additional project shipment this month to unlock the projected curve.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-slate-700/60 bg-slate-950/75 p-2 text-center">
                  <p className="text-xs text-slate-400">Current</p>
                  <p className="text-lg font-semibold text-slate-100">{currentScore}</p>
                </div>
                <div className="rounded-lg border border-emerald-300/35 bg-emerald-500/10 p-2 text-center">
                  <p className="text-xs text-emerald-200">Projected</p>
                  <p className="text-lg font-semibold text-emerald-100">{projectedScore}</p>
                </div>
                <div className="rounded-lg border border-amber-300/35 bg-amber-500/10 p-2 text-center">
                  <p className="text-xs text-amber-200">Full Plan</p>
                  <p className="text-lg font-semibold text-amber-100">{fullRoadmapScore}</p>
                </div>
              </div>
            </div>
          </ProgressCard>
        </section>

        <ProgressTrackerCards />
      </AppShell>
    </AuthGuard>
  );
}
