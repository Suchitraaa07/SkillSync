"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { PrioritizedImprovementChecklist } from "@/components/PrioritizedImprovementChecklist";
import { SkillGapDetection } from "@/components/SkillGapDetection";
import { api } from "@/lib/api";

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

export default function SkillGapPage() {
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeReadinessResponse | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runAnalysis = async (text: string, role: string) => {
    if (!text.trim()) {
      setAnalysis(null);
      setStatus("Upload your resume in Resume Analysis first to generate skill gap and readiness.");
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
    } catch (error: any) {
      setAnalysis(null);
      setStatus(error?.response?.data?.message || "Could not analyze readiness right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedResumeText = localStorage.getItem("skillsync_resume_text") || "";
    setResumeText(storedResumeText);
    runAnalysis(storedResumeText, selectedRole);
  }, []);

  useEffect(() => {
    if (resumeText) {
      runAnalysis(resumeText, selectedRole);
    }
  }, [selectedRole]);

  return (
    <AuthGuard>
      <AppShell>
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.2),transparent_40%),radial-gradient(circle_at_88%_12%,rgba(168,85,247,0.2),transparent_35%),linear-gradient(165deg,rgba(30,41,59,0.7),rgba(15,23,42,0.86),rgba(2,6,23,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl transition duration-300">
          <div className="pointer-events-none absolute -left-24 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="relative">
            <h3 className="text-2xl font-semibold text-white">Skill Gap + Readiness Analysis</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Select your target role and analyze readiness using extracted resume text.
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-cyan-300/40 via-indigo-300/30 to-transparent" />

            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Target Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 transition duration-200 focus:border-cyan-300/45 focus:outline-none"
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
                className="inline-flex cursor-pointer rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/35 via-blue-500/30 to-indigo-500/30 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_0_0_rgba(56,189,248,0.45)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]"
              >
                Upload / Refresh Resume
              </a>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Resume source: {resumeText ? "Extracted text available" : "No extracted resume text found"}
            </p>
          </div>
        </section>

        {isLoading ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md transition duration-300">
            <p className="text-sm text-slate-300">Analyzing your readiness and skill gaps...</p>
          </Card>
        ) : null}

        {analysis ? (
          <section>
            <SkillGapDetection
              matchedSkills={analysis.matchedSkills}
              missingSkills={analysis.missingSkills}
              totalGaps={analysis.totalGaps}
            />
          </section>
        ) : null}

        {analysis ? (
          <PrioritizedImprovementChecklist
            missingSkills={analysis.missingSkills}
            selectedRole={selectedRole}
          />
        ) : null}

        {status ? (
          <Card className="border-amber-300/20 bg-amber-500/10">
            <p className="text-sm text-amber-100">{status}</p>
          </Card>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
