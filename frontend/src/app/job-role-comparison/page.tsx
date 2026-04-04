"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { JobRoleComparisonDashboard } from "@/components/JobRoleComparisonDashboard";
import { api } from "@/lib/api";

type FitHeatmapResponse = {
  needsResumeUpload?: boolean;
  message?: string;
  extractedSkills?: string[];
  roleFit: { role: string; fit: number }[];
};

export default function JobRoleComparisonPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [roleMatches, setRoleMatches] = useState<{ name: string; match: number }[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  useEffect(() => {
    const loadRoleFit = async () => {
      try {
        setIsLoading(true);
        setStatus("");
        const response = await api.get<FitHeatmapResponse>("/fit-heatmap");
        if (response.data.needsResumeUpload || !response.data.roleFit.length) {
          setRoleMatches([]);
          setExtractedSkills([]);
          setStatus(
            response.data.message ||
              "Upload your resume in Resume Analysis first. Job Role Comparison uses only extracted resume data."
          );
          return;
        }

        const mapped = response.data.roleFit.map((item) => ({
          name: item.role,
          match: item.fit,
        }));
        setExtractedSkills(response.data.extractedSkills || []);
        setRoleMatches(mapped);
      } catch (error: any) {
        setRoleMatches([]);
        setExtractedSkills([]);
        setStatus(error?.response?.data?.message || "Unable to load role comparison right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoleFit();
  }, []);

  const hasData = useMemo(() => roleMatches.length > 0, [roleMatches]);

  return (
    <AuthGuard>
      <AppShell>
        {isLoading ? (
          <div className="relative overflow-hidden rounded-3xl border border-slate-300/20 bg-[linear-gradient(145deg,rgba(59,130,246,0.16),rgba(15,23,42,0.86)_45%,rgba(2,6,23,0.95))] px-5 py-7 text-sm text-slate-200 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-12 left-6 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
            Loading role comparison...
          </div>
        ) : null}

        {!isLoading && !hasData ? (
          <div className="relative overflow-hidden rounded-3xl border border-amber-300/35 bg-[linear-gradient(145deg,rgba(251,191,36,0.14),rgba(15,23,42,0.88)_50%,rgba(2,6,23,0.95))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
            <h3 className="text-xl font-semibold text-amber-100">Resume Upload Required</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-50/90">
              {status ||
                "Upload your resume in Resume Analysis first. This feature works only on extracted resume data."}
            </p>
            <a
              href="/resume-optimizer"
              className="mt-5 inline-flex rounded-xl border border-amber-200/40 bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:-translate-y-0.5 hover:bg-amber-300/25"
            >
              Go to Resume Analysis
            </a>
          </div>
        ) : null}

        {!isLoading && hasData ? (
          <JobRoleComparisonDashboard
            roles={roleMatches}
            targetRole="SDE Intern"
            extractedSkills={extractedSkills}
          />
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
