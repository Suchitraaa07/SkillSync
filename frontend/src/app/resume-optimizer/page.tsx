"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { SkillRadar } from "@/components/charts/SkillRadar";
import { api } from "@/lib/api";

type OptimizerResponse = {
  needsSetup?: boolean;
  message?: string;
  bullets: string[];
  strongSkills: string[];
  missingSkills: string[];
  currentSkills: string[];
};

export default function ResumeOptimizerPage() {
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .get<OptimizerResponse>("/resume-optimize")
      .then((res) => {
        setData(res.data);
        if (res.data.needsSetup) {
          setStatus(res.data.message || "Resume optimization insights will appear after resume + job analysis.");
        } else {
          setStatus("");
        }
      })
      .catch(() => setStatus("Resume optimization insights will appear after resume + job analysis."));
  }, []);

  const graphData = useMemo(() => {
    if (!data) return [];
    const strong = data.strongSkills.map((s) => ({ skill: s, strength: 85 }));
    const missing = data.missingSkills.slice(0, 4).map((s) => ({ skill: s, strength: 25 }));
    return [...strong, ...missing].slice(0, 8);
  }, [data]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Visual Skill Graph">
            <SkillRadar data={graphData} />
          </Card>
          <Card title="Resume Optimization Suggestions">
            <ul className="space-y-3 text-sm text-slate-700">
              {data?.bullets.map((bullet) => (
                <li key={bullet} className="rounded-lg bg-slate-100 p-3">{bullet}</li>
              ))}
            </ul>
            {status ? <p className="mt-4 text-sm text-slate-500">{status}</p> : null}
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
