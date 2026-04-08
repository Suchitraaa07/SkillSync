"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  CircleAlert,
  Code2,
  GitBranch,
  Globe,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";
import { computeProfileSignals, type ConnectedProfiles } from "@/lib/profileIntelligence";

type ProfileIntelligenceResponse = {
  connectedCount: number;
  crossPlatform: {
    insights: string[];
    strengths: {
      linkedin: number;
      github: number;
      leetcode: number;
    };
  };
  benchmarking: {
    topPercentile: number | null;
    dsaPercentile: number | null;
    shortlistChance: number | null;
  };
  providers: {
    linkedin: {
      message: string;
      username?: string;
      connected?: boolean;
      stats?: null;
    };
    github: {
      message: string;
      username?: string;
      connected?: boolean;
      stats?: {
        followers: number;
        publicRepos: number;
        totalStars: number;
      } | null;
    };
    leetcode: {
      message: string;
      username?: string;
      connected?: boolean;
      stats?: {
        ranking: number;
        reputation: number;
        solved: number;
        mediumSolved: number;
      } | null;
    };
  };
  githubGrowth?: {
    score: number;
    totalRepositories: number;
    totalCommits30d: number;
    longestStreakDays: number;
    profileStrengthScore: number;
    momentumPerDay: number;
    dailySeries: { date: string; count: number }[];
  };
  leetcodeProgress?: {
    score: number;
    totalProblemsSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    contestRating: number;
    currentStreakDays: number;
    momentumPerDay: number;
    dailySeries: { date: string; count: number }[];
  };
  generatedAt?: string;
};

type ReadinessResponse = {
  readiness: {
    score: number;
    category: string;
    explanation: string;
    components: {
      skillMatch: number;
      projectRelevance: number;
      experienceScore: number;
    };
  };
  history: { score: number; category: string; createdAt: string }[];
  gamification: { level: string; xp: number };
};

type AnalyzeReadinessResponse = {
  score: number;
  readinessLevel: string;
  matchedSkills: string[];
  missingSkills: string[];
  totalGaps: number;
};

const ROLE_OPTIONS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "AI Engineer",
];

export default function DashboardPage() {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [roleFit, setRoleFit] = useState<{ role: string; fit: number }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [roleTitle, setRoleTitle] = useState("Full Stack Developer");
  const [status, setStatus] = useState("");
  const [readinessAnalysis, setReadinessAnalysis] = useState<AnalyzeReadinessResponse | null>(null);
  const [isAnalyzingReadiness, setIsAnalyzingReadiness] = useState(false);
  const [profiles, setProfiles] = useState<ConnectedProfiles>({
    linkedin: "",
    github: "",
    leetcode: "",
  });
  const [profileIntel, setProfileIntel] = useState<ProfileIntelligenceResponse | null>(null);

  const runReadinessAnalysis = async (rawResumeText: string, selectedRole: string) => {
    if (!rawResumeText.trim() || !selectedRole) return;

    try {
      setIsAnalyzingReadiness(true);
      const response = await api.post<AnalyzeReadinessResponse>("/api/analyze-readiness", {
        resumeText: rawResumeText,
        selectedRole,
      });
      setReadinessAnalysis(response.data);
    } catch (error: any) {
      setReadinessAnalysis(null);
      setStatus(error?.response?.data?.message || "Readiness analysis failed");
    } finally {
      setIsAnalyzingReadiness(false);
    }
  };

  const loadData = async () => {
    try {
      const [readinessRes, fitRes] = await Promise.all([
        api.get<ReadinessResponse>("/readiness-score"),
        api.get<{ roleFit: { role: string; fit: number }[] }>("/fit-heatmap"),
      ]);
      setReadiness(readinessRes.data);
      setRoleFit(fitRes.data.roleFit);
    } catch {
      setStatus("Upload resume and analyze a job to see dashboard insights.");
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const storedText = localStorage.getItem("skillsync_resume_text") || "";
      setResumeText(storedText);
      const storedProfiles = localStorage.getItem("skillsync_profiles");
      if (storedProfiles) {
        try {
          const parsed = JSON.parse(storedProfiles);
          setProfiles({
            linkedin: parsed.linkedin || "",
            github: parsed.github || "",
            leetcode: parsed.leetcode || "",
          });
        } catch {
          // Ignore malformed local profile payload.
        }
      }

      const loadProfileIntel = async () => {
        try {
          const response = await api.get<ProfileIntelligenceResponse>("/api/auth/profile-intelligence");
          setProfileIntel(response.data);
        } catch {
          setProfileIntel(null);
        }
      };

      loadProfileIntel();
      if (storedText) {
        runReadinessAnalysis(storedText, roleTitle);
      }

      const onProfilesUpdated = () => {
        const latest = localStorage.getItem("skillsync_profiles");
        if (!latest) {
          setProfiles({ linkedin: "", github: "", leetcode: "" });
          return;
        }
        try {
          const parsed = JSON.parse(latest);
          setProfiles({
            linkedin: parsed.linkedin || "",
            github: parsed.github || "",
            leetcode: parsed.leetcode || "",
          });
        } catch {
          setProfiles({ linkedin: "", github: "", leetcode: "" });
        }

        api
          .get<ProfileIntelligenceResponse>("/api/auth/profile-intelligence")
          .then((response) => setProfileIntel(response.data))
          .catch(() => setProfileIntel(null));
      };

      window.addEventListener("skillsync:profiles-updated", onProfilesUpdated);
      return () => window.removeEventListener("skillsync:profiles-updated", onProfilesUpdated);
    }
  }, []);

  useEffect(() => {
    if (resumeText.trim()) {
      runReadinessAnalysis(resumeText, roleTitle);
    }
  }, [roleTitle]);

  const onUploadResume = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setStatus("Analyzing resume...");
      await api.post("/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const textFormData = new FormData();
      textFormData.append("resume", file);
      const textRes = await api.post<{ text: string }>("/pdf/upload", textFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const extractedText = textRes.data?.text || "";
      setResumeText(extractedText);
      if (typeof window !== "undefined") {
        localStorage.setItem("skillsync_resume_text", extractedText);
      }

      await runReadinessAnalysis(extractedText, roleTitle);
      setStatus("Resume analyzed. Skill gap and readiness score updated.");
    } catch (error: any) {
      setStatus(error?.response?.data?.message || "Resume upload failed");
    }
  };

  const onAnalyzeJob = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setStatus("Running job analysis...");
      await api.post("/analyze-job", { description, url, roleTitle });
      setStatus("Job analysis complete.");
      await loadData();
    } catch (error: any) {
      setStatus(error?.response?.data?.message || "Job analysis failed");
    }
  };

  const score = readiness?.readiness.score ?? 0;
  const skillMatch = readiness?.readiness.components.skillMatch ?? 0;
  const projectRelevance = readiness?.readiness.components.projectRelevance ?? 0;
  const experienceScore = readiness?.readiness.components.experienceScore ?? 0;
  const missingSkillEstimate = Math.max(0, Math.round((100 - skillMatch) / 12));
  const weeksToReady = Math.max(4, Math.ceil((78 - score) / 2) || 4);
  const monthlyImprovement = Math.max(6, Math.round((projectRelevance + experienceScore) / 5));
  const profileSignals = useMemo(
    () => computeProfileSignals(profiles, score || readinessAnalysis?.score || 0),
    [profiles, score, readinessAnalysis?.score]
  );
  const displayInsights = profileIntel?.crossPlatform?.insights?.length
    ? profileIntel.crossPlatform.insights
    : profileSignals.insights;
  const connectedCount = profileIntel?.connectedCount ?? profileSignals.connectedCount;
  const topPercentile = profileIntel?.benchmarking?.topPercentile ?? null;
  const dsaPercentile = profileIntel?.benchmarking?.dsaPercentile ?? null;
  const shortlistChance = profileIntel?.benchmarking?.shortlistChance ?? null;
  const strengths = profileIntel?.crossPlatform?.strengths ?? profileSignals.strengths;
  const githubStats = profileIntel?.providers?.github?.stats;
  const leetcodeStats = profileIntel?.providers?.leetcode?.stats;
  const formatMetric = (value: number | null | undefined) =>
    value === null || value === undefined ? "-" : Number(value).toLocaleString("en-US");
  const providerGithubMessage = profileIntel?.providers?.github?.message || "GitHub status unavailable";
  const providerLeetcodeMessage = profileIntel?.providers?.leetcode?.message || "LeetCode status unavailable";
  const providerLinkedinMessage = profileIntel?.providers?.linkedin?.message || "LinkedIn status unavailable";

  return (
    <AuthGuard>
      <AppShell>
        <section className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
            <Sparkles className="h-4 w-4" />
            Highlight Features
          </p>

          <div className="grid items-start gap-2 xl:grid-cols-[1.28fr_0.92fr]">
            <Card className="overflow-hidden border-violet-400/20 bg-[linear-gradient(140deg,rgba(46,24,92,0.82),rgba(16,20,44,0.97)_45%,rgba(7,12,24,0.98))] shadow-[0_30px_80px_rgba(18,18,38,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/35 hover:shadow-[0_38px_95px_rgba(76,29,149,0.32)]">
              <div className="relative">
                <div className="pointer-events-none absolute -left-12 top-6 h-40 w-40 rounded-full bg-violet-500/18 blur-3xl" />
                <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-10 h-36 w-36 rounded-full bg-fuchsia-500/10 blur-3xl" />

                <div className="grid gap-5">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full border border-violet-300/35 bg-violet-400/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
                            New
                          </span>
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                            {connectedCount}/3 connected
                          </span>
                        </div>
                        <p className="mb-1 max-w-[8ch] text-[clamp(2.2rem,2.4vw,3.3rem)] font-semibold leading-[1.02] text-white">
                          Cross-Platform Intelligence
                        </p>
                        <p className="text-sm uppercase tracking-[0.16em] text-fuchsia-200/90">Signal Quality Panel</p>
                      </div>
                    </div>

                    <p className="mt-3 max-w-[32rem] text-[1.05rem] leading-8 text-slate-300">
                      Your connected profiles surface in one sharper view, with the same live data and a cleaner signal story.
                    </p>

                    <div className="mt-3 grid gap-2">
                      {(displayInsights.length ? displayInsights : ["Connect profiles to unlock deeper cross-platform comparisons."])
                        .slice(0, 3)
                        .map((insight, index) => (
                          <div
                            key={`${insight}-${index}`}
                            className="rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(18,22,42,0.92),rgba(31,35,64,0.76))] px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-[0_18px_40px_rgba(6,8,20,0.32)]"
                          >
                            {insight}
                          </div>
                        ))}
                    </div>

                    <div className="mt-4 grid gap-2 rounded-[1.6rem] border border-white/8 bg-slate-950/55 p-4 backdrop-blur">
                      <SignalRow label="LinkedIn presence" value={strengths.linkedin} icon={Globe} tone="blue" />
                      <SignalRow label="GitHub proof of work" value={strengths.github} icon={GitBranch} tone="emerald" />
                      <SignalRow label="LeetCode consistency" value={strengths.leetcode} icon={Code2} tone="amber" />
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(9,13,27,0.88))] p-3 shadow-[0_20px_45px_rgba(6,8,20,0.25)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">GitHub Metrics</p>
                        <p className="mt-1 text-base text-slate-100">Public Repos: {formatMetric(githubStats?.publicRepos)}</p>
                        <p className="text-base text-slate-300">Stars: {formatMetric(githubStats?.totalStars)}</p>
                        <p className="text-base text-slate-300">Followers: {formatMetric(githubStats?.followers)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(9,13,27,0.88))] p-3 shadow-[0_20px_45px_rgba(6,8,20,0.25)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">LeetCode Metrics</p>
                        <p className="mt-1 text-base text-slate-100">Solved: {formatMetric(leetcodeStats?.solved)}</p>
                        <p className="text-base text-slate-300">Medium: {formatMetric(leetcodeStats?.mediumSolved)}</p>
                        <p className="text-base text-slate-300">Ranking: {formatMetric(leetcodeStats?.ranking)}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/8 bg-slate-950/45 p-3 text-sm text-slate-300 backdrop-blur">
                      <p className="font-semibold uppercase tracking-[0.13em] text-slate-400">Provider Status</p>
                      <p className="mt-1">GitHub: {providerGithubMessage}</p>
                      <p>LeetCode: {providerLeetcodeMessage}</p>
                      <p>LinkedIn: {providerLinkedinMessage}</p>
                    </div>
                  </div>

                </div>
              </div>
            </Card>

            <div className="grid gap-2">
              <Card className="overflow-hidden border-amber-300/18 bg-[linear-gradient(140deg,rgba(53,34,22,0.82),rgba(25,20,32,0.95)_40%,rgba(10,14,28,0.98))] shadow-[0_30px_80px_rgba(18,18,38,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/35 hover:shadow-[0_38px_95px_rgba(180,83,9,0.26)]">
                <div className="relative">
                  <div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full bg-amber-400/12 blur-3xl" />
                  <div className="pointer-events-none absolute right-6 top-8 flex items-end gap-3 opacity-35">
                    {[45, 76, 108, 140].map((height, index) => (
                      <div
                        key={height}
                        className={`w-6 rounded-t-2xl bg-gradient-to-t ${index === 2 ? "from-violet-500 to-indigo-300" : "from-amber-700/60 to-amber-300/80"}`}
                        style={{ height }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full border border-fuchsia-300/35 bg-fuchsia-400/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100">
                          New
                        </span>
                      </div>
                      <p className="mb-1 text-3xl font-semibold text-white">Smart Peer Benchmarking</p>
                    </div>
                    <ChartNoAxesColumn className="h-5 w-5 text-amber-200" />
                  </div>
                  <p className="text-base leading-relaxed text-slate-300">
                    Benchmark view generated from your real profile metrics + readiness history.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <KpiChip
                      label="Peer Rank"
                      value={topPercentile !== null ? `Top ${topPercentile}%` : "Pending"}
                      tone="amber"
                    />
                    <KpiChip
                      label="DSA Cohort"
                      value={dsaPercentile ? `Top ${dsaPercentile}%` : "Pending"}
                      tone="indigo"
                    />
                    <KpiChip
                      label="Shortlist Chance"
                      value={shortlistChance !== null ? `${shortlistChance}%` : "Pending"}
                      tone="cyan"
                    />
                  </div>

                  <div className="mt-2 space-y-1.5 rounded-[1.6rem] border border-white/8 bg-slate-950/50 p-3 backdrop-blur">
                    <BenchRow
                      label="Profile competitiveness"
                      value={topPercentile !== null ? 100 - topPercentile : null}
                    />
                    <BenchRow
                      label="Interview readiness"
                      value={dsaPercentile !== null ? 100 - dsaPercentile : null}
                    />
                    <BenchRow label="Recruiter shortlist probability" value={shortlistChance} />
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {profileIntel?.generatedAt
                      ? `Last refreshed: ${new Date(profileIntel.generatedAt).toLocaleString()}`
                      : "Connect profiles to unlock live peer benchmarking refresh."}
                  </p>

                  <div className="mt-2 rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-2 text-sm leading-relaxed text-slate-200 backdrop-blur">
                    {dsaPercentile !== null
                      ? "Your coding profile is benchmarked with role-aligned internship peers."
                      : "Add a valid LeetCode profile URL to enable DSA percentile benchmarking."}
                  </div>
                </div>
              </Card>

              <OrbitInsightModel />
            </div>
          </div>
        </section>

        <section className="grid gap-2 xl:grid-cols-2">
          <Card className="overflow-hidden border-emerald-300/15 bg-[linear-gradient(180deg,rgba(9,18,30,0.94),rgba(8,14,28,0.98))] shadow-[0_24px_55px_rgba(5,9,20,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:shadow-[0_34px_80px_rgba(16,185,129,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold text-white">GitHub Growth</p>
                <p className="text-base text-slate-400">Repository & Contribution Activity</p>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                Live
              </span>
            </div>

            <div className="mt-2 grid gap-2 lg:grid-cols-[260px_1fr]">
              <ScoreDonut score={Math.round(profileIntel?.githubGrowth?.score || 0)} color="emerald" />
              <TrendLinePanel
                series={profileIntel?.githubGrowth?.dailySeries || []}
                tone="emerald"
                momentum={profileIntel?.githubGrowth?.momentumPerDay || 0}
                metricLabel="commits/day"
              />
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <MiniStat label="Public Repositories" value={String(profileIntel?.githubGrowth?.totalRepositories || 0)} />
              <MiniStat label="Total Commits (Last 30 Days)" value={String(profileIntel?.githubGrowth?.totalCommits30d || 0)} />
              <MiniStat label="Longest Streak" value={`${profileIntel?.githubGrowth?.longestStreakDays || 0} days`} />
              <MiniStat label="Profile Strength Score" value={`${Math.round(profileIntel?.githubGrowth?.profileStrengthScore || 0)}/100`} />
            </div>
          </Card>

          <Card className="overflow-hidden border-cyan-300/15 bg-[linear-gradient(180deg,rgba(9,18,30,0.94),rgba(8,14,28,0.98))] shadow-[0_24px_55px_rgba(5,9,20,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_34px_80px_rgba(34,211,238,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold text-white">LeetCode Progress</p>
                <p className="text-base text-slate-400">Problem Solving Consistency</p>
              </div>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                Live
              </span>
            </div>

            <div className="mt-2 grid gap-2 lg:grid-cols-[260px_1fr]">
              <ScoreDonut score={Math.round(profileIntel?.leetcodeProgress?.score || 0)} color="amber" />
              <TrendLinePanel
                series={profileIntel?.leetcodeProgress?.dailySeries || []}
                tone="cyan"
                momentum={profileIntel?.leetcodeProgress?.momentumPerDay || 0}
                metricLabel="problems/day"
              />
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <MiniStat label="Total Problems Solved" value={String(profileIntel?.leetcodeProgress?.totalProblemsSolved || 0)} />
              <MiniStat
                label="Easy / Medium / Hard"
                value={`${profileIntel?.leetcodeProgress?.easySolved || 0} / ${profileIntel?.leetcodeProgress?.mediumSolved || 0} / ${profileIntel?.leetcodeProgress?.hardSolved || 0}`}
              />
              <MiniStat label="Contest Rating" value={String(profileIntel?.leetcodeProgress?.contestRating || 0)} />
              <MiniStat label="Current Streak" value={`${profileIntel?.leetcodeProgress?.currentStreakDays || 0} days`} />
            </div>
          </Card>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Core Features</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="group border-blue-400/25 bg-[linear-gradient(180deg,rgba(23,56,118,0.4),rgba(10,14,28,0.94))] transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300/40 hover:shadow-[0_28px_70px_rgba(59,130,246,0.22)]">
              <FeatureTile title="Resume Analysis" desc="Analyze ATS score and suggest improvements" icon={BookOpen} href="/resume-optimizer" action="Analyze" accent="blue" />
            </Card>
            <Card className="group border-emerald-400/25 bg-[linear-gradient(180deg,rgba(6,78,59,0.35),rgba(10,14,28,0.94))] transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/40 hover:shadow-[0_28px_70px_rgba(16,185,129,0.22)]">
              <FeatureTile title="Job Role Comparison" desc="Compare profile against role requirements" icon={BriefcaseBusiness} href="/job-role-comparison" action="Compare" accent="emerald" />
            </Card>
            <Card className="group border-amber-400/25 bg-[linear-gradient(180deg,rgba(120,53,15,0.32),rgba(10,14,28,0.94))] transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-300/40 hover:shadow-[0_28px_70px_rgba(245,158,11,0.22)]">
              <FeatureTile title="Skill Gap Detection" desc="Identify missing skills before applying" icon={CircleAlert} href="/skill-gap" action="Detect Gaps" accent="amber" />
            </Card>
            <Card className="group border-violet-400/25 bg-[linear-gradient(180deg,rgba(91,33,182,0.28),rgba(10,14,28,0.94))] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300/40 hover:shadow-[0_28px_70px_rgba(139,92,246,0.22)]">
              <FeatureTile title="Learning Roadmap" desc="Get a weekly path to become internship-ready" icon={Target} href="/roadmap" action="View Roadmap" accent="violet" />
            </Card>
            <Card className="group border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(131,24,67,0.28),rgba(10,14,28,0.94))] transition-all duration-300 hover:-translate-y-1.5 hover:border-fuchsia-300/40 hover:shadow-[0_28px_70px_rgba(217,70,239,0.22)]">
              <FeatureTile title="Readiness Score" desc="Track your overall internship readiness" icon={Shield} href="/readiness-analysis" action="See Score" accent="fuchsia" />
            </Card>
          </div>
        </section>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Overall Score" value={`${score}%`} hint={readiness?.readiness.category || "No score yet"} accent="emerald" />
          <StatTile label="Skill Gaps" value={`${missingSkillEstimate}`} hint="High priority" accent="amber" />
          <StatTile label="To Internship Ready" value={`${weeksToReady} weeks`} hint="Keep going" accent="violet" />
          <StatTile label="Improvement" value={`+${monthlyImprovement}%`} hint="This month" accent="cyan" />
        </div>

        {status ? <p className="rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-base text-slate-200">{status}</p> : null}
      </AppShell>
    </AuthGuard>
  );
}

function SignalRow({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: "blue" | "emerald" | "amber";
}) {
  const toneClasses = {
    blue: "from-sky-400 via-cyan-300 to-indigo-400",
    emerald: "from-emerald-400 via-teal-300 to-green-400",
    amber: "from-amber-400 via-yellow-300 to-orange-400",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900/90">
        <div className={`h-full bg-gradient-to-r ${toneClasses[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function KpiChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "indigo" | "cyan";
}) {
  const styles = {
    amber: "border-amber-300/25 bg-amber-500/12 text-amber-100 shadow-[0_18px_35px_rgba(245,158,11,0.08)]",
    indigo: "border-indigo-300/25 bg-indigo-500/12 text-indigo-100 shadow-[0_18px_35px_rgba(99,102,241,0.08)]",
    cyan: "border-cyan-300/25 bg-cyan-500/12 text-cyan-100 shadow-[0_18px_35px_rgba(34,211,238,0.08)]",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_18px_40px_rgba(15,23,42,0.35)] ${styles[tone]}`}>
      <p className="text-xs uppercase tracking-[0.12em] opacity-85">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function BenchRow({ label, value }: { label: string; value: number | null }) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value === null ? "Pending" : `${Math.round(width)}%`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900/90">
        <div className="h-full bg-gradient-to-r from-amber-300 via-fuchsia-400 to-indigo-400" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-3.5 shadow-[0_16px_35px_rgba(2,6,23,0.26)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_24px_48px_rgba(15,23,42,0.36)]">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-[2rem] font-semibold leading-tight text-slate-100">{value}</p>
    </div>
  );
}

function ScoreDonut({ score, color }: { score: number; color: "emerald" | "amber" }) {
  const safe = Math.max(0, Math.min(100, score));
  const ringColor = color === "emerald" ? "rgba(52,211,153,0.95)" : "rgba(245,158,11,0.95)";
  const textColor = color === "emerald" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="grid place-items-center rounded-[1.7rem] border border-white/8 bg-slate-950/55 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur">
      <div className="relative grid h-[196px] w-[196px] place-items-center rounded-full border border-slate-700/90 bg-slate-950 shadow-[0_0_48px_rgba(99,102,241,0.14)]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, ${ringColor} ${safe * 3.6}deg, rgba(51,65,85,0.5) 0deg)`,
          }}
        />
        <div className="relative z-10 grid h-[146px] w-[146px] place-items-center rounded-full bg-slate-950 text-center">
          <p className={`text-5xl font-semibold ${textColor}`}>{safe}</p>
        <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Out of 100</p>
        </div>
      </div>
    </div>
  );
}

function TrendLinePanel({
  series,
  tone,
  momentum,
  metricLabel,
}: {
  series: { date: string; count: number }[];
  tone: "emerald" | "cyan";
  momentum: number;
  metricLabel: string;
}) {
  const formatDateLabel = (dateStr: string) => {
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const maxCount = Math.max(1, ...series.map((s) => s.count || 0));
  const normalized = series.map((s) => Math.round((s.count / maxCount) * 100));

  const width = 320;
  const height = 110;
  const left = 6;
  const right = 6;
  const top = 8;
  const bottom = 10;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const points = normalized.map((value, idx) => {
    const x = left + (idx / Math.max(1, normalized.length - 1)) * plotW;
    const y = top + ((100 - value) / 100) * plotH;
    return { x, y, raw: series[idx]?.count || 0, idx };
  });

  const lineColor = tone === "emerald" ? "#34d399" : "#38bdf8";
  const pillClass =
    tone === "emerald"
      ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
      : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100";
  const gradientId = tone === "emerald" ? "spark-emerald" : "spark-cyan";
  const metricWord = metricLabel.includes("commit") ? "commits" : "problems";

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hasAnyActivity = series.some((s) => s.count > 0);

  const buildPath = (pts: Array<{ x: number; y: number }>) => {
    if (!pts.length) return "";
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  };

  const linePath = buildPath(points);
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x.toFixed(2)},${(height - bottom).toFixed(2)} L${points[0].x.toFixed(2)},${(height - bottom).toFixed(2)} Z`
    : "";

  const firstLabel = series.length ? formatDateLabel(series[0].date) : "";
  const midLabel = series.length ? formatDateLabel(series[Math.floor((series.length - 1) / 2)].date) : "";
  const lastLabel = series.length ? formatDateLabel(series[series.length - 1].date) : "";

  return (
    <div className="rounded-[1.7rem] border border-white/8 bg-slate-950/50 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.26)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Last 30 days</p>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${pillClass}`}>
          {`${momentum >= 0 ? "+" : ""}${momentum} ${metricLabel}`}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#071127] p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[112px] w-full"
          preserveAspectRatio="none"
          onMouseMove={(event) => {
            if (!points.length) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * width;
            let nearest = 0;
            let bestDistance = Number.POSITIVE_INFINITY;
            for (let i = 0; i < points.length; i += 1) {
              const distance = Math.abs(points[i].x - x);
              if (distance < bestDistance) {
                bestDistance = distance;
                nearest = i;
              }
            }
            setHoverIndex(nearest);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone === "emerald" ? "rgba(52,211,153,0.30)" : "rgba(56,189,248,0.30)"} />
              <stop offset="100%" stopColor={tone === "emerald" ? "rgba(52,211,153,0.00)" : "rgba(56,189,248,0.00)"} />
            </linearGradient>
          </defs>

          <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="rgba(148,163,184,0.25)" strokeWidth="1" />

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
          {linePath ? <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" /> : null}
          {activePoint ? <circle cx={activePoint.x} cy={activePoint.y} r="3.5" fill="#f8fafc" /> : null}
        </svg>

        <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-500">
          <span>{firstLabel}</span>
          <span>{midLabel}</span>
          <span>{lastLabel}</span>
        </div>

        {activePoint && hasAnyActivity ? (
          <div
            className="pointer-events-none absolute rounded-lg border border-indigo-400/30 bg-slate-900/95 px-2.5 py-1.5 text-xs text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            style={{
              left: `${Math.max(8, Math.min(78, ((activePoint.x - left) / Math.max(1, plotW)) * 100 - 6))}%`,
              top: `${Math.max(8, Math.min(70, ((activePoint.y - top) / Math.max(1, plotH)) * 100 - 10))}%`,
            }}
          >
            <p>{formatDateLabel(series[activePoint.idx]?.date || "")}</p>
            <p>{metricWord}: {activePoint.raw}</p>
          </div>
        ) : null}

        {!hasAnyActivity ? (
          <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-[10px] text-slate-300">
            No activity in last 30 days
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OrbitInsightModel() {
  const nodes = [
    {
      key: "github",
      style: { top: "12%", left: "14%" },
      shellClass: "border-sky-300/35 text-white shadow-[0_0_26px_rgba(96,165,250,0.22)]",
      content: <GithubGlyph />,
    },
    {
      key: "leetcode",
      style: { top: "15%", right: "13%" },
      shellClass: "border-amber-300/35 text-amber-100 shadow-[0_0_26px_rgba(251,191,36,0.18)]",
      content: <LeetCodeGlyph />,
    },
    {
      key: "kaggle",
      style: { bottom: "16%", left: "16%" },
      shellClass: "border-cyan-300/35 text-cyan-100 shadow-[0_0_26px_rgba(34,211,238,0.22)]",
      content: <span className="text-[1.7rem] font-medium lowercase leading-none">k</span>,
    },
    {
      key: "linkedin",
      style: { bottom: "14%", right: "12%" },
      shellClass: "border-violet-300/35 text-violet-100 shadow-[0_0_26px_rgba(167,139,250,0.2)]",
      content: <span className="text-[1.45rem] font-semibold lowercase leading-none">in</span>,
    },
  ] as const;

  return (
    <Card className="overflow-hidden border-violet-400/16 bg-[linear-gradient(180deg,rgba(14,18,38,0.96),rgba(8,12,24,0.98))] px-2 py-3 shadow-[0_24px_60px_rgba(9,12,28,0.42)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:shadow-[0_34px_82px_rgba(76,29,149,0.24)]">
      <div className="relative mx-auto min-h-[230px] max-w-[280px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(139,92,246,0.22),transparent_18%),radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_26%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_28%)]" />

        <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="orbit-link" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96,165,250,0.18)" />
              <stop offset="50%" stopColor="rgba(167,139,250,0.30)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.18)" />
            </linearGradient>
          </defs>
          <path d="M86 92 C128 122, 192 122, 234 92" stroke="url(#orbit-link)" strokeWidth="2" fill="none" />
          <path d="M96 226 C136 204, 184 204, 224 226" stroke="url(#orbit-link)" strokeWidth="2" fill="none" />
          <path d="M90 94 C116 146, 116 178, 100 216" stroke="url(#orbit-link)" strokeWidth="2" fill="none" />
          <path d="M230 92 C204 144, 204 178, 220 216" stroke="url(#orbit-link)" strokeWidth="2" fill="none" />
          <path d="M100 92 C144 156, 178 156, 220 92" stroke="rgba(111,124,255,0.18)" strokeWidth="2" fill="none" />
          <path d="M106 222 C144 190, 178 190, 214 222" stroke="rgba(111,124,255,0.16)" strokeWidth="2" fill="none" />
          <circle cx="126" cy="74" r="1.7" fill="rgba(96,165,250,0.8)" />
          <circle cx="226" cy="84" r="1.7" fill="rgba(251,191,36,0.8)" />
          <circle cx="100" cy="232" r="1.7" fill="rgba(34,211,238,0.8)" />
          <circle cx="228" cy="230" r="1.7" fill="rgba(167,139,250,0.8)" />
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[10rem] w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10 animate-spin [animation-duration:18s]" />
        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[7.5rem] w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 animate-spin [animation-direction:reverse] [animation-duration:13s]" />
        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[11rem] w-[6.8rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/10 animate-spin [animation-duration:22s]" />

        <div className="absolute left-1/2 top-[48%] z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-violet-300/25 bg-[radial-gradient(circle,rgba(167,139,250,0.52),rgba(77,44,154,0.42)_58%,rgba(10,12,26,0.24))] shadow-[0_0_40px_rgba(139,92,246,0.5)]">
          <div className="absolute inset-3 rounded-full border border-violet-200/16 animate-pulse" />
          <BrainGlyph />
        </div>

        {nodes.map((node) => (
          <div key={node.key} className="absolute z-20" style={node.style}>
            <div className={`flex h-[3.55rem] w-[3.55rem] items-center justify-center rounded-full border ${node.shellClass}`}>
              {node.content}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GithubGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden="true">
      <path
        d="M12 3.4c-4.7 0-8.5 3.8-8.5 8.5 0 3.8 2.5 7.1 6 8.2.4.1.5-.2.5-.4v-1.4c-2.4.5-2.9-1-2.9-1-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.3-1.9-.2-3.8-1-3.8-4.2 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.4.9A8.1 8.1 0 0 1 12 7.6c.7 0 1.4.1 2 .3 1.7-1.1 2.4-.9 2.4-.9.5 1.1.2 2 .1 2.2.6.6.9 1.4.9 2.3 0 3.2-1.9 3.9-3.8 4.2.3.3.6.8.6 1.6v2.3c0 .2.1.5.5.4 3.5-1.2 6-4.4 6-8.2 0-4.7-3.8-8.5-8.5-8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LeetCodeGlyph() {
  return (
    <svg viewBox="0 0 28 28" className="h-9 w-9" aria-hidden="true">
      <path
        d="M17.6 4.2 10.1 11.7 17.6 19.2"
        fill="none"
        stroke="#0b0b0d"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.6 4.2 22.8 9.4"
        fill="none"
        stroke="#f6a623"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.6 19.2 22.8 14"
        fill="none"
        stroke="#f6a623"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 14h8"
        fill="none"
        stroke="#c7c7cc"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrainGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-10 w-10" aria-hidden="true">
      <path
        d="M13.4 6.5c-2.4 0-4.4 1.8-4.4 4.2 0 .3 0 .7.1 1-1.5.5-2.6 1.9-2.6 3.6 0 1.8 1.2 3.3 2.9 3.7v.3c0 2.1 1.7 3.8 3.8 3.8 1.3 0 2.5-.7 3.2-1.7.7 1 1.9 1.7 3.2 1.7 2.1 0 3.8-1.7 3.8-3.8V19c1.7-.4 2.9-1.9 2.9-3.7 0-1.7-1.1-3.1-2.6-3.6.1-.3.1-.7.1-1 0-2.4-2-4.2-4.4-4.2-1.4 0-2.6.6-3.4 1.7-.8-1.1-2-1.7-3.4-1.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 8.1v15.6M12.4 10.1c1 0 1.8.8 1.8 1.8m0 4.2c-1 0-1.8.8-1.8 1.8m7.2-7.8c-1 0-1.8.8-1.8 1.8m0 4.2c1 0 1.8.8 1.8 1.8M9.8 13.2h2.8m6.6 0h2.8m-9.4 5.4h2.8m4.4 0h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureTile({
  title,
  desc,
  icon: Icon,
  action,
  href,
  accent,
}: {
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  action: string;
  href: string;
  accent: "blue" | "emerald" | "amber" | "violet" | "fuchsia";
}) {
  const accents = {
    blue: {
      icon: "border-blue-300/30 bg-blue-500/15 text-blue-100 shadow-[0_18px_35px_rgba(59,130,246,0.16)]",
      button: "border-blue-300/30 bg-blue-500/18 text-blue-50 hover:bg-blue-500/26",
    },
    emerald: {
      icon: "border-emerald-300/30 bg-emerald-500/15 text-emerald-100 shadow-[0_18px_35px_rgba(16,185,129,0.16)]",
      button: "border-emerald-300/30 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/26",
    },
    amber: {
      icon: "border-amber-300/30 bg-amber-500/15 text-amber-100 shadow-[0_18px_35px_rgba(245,158,11,0.16)]",
      button: "border-amber-300/30 bg-amber-500/18 text-amber-50 hover:bg-amber-500/26",
    },
    violet: {
      icon: "border-violet-300/30 bg-violet-500/15 text-violet-100 shadow-[0_18px_35px_rgba(139,92,246,0.16)]",
      button: "border-violet-300/30 bg-violet-500/18 text-violet-50 hover:bg-violet-500/26",
    },
    fuchsia: {
      icon: "border-fuchsia-300/30 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_18px_35px_rgba(217,70,239,0.16)]",
      button: "border-fuchsia-300/30 bg-fuchsia-500/18 text-fuchsia-50 hover:bg-fuchsia-500/26",
    },
  };

  return (
    <div className="relative overflow-hidden transition-transform duration-300">
      <div className={`mb-4 inline-flex rounded-[1.4rem] border p-3 text-slate-100 backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 ${accents[accent].icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[1.8rem] font-semibold leading-tight text-white">{title}</p>
      <p className="mt-2 min-h-[72px] text-base leading-relaxed text-slate-300">{desc}</p>
      <Link href={href} className={`mt-3 inline-flex rounded-2xl border px-4 py-2 text-base font-medium transition duration-300 group-hover:translate-x-1 ${accents[accent].button}`}>
        {action}
      </Link>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: "emerald" | "amber" | "violet" | "cyan";
}) {
  const accents = {
    emerald: "text-emerald-300 border-emerald-300/12 bg-[linear-gradient(180deg,rgba(10,37,32,0.75),rgba(10,14,28,0.94))]",
    amber: "text-amber-300 border-amber-300/12 bg-[linear-gradient(180deg,rgba(56,32,14,0.75),rgba(10,14,28,0.94))]",
    violet: "text-violet-300 border-violet-300/12 bg-[linear-gradient(180deg,rgba(42,24,72,0.78),rgba(10,14,28,0.94))]",
    cyan: "text-cyan-300 border-cyan-300/12 bg-[linear-gradient(180deg,rgba(14,38,56,0.78),rgba(10,14,28,0.94))]",
  };

  return (
    <div className={`rounded-[1.7rem] border p-4 shadow-[0_16px_45px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-white/15 hover:shadow-[0_28px_65px_rgba(15,23,42,0.36)] ${accents[accent]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-base text-slate-200">{label}</p>
      <p className="text-sm text-slate-500">{hint}</p>
    </div>
  );
}

