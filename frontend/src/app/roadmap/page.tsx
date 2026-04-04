"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";

type RoadmapItem = {
  week: number;
  focusSkill: string;
  project: string;
  resources: string[];
};

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .get<{ roadmap: RoadmapItem[] }>("/roadmap")
      .then((res) => setRoadmap(res.data.roadmap))
      .catch(() => setStatus("No roadmap yet. Analyze a job first."));
  }, []);

  return (
    <AuthGuard>
      <AppShell>
        <Card title="Personalized Weekly Learning Roadmap">
          <div className="space-y-4">
            {roadmap.map((item) => (
              <article key={item.week} className="rounded-xl border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Week {item.week}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.focusSkill}</h3>
                <p className="mt-1 text-sm text-slate-700">Project: {item.project}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.resources.map((resource) => (
                    <span key={resource} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{resource}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
