"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
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
import { ReadinessScore } from "@/components/ReadinessScore";
import { SkillGapDetection } from "@/components/SkillGapDetection";
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
    topPercentile: number;
    dsaPercentile: number | null;
    shortlistChance: number;
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
  const topPercentile = profileIntel?.benchmarking?.topPercentile ?? profileSignals.benchmark.topPercentile;
  const dsaPercentile =
    profileIntel?.benchmarking?.dsaPercentile ?? profileSignals.benchmark.dsaPercentile;
  const shortlistChance =
    profileIntel?.benchmarking?.shortlistChance ?? profileSignals.benchmark.shortlistChance;
  const strengths = profileIntel?.crossPlatform?.strengths ?? profileSignals.strengths;
  const githubStats = profileIntel?.providers?.github?.stats;
  const leetcodeStats = profileIntel?.providers?.leetcode?.stats;

  return (
    <AuthGuard>
      <AppShell>
        <section className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
            <Sparkles className="h-4 w-4" />
            Highlight Features
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-indigo-500/20 blur-2xl" />
                <div className="flex items-center justify-between gap-2">
                  <p className="mb-1 text-2xl font-semibold text-white">Cross-Platform Intelligence</p>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                    {connectedCount}/3 connected
                  </span>
                </div>
                <p className="max-w-2xl text-sm text-slate-300">
                  Live dashboard from your connected profile links. Signals update after each Connect Profiles save.
                </p>

                <div className="mt-4 grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/55 p-3">
                  <SignalRow label="LinkedIn presence" value={strengths.linkedin} icon={Globe} tone="blue" />
                  <SignalRow label="GitHub proof of work" value={strengths.github} icon={GitBranch} tone="emerald" />
                  <SignalRow label="LeetCode consistency" value={strengths.leetcode} icon={Code2} tone="amber" />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/65 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">GitHub</p>
                    <p className="mt-1 text-sm text-slate-200">Repos: {githubStats?.publicRepos ?? "-"}</p>
                    <p className="text-sm text-slate-200">Stars: {githubStats?.totalStars ?? "-"}</p>
                    <p className="text-sm text-slate-200">Followers: {githubStats?.followers ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/65 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">LeetCode</p>
                    <p className="mt-1 text-sm text-slate-200">Solved: {leetcodeStats?.solved ?? "-"}</p>
                    <p className="text-sm text-slate-200">Medium: {leetcodeStats?.mediumSolved ?? "-"}</p>
                    <p className="text-sm text-slate-200">Ranking: {leetcodeStats?.ranking ?? "-"}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {displayInsights.slice(0, 3).map((item) => (
                    <div key={item} className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {profileIntel ? `Live: ${profileIntel.providers.github.message} | ${profileIntel.providers.leetcode.message}` : "Live analysis unavailable. Showing local estimate."}
                </p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="mb-1 text-2xl font-semibold text-white">Smart Peer Benchmarking</p>
                <ChartNoAxesColumn className="h-5 w-5 text-indigo-300" />
              </div>
              <p className="text-sm text-slate-300">
                Benchmark view generated from your real profile metrics + readiness history.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <KpiChip label="Peer Rank" value={`Top ${topPercentile}%`} tone="amber" />
                <KpiChip
                  label="DSA Cohort"
                  value={dsaPercentile ? `Top ${dsaPercentile}%` : "Pending"}
                  tone="indigo"
                />
                <KpiChip label="Shortlist Chance" value={`${shortlistChance}%`} tone="cyan" />
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-slate-700 bg-slate-950/55 p-3">
                <BenchRow label="Profile competitiveness" value={100 - topPercentile} />
                <BenchRow label="Interview readiness" value={dsaPercentile ? 100 - dsaPercentile : 35} />
                <BenchRow label="Recruiter shortlist probability" value={shortlistChance} />
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {profileIntel?.generatedAt
                  ? `Last refreshed: ${new Date(profileIntel.generatedAt).toLocaleString()}`
                  : "Connect profiles to unlock live peer benchmarking refresh."}
              </p>

              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/65 px-3 py-2 text-xs text-slate-300">
                {dsaPercentile
                  ? "Your coding profile is benchmarked with role-aligned internship peers."
                  : "Add a valid LeetCode profile URL to enable DSA percentile benchmarking."}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="overflow-hidden border-slate-700/80 bg-[linear-gradient(180deg,rgba(13,20,40,0.92),rgba(8,14,28,0.96))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-white">GitHub Growth</p>
                <p className="text-sm text-slate-400">Repository & Contribution Activity</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
              <ScoreDonut score={Math.round(profileIntel?.githubGrowth?.score || 0)} color="emerald" />
              <TrendLinePanel
                series={profileIntel?.githubGrowth?.dailySeries || []}
                tone="emerald"
                momentum={profileIntel?.githubGrowth?.momentumPerDay || 0}
                metricLabel="commits/day"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniStat label="Total Repositories" value={String(profileIntel?.githubGrowth?.totalRepositories || 0)} />
              <MiniStat label="Total Commits (Last 30 Days)" value={String(profileIntel?.githubGrowth?.totalCommits30d || 0)} />
              <MiniStat label="Longest Streak" value={`${profileIntel?.githubGrowth?.longestStreakDays || 0} days`} />
              <MiniStat label="Profile Strength Score" value={`${Math.round(profileIntel?.githubGrowth?.profileStrengthScore || 0)}/100`} />
            </div>
          </Card>

          <Card className="overflow-hidden border-slate-700/80 bg-[linear-gradient(180deg,rgba(13,20,40,0.92),rgba(8,14,28,0.96))]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-white">LeetCode Progress</p>
                <p className="text-sm text-slate-400">Problem Solving Consistency</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
              <ScoreDonut score={Math.round(profileIntel?.leetcodeProgress?.score || 0)} color="amber" />
              <TrendLinePanel
                series={profileIntel?.leetcodeProgress?.dailySeries || []}
                tone="cyan"
                momentum={profileIntel?.leetcodeProgress?.momentumPerDay || 0}
                metricLabel="problems/day"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Core Features</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="border-blue-400/25 bg-[linear-gradient(180deg,rgba(23,56,118,0.4),rgba(10,14,28,0.94))]">
              <FeatureTile title="Resume Analysis" desc="Analyze ATS score and suggest improvements" icon={BookOpen} href="/resume-optimizer" action="Analyze" />
            </Card>
            <Card className="border-emerald-400/25 bg-[linear-gradient(180deg,rgba(6,78,59,0.35),rgba(10,14,28,0.94))]">
              <FeatureTile title="Job Role Comparison" desc="Compare profile against role requirements" icon={BriefcaseBusiness} href="/dashboard" action="Compare" />
            </Card>
            <Card className="border-amber-400/25 bg-[linear-gradient(180deg,rgba(120,53,15,0.32),rgba(10,14,28,0.94))]">
              <FeatureTile title="Skill Gap Detection" desc="Identify missing skills before applying" icon={CircleAlert} href="/skill-gap" action="Detect Gaps" />
            </Card>
            <Card className="border-violet-400/25 bg-[linear-gradient(180deg,rgba(91,33,182,0.28),rgba(10,14,28,0.94))]">
              <FeatureTile title="Learning Roadmap" desc="Get a weekly path to become internship-ready" icon={Target} href="/roadmap" action="View Roadmap" />
            </Card>
            <Card className="border-fuchsia-400/25 bg-[linear-gradient(180deg,rgba(131,24,67,0.28),rgba(10,14,28,0.94))]">
              <FeatureTile title="Readiness Score" desc="Track your overall internship readiness" icon={Shield} href="/readiness-analysis" action="See Score" />
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card title="Analyze Readiness By Role">
            <form onSubmit={onUploadResume} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Select Role
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Upload Resume (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1 file:text-cyan-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl border border-cyan-400/35 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Upload Resume & Analyze
              </button>
            </form>
          </Card>

          <Card title="Analysis Status">
            <p className="text-sm text-slate-300">
              {isAnalyzingReadiness
                ? "Analyzing readiness and skill gaps..."
                : readinessAnalysis
                  ? `Role: ${roleTitle} · Score: ${readinessAnalysis.score}% · ${readinessAnalysis.readinessLevel}`
                  : "Upload a resume and select a role to generate skill gap + readiness insights."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Resume text source: {resumeText ? "Extracted and available" : "Not available yet"}
            </p>
          </Card>
        </section>

        {readinessAnalysis ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <SkillGapDetection
              matchedSkills={readinessAnalysis.matchedSkills}
              missingSkills={readinessAnalysis.missingSkills}
              totalGaps={readinessAnalysis.totalGaps}
            />
            <ReadinessScore
              score={readinessAnalysis.score}
              readinessLevel={readinessAnalysis.readinessLevel}
            />
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Overall Score" value={`${score}%`} hint={readiness?.readiness.category || "No score yet"} />
          <StatTile label="Skill Gaps" value={`${missingSkillEstimate}`} hint="High priority" />
          <StatTile label="To Internship Ready" value={`${weeksToReady} weeks`} hint="Keep going" />
          <StatTile label="Improvement" value={`+${monthlyImprovement}%`} hint="This month" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card title="Weighted Components" className="xl:col-span-1">
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                Skill Match (50%): <span className="font-semibold text-slate-100">{skillMatch}%</span>
              </p>
              <p>
                Project Relevance (30%): <span className="font-semibold text-slate-100">{projectRelevance}%</span>
              </p>
              <p>
                Experience (20%): <span className="font-semibold text-slate-100">{experienceScore}%</span>
              </p>
            </div>
          </Card>
          <Card title="AI Feedback" className="xl:col-span-2">
            <p className="text-sm leading-relaxed text-slate-300">
              {readiness?.readiness.explanation || "Run resume and job analysis to generate explainable readiness insights."}
            </p>
            <div className="mt-3">
              <Link href="/interview-simulator" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200">
                Practice with interview simulator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>

        {status ? <p className="rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-200">{status}</p> : null}
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
    blue: "from-sky-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
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
    amber: "border-amber-300/25 bg-amber-500/10 text-amber-100",
    indigo: "border-indigo-300/25 bg-indigo-500/10 text-indigo-100",
    cyan: "border-cyan-300/25 bg-cyan-500/10 text-cyan-100",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles[tone]}`}>
      <p className="text-[11px] uppercase tracking-[0.12em] opacity-85">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function BenchRow({ label, value }: { label: string; value: number }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{Math.round(width)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/90 bg-slate-900/65 px-3 py-3.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-[2rem] font-semibold leading-tight text-slate-100">{value}</p>
    </div>
  );
}

function ScoreDonut({ score, color }: { score: number; color: "emerald" | "amber" }) {
  const safe = Math.max(0, Math.min(100, score));
  const ringColor = color === "emerald" ? "rgba(52,211,153,0.95)" : "rgba(245,158,11,0.95)";
  const textColor = color === "emerald" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="grid place-items-center rounded-2xl border border-slate-700/90 bg-slate-950/60 p-4">
      <div className="relative grid h-[196px] w-[196px] place-items-center rounded-full border border-slate-700 bg-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.08)]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, ${ringColor} ${safe * 3.6}deg, rgba(51,65,85,0.5) 0deg)`,
          }}
        />
        <div className="relative z-10 grid h-[146px] w-[146px] place-items-center rounded-full bg-slate-950 text-center">
          <p className={`text-5xl font-semibold ${textColor}`}>{safe}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Out of 100</p>
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
    <div className="rounded-2xl border border-slate-700/90 bg-slate-950/55 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Last 30 days</p>
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

function FeatureTile({
  title,
  desc,
  icon: Icon,
  action,
  href,
}: {
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  action: string;
  href: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl border border-slate-500/25 bg-slate-900/60 p-2.5 text-slate-100">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xl font-semibold text-white">{title}</p>
      <p className="mt-2 min-h-[52px] text-sm leading-relaxed text-slate-300">{desc}</p>
      <Link href={href} className="mt-4 inline-flex rounded-xl border border-slate-400/30 bg-slate-900/50 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-800">
        {action}
      </Link>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/65 bg-[linear-gradient(180deg,rgba(18,25,47,0.92),rgba(10,14,28,0.9))] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.35)]">
      <p className="text-2xl font-semibold text-emerald-300">{value}</p>
      <p className="mt-1 text-sm text-slate-200">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}
