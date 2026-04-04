"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";
import axios from "axios";

type SkillGap = {
  missingSkills: string[];
  weakSkills: string[];
  strongSkills: string[];
};

export default function SkillGapPage() {
  const [gap, setGap] = useState<SkillGap>({ missingSkills: [], weakSkills: [], strongSkills: [] });
  const [skillsInput, setSkillsInput] = useState("node.js,mongodb");
  const [simulation, setSimulation] = useState<{ currentScore: number; newScore: number; improvement: number; category: string } | null>(null);
  const [status, setStatus] = useState("");
  const [canSimulate, setCanSimulate] = useState(false);

  const load = async () => {
    const { data } = await api.get<SkillGap>("/skill-gap");
    setGap(data);
    setCanSimulate(true);
    setStatus("");
  };

  useEffect(() => {
    load().catch(() => {
      setCanSimulate(false);
      setStatus("No skill-gap data yet. Run analysis from dashboard first.");
    });
  }, []);

  const onSimulate = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSimulate) {
      setStatus("Please upload resume and analyze a job first.");
      return;
    }

    const skillsToLearn = skillsInput.split(",").map((v) => v.trim()).filter(Boolean);
    try {
      const { data } = await api.post("/simulate-future", { skillsToLearn });
      setSimulation(data);
      setStatus("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setStatus(error.response?.data?.message || "Could not run simulation. Analyze a job first.");
      } else {
        setStatus("Could not run simulation. Analyze a job first.");
      }
      setSimulation(null);
    }
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Strong Skills">
            <ul className="space-y-2 text-sm">{gap.strongSkills.map((s) => <li key={s} className="rounded bg-emerald-100 px-2 py-1">{s}</li>)}</ul>
          </Card>
          <Card title="Weak Skills">
            <ul className="space-y-2 text-sm">{gap.weakSkills.map((s) => <li key={s} className="rounded bg-amber-100 px-2 py-1">{s}</li>)}</ul>
          </Card>
          <Card title="Missing Skills">
            <ul className="space-y-2 text-sm">{gap.missingSkills.map((s) => <li key={s} className="rounded bg-rose-100 px-2 py-1">{s}</li>)}</ul>
          </Card>
        </div>

        <Card title="Future Readiness Simulator">
          <form onSubmit={onSimulate} className="flex flex-col gap-3">
            <input className="rounded-lg border p-2" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="Comma-separated skills to learn" />
            <button
              className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
              disabled={!canSimulate}
            >
              Simulate
            </button>
          </form>

          {simulation ? (
            <div className="mt-4 rounded-xl bg-slate-100 p-4 text-sm">
              <p>Current: {simulation.currentScore}%</p>
              <p>New Score: {simulation.newScore}%</p>
              <p>Improvement: +{simulation.improvement}%</p>
              <p>Category: {simulation.category}</p>
            </div>
          ) : null}
        </Card>

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </AppShell>
    </AuthGuard>
  );
}
