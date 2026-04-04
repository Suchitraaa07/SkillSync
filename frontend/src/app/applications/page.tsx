"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card } from "@/components/Card";
import { api } from "@/lib/api";

type AppItem = {
  _id: string;
  company: string;
  role: string;
  status: string;
  fitScore: number;
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const load = async () => {
    const { data } = await api.get<{ applications: AppItem[] }>("/applications");
    setApplications(data.applications);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    await api.post("/applications", { company, role, status: "Saved", fitScore: 0 });
    setCompany("");
    setRole("");
    await load();
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/applications/${id}`, { status });
    await load();
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card title="Add Application">
            <form onSubmit={onAdd} className="space-y-3">
              <input className="w-full rounded-lg border p-2" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <input className="w-full rounded-lg border p-2" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Save</button>
            </form>
          </Card>

          <Card title="Application Tracker">
            <div className="space-y-3">
              {applications.map((app) => (
                <article key={app._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-semibold text-slate-900">{app.company}</p>
                    <p className="text-sm text-slate-600">{app.role}</p>
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                    className="rounded-lg border p-2 text-sm"
                  >
                    <option>Saved</option>
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Rejected</option>
                    <option>Offer</option>
                  </select>
                </article>
              ))}
            </div>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
