"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleAlert,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { ReadinessLine } from "@/components/charts/ReadinessLine";
import { RoleFitBar } from "@/components/charts/RoleFitBar";
import { api } from "@/lib/api";

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

export default function DashboardPage() {
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [roleFit, setRoleFit] = useState<{ role: string; fit: number }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [roleTitle, setRoleTitle] = useState("Web Dev Intern");
  const [status, setStatus] = useState("");

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
  }, []);

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
      setStatus("Resume analyzed. Now analyze a job description.");
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
                <p className="mb-1 text-2xl font-semibold text-white">Cross-Platform Intelligence</p>
                <p className="max-w-2xl text-sm text-slate-300">
                  AI connects resume signals, role expectations, and hidden platform patterns to reveal where your profile wins or needs stronger proof.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                    LeetCode strong + GitHub weak
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                    Kaggle strong + no projects
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                    Good GitHub + no DSA practice
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <p className="mb-1 text-2xl font-semibold text-white">Smart Peer Benchmarking</p>
              <p className="text-sm text-slate-300">
                Compare your current profile with successful peers and see exactly what boosts shortlist probability.
              </p>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-amber-100">Top 27% in Data Science</div>
                <div className="rounded-xl border border-indigo-300/20 bg-indigo-500/10 px-3 py-2 text-indigo-100">Top 10% in DSA consistency</div>
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-cyan-100">
                  {Math.max(30, Math.round(score * 0.52))}% chance of getting shortlisted
                </div>
              </div>
            </Card>
          </div>
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
              <FeatureTile title="Readiness Score" desc="Track your overall internship readiness" icon={Shield} href="/dashboard" action="See Score" />
            </Card>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Overall Score" value={`${score}%`} hint={readiness?.readiness.category || "No score yet"} />
          <StatTile label="Skill Gaps" value={`${missingSkillEstimate}`} hint="High priority" />
          <StatTile label="To Internship Ready" value={`${weeksToReady} weeks`} hint="Keep going" />
          <StatTile label="Improvement" value={`+${monthlyImprovement}%`} hint="This month" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Readiness Trend">
            <ReadinessLine data={readiness?.history || []} />
          </Card>
          <Card title="Opportunity Fit Heatmap">
            <RoleFitBar data={roleFit} />
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Resume Upload (PDF)">
            <form onSubmit={onUploadResume} className="space-y-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-1.5 file:text-indigo-100"
              />
              <button className="rounded-xl border border-indigo-400/35 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30">
                Analyze Resume
              </button>
            </form>
          </Card>

          <Card title="Job Description Analysis">
            <form onSubmit={onAnalyzeJob} className="space-y-3">
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Role title"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
              <textarea
                className="h-28 w-full rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Paste job description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="or job URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button className="rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/25">
                Analyze Job
              </button>
            </form>
          </Card>
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
