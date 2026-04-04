"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { api } from "@/lib/api";
import { BriefcaseBusiness, Building2, ExternalLink, MapPin } from "lucide-react";

type AnalyzeReadinessResponse = {
  score: number;
  readinessLevel: string;
  matchedSkills: string[];
  missingSkills: string[];
};

type JobListing = {
  title: string;
  company: string;
  location: string;
  applyLink: string;
  description: string;
};

const ROLE_OPTIONS = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
  "AI Engineer",
];

const colorMeta = (score: number) => {
  if (score >= 80) {
    return {
      text: "text-emerald-200",
      ring: "#34d399",
      bar: "bg-emerald-400",
      badge: "border-emerald-300/35 bg-emerald-500/20 text-emerald-100",
      tip: "You are highly job-ready. Keep polishing projects and start applying aggressively.",
    };
  }
  if (score >= 60) {
    return {
      text: "text-amber-200",
      ring: "#fbbf24",
      bar: "bg-amber-400",
      badge: "border-amber-300/35 bg-amber-500/20 text-amber-100",
      tip: "You are close to being job-ready. Improve a few areas to increase your chances.",
    };
  }
  return {
    text: "text-rose-200",
    ring: "#fb7185",
    bar: "bg-rose-400",
    badge: "border-rose-300/35 bg-rose-500/20 text-rose-100",
    tip: "Foundation needs improvement. Focus on core skills and project depth first.",
  };
};

const suggestedRoles = (score: number) => {
  if (score >= 80) {
    return [
      { role: "Full Stack Developer Intern", fit: "Best Fit" },
      { role: "Frontend Developer Intern", fit: "Good Fit" },
      { role: "Backend Developer Intern", fit: "Good Fit" },
    ];
  }
  if (score >= 50) {
    return [
      { role: "Frontend Intern", fit: "Good Fit" },
      { role: "QA Intern", fit: "Good Fit" },
      { role: "Junior Web Developer", fit: "Beginner" },
    ];
  }
  return [
    { role: "Beginner Web Developer", fit: "Beginner" },
    { role: "Trainee Intern", fit: "Beginner" },
    { role: "Learning-based roles", fit: "Beginner" },
  ];
};

const roleLabelStyle = (fit: string) => {
  if (fit === "Best Fit") return "border-emerald-300/35 bg-emerald-500/20 text-emerald-100";
  if (fit === "Good Fit") return "border-amber-300/35 bg-amber-500/20 text-amber-100";
  return "border-sky-300/35 bg-sky-500/20 text-sky-100";
};

const getOpportunityBadge = (description: string, matchedSkills: string[]) => {
  const normalizedDescription = description.toLowerCase();
  const hit = matchedSkills.filter((skill) =>
    normalizedDescription.includes(skill.toLowerCase())
  ).length;
  const ratio = hit / Math.max(1, matchedSkills.length || 1);
  if (ratio >= 0.67) return "Easy Apply";
  if (ratio >= 0.34) return "Good Match";
  return "Stretch";
};

const opportunityBadgeStyle = (badge: string) => {
  if (badge === "Easy Apply") {
    return "border-emerald-300/40 bg-gradient-to-r from-emerald-500/35 to-teal-500/30 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.35)]";
  }
  if (badge === "Good Match") {
    return "border-cyan-300/40 bg-gradient-to-r from-cyan-500/35 to-blue-500/30 text-cyan-50 shadow-[0_0_16px_rgba(56,189,248,0.35)]";
  }
  return "border-orange-300/40 bg-gradient-to-r from-orange-500/35 to-rose-500/30 text-orange-50 shadow-[0_0_16px_rgba(251,146,60,0.35)]";
};

const buildInsight = (matched: string[], missing: string[]) => {
  const hasReact = matched.some((skill) => /react|frontend/i.test(skill));
  const hasNodeGap = missing.some((skill) => /node|backend|api/i.test(skill));
  const hasPython = matched.some((skill) => /python|data/i.test(skill));

  if (hasReact && hasNodeGap) {
    return "You are strong in frontend technologies. Strengthening backend skills can unlock full-stack opportunities.";
  }
  if (hasPython) {
    return "Your profile shows good data foundations. Strengthening SQL and project storytelling can unlock stronger analyst and AI roles.";
  }
  return "Your readiness is improving. Focus on closing top missing skills to unlock better-fit opportunities.";
};

export default function ReadinessAnalysisPage() {
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeReadinessResponse | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobsStatus, setJobsStatus] = useState("");

  const loadAnalysis = async (text: string, role: string) => {
    if (!text.trim()) {
      setAnalysis(null);
      setStatus("Upload your resume in Resume Analysis first to generate readiness insights.");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("");
      const response = await api.post<AnalyzeReadinessResponse>("/api/analyze-readiness", {
        resumeText: text,
        selectedRole: role,
      });
      setAnalysis(response.data);
      await loadJobs(role, response.data.matchedSkills);
    } catch (error: any) {
      setAnalysis(null);
      setJobs([]);
      setStatus(error?.response?.data?.message || "Could not fetch readiness analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async (role: string, matchedSkills: string[]) => {
    try {
      setIsJobsLoading(true);
      setJobsStatus("");
      const response = await api.get<JobListing[]>("/api/jobs", {
        params: {
          role,
          skills: matchedSkills.join(" "),
        },
      });
      setJobs(response.data || []);
      if (!response.data?.length) {
        setJobsStatus("No matching opportunities found. Try improving your skills.");
      }
    } catch (error: any) {
      setJobs([]);
      setJobsStatus(error?.response?.data?.message || "Could not fetch live opportunities right now.");
    } finally {
      setIsJobsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const text = localStorage.getItem("skillsync_resume_text") || "";
    setResumeText(text);
    loadAnalysis(text, selectedRole);
  }, []);

  useEffect(() => {
    if (resumeText.trim()) {
      loadAnalysis(resumeText, selectedRole);
    }
  }, [selectedRole]);

  const score = analysis?.score ?? 0;
  const tone = colorMeta(score);

  const recommendedRoles = useMemo(() => suggestedRoles(score), [score]);
  const insight = useMemo(
    () => buildInsight(analysis?.matchedSkills || [], analysis?.missingSkills || []),
    [analysis]
  );

  return (
    <AuthGuard>
      <AppShell>
        <section className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.16),transparent_35%),linear-gradient(165deg,rgba(15,23,42,0.88),rgba(2,6,23,0.95))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
          <h1 className="text-3xl font-semibold text-white">Readiness Analysis</h1>
          <p className="mt-1 text-base leading-relaxed text-slate-300">
            Your current readiness and opportunities based on your resume
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Target Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2.5 text-sm text-slate-100"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <a
              href="/resume-optimizer"
              className="inline-flex rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(56,189,248,0.35)]"
            >
              Upload / Refresh Resume
            </a>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
            Loading readiness analysis...
          </section>
        ) : null}

        {analysis ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(30,41,59,0.62),rgba(15,23,42,0.82)_55%,rgba(2,6,23,0.95))] p-6 shadow-[0_16px_55px_rgba(0,0,0,0.36)] transition duration-300 hover:scale-[1.01]">
              <div className="flex flex-col items-center gap-5 md:flex-row">
                <div
                  className="grid h-40 w-40 place-items-center rounded-full border border-white/10 bg-slate-950/70"
                  style={{
                    background: `conic-gradient(from 180deg, ${tone.ring} ${score * 3.6}deg, rgba(51,65,85,0.55) 0deg)`,
                  }}
                >
                  <div className="grid h-30 w-30 place-items-center rounded-full bg-slate-950 text-center">
                    <span className={`text-5xl font-bold ${tone.text}`}>{score}%</span>
                  </div>
                </div>

                <div className="w-full">
                  <p className={`inline-flex rounded-full border px-4 py-1.5 text-base font-semibold ${tone.badge}`}>
                    {analysis.readinessLevel}
                  </p>
                  <p className="mt-3 text-lg leading-relaxed text-slate-200">{tone.tip}</p>
                  <div className="mt-4 h-4 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                    <div className={`h-full transition-all duration-700 ${tone.bar}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[linear-gradient(165deg,rgba(30,41,59,0.62),rgba(15,23,42,0.84),rgba(2,6,23,0.95))] p-6 shadow-[0_16px_55px_rgba(0,0,0,0.36)]">
              <h2 className="text-2xl font-semibold text-white">Recommended Opportunities</h2>

              <div className="mt-5">
                <h3 className="text-lg font-semibold text-slate-100">Suggested Roles</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {recommendedRoles.map((item) => (
                    <article key={item.role} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:scale-[1.02] hover:shadow-[0_0_22px_rgba(99,102,241,0.24)]">
                      <p className="text-base font-semibold text-white">{item.role}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleLabelStyle(item.fit)}`}>
                        {item.fit}
                      </span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-100">Suggested Opportunities</h3>
                {isJobsLoading ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-100 border-t-transparent" />
                    Fetching real-time opportunities...
                  </div>
                ) : null}

                {!isJobsLoading && jobs.length ? (
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
                    <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-indigo-400/10 blur-3xl" />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {jobs.map((item, index) => {
                      const badge = getOpportunityBadge(item.description, analysis.matchedSkills);
                      const matchingTags = analysis.matchedSkills
                        .filter((skill) => item.description.toLowerCase().includes(skill.toLowerCase()))
                        .slice(0, 4);
                      return (
                        <a
                          key={`${item.title}-${item.company}-${index}`}
                          href={item.applyLink || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative flex h-full cursor-pointer gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-cyan-500/10 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_0_28px_rgba(56,189,248,0.26)]"
                        >
                          <div className="w-1 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
                          <div className="flex min-h-[220px] flex-1 flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="flex items-center gap-2 text-lg font-semibold text-white md:text-xl">
                                  <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
                                  {item.title}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                  {item.company}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                  {item.location}
                                </p>
                              </div>
                              <span
                                className={`animate-pulse rounded-full border px-2.5 py-1 text-xs font-semibold ${opportunityBadgeStyle(badge)}`}
                              >
                                {badge}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {matchingTags.length ? (
                                matchingTags.map((skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-full border border-cyan-300/25 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-3 py-1 text-xs text-cyan-100 shadow-[0_0_10px_rgba(56,189,248,0.2)] transition duration-300 hover:scale-[1.05]"
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full border border-slate-500/40 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
                                  General Match
                                </span>
                              )}
                            </div>

                            <div className="mt-auto">
                              <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.45)]">
                                Apply Now
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                    </div>
                  </div>
                ) : null}

                {!isJobsLoading && jobsStatus ? (
                  <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {jobsStatus}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-300/25 bg-indigo-500/10 p-5">
              <h3 className="text-lg font-semibold text-indigo-100">Smart Insight</h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-50/90">{insight}</p>
            </section>
          </>
        ) : null}

        {status ? (
          <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {status}
          </section>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
