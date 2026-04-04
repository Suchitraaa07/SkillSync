"use client";

import { ComponentType, useEffect, useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, Plus, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { AnalyticsCard } from "@/components/applications/AnalyticsCard";
import { ApplicationList } from "@/components/applications/ApplicationList";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { ApplicationSkeleton } from "@/components/applications/ApplicationSkeleton";
import { ApplicationsOverTimeChart } from "@/components/applications/ApplicationsOverTimeChart";
import { ConversionFunnelChart } from "@/components/applications/ConversionFunnelChart";
import { ReferralImpactChart } from "@/components/applications/ReferralImpactChart";
import { RoleSuccessChart } from "@/components/applications/RoleSuccessChart";
import {
  ApplicationFormValues,
  ApplicationItem,
  ApplicationStatus,
} from "@/components/applications/types";
import {
  getApplicationsOverTime,
  getConversionFunnel,
  getReferralImpact,
  getRoleSuccessRate,
  getSummaryMetrics,
} from "@/lib/applicationAnalytics";
import { api } from "@/lib/api";

type ToastState = {
  tone: "success" | "error";
  message: string;
};

function StatTile({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/65 bg-slate-950/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
        </div>
        <div className={`rounded-2xl border px-3 py-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadApplications = async () => {
    try {
      setError("");
      const { data } = await api.get<{ applications: ApplicationItem[] }>("/api/applications");
      setApplications(data.applications || []);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || "Could not load application analytics right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications().catch(() => undefined);
  }, []);

  const onCreate = async (values: ApplicationFormValues) => {
    try {
      setIsSaving(true);
      const { data } = await api.post<{ application: ApplicationItem }>("/api/applications", values);
      setApplications((prev) =>
        [data.application, ...prev].sort(
          (a, b) => new Date(b.dateApplied || b.createdAt).getTime() - new Date(a.dateApplied || a.createdAt).getTime()
        )
      );
      setToast({ tone: "success", message: "Application saved successfully." });
      setIsModalOpen(false);
    } catch (saveError: any) {
      setToast({ tone: "error", message: saveError?.response?.data?.message || "Could not save application." });
    } finally {
      setIsSaving(false);
    }
  };

  const onStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      setBusyId(id);
      const { data } = await api.put<{ application: ApplicationItem }>(`/api/applications/${id}`, { status });
      setApplications((prev) => prev.map((item) => (item._id === id ? data.application : item)));
      setToast({ tone: "success", message: "Application status updated." });
    } catch (updateError: any) {
      setToast({ tone: "error", message: updateError?.response?.data?.message || "Could not update status." });
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this application?")) {
      return;
    }

    try {
      setBusyId(id);
      await api.delete(`/api/applications/${id}`);
      setApplications((prev) => prev.filter((item) => item._id !== id));
      setToast({ tone: "success", message: "Application deleted." });
    } catch (deleteError: any) {
      setToast({ tone: "error", message: deleteError?.response?.data?.message || "Could not delete application." });
    } finally {
      setBusyId(null);
    }
  };

  const summary = useMemo(() => getSummaryMetrics(applications), [applications]);
  const overTimeData = useMemo(() => getApplicationsOverTime(applications), [applications]);
  const funnelData = useMemo(() => getConversionFunnel(applications), [applications]);
  const roleSuccessData = useMemo(() => getRoleSuccessRate(applications), [applications]);
  const referralImpactData = useMemo(() => getReferralImpact(applications), [applications]);

  return (
    <AuthGuard>
      <AppShell>
        {toast ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              toast.tone === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-500/10 text-rose-100"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded-full border border-cyan-300/25 bg-cyan-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                Minimal Application Analytics
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">Application funnel, without the busywork</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
                  Add applications in seconds, update statuses as they move, and let SkillSync build the analytics automatically.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              <Plus className="h-4 w-4" />
              Add Application
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
        </section>

        {isLoading ? (
          <ApplicationSkeleton />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Applications" value={String(summary.totalApplications)} accent="border-cyan-300/25 bg-cyan-500/10 text-cyan-200" icon={BriefcaseBusiness} />
              <StatTile label="Shortlist Rate" value={`${summary.shortlistRate}%`} accent="border-emerald-300/25 bg-emerald-500/10 text-emerald-200" icon={Target} />
              <StatTile label="Offer Rate" value={`${summary.offerRate}%`} accent="border-amber-300/25 bg-amber-500/10 text-amber-200" icon={Sparkles} />
              <StatTile label="Referral Mix" value={`${summary.referralRate}%`} accent="border-violet-300/25 bg-violet-500/10 text-violet-200" icon={BarChart3} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <AnalyticsCard
                title="Applications Over Time"
                subtitle="Weekly application volume to help you spot consistency and dips."
              >
                <ApplicationsOverTimeChart data={overTimeData} />
              </AnalyticsCard>

              <AnalyticsCard
                title="Conversion Funnel"
                subtitle="How many applications are reaching each major step in your hiring pipeline."
              >
                <ConversionFunnelChart data={funnelData} />
              </AnalyticsCard>

              <AnalyticsCard
                title="Role Success Rate"
                subtitle="Percent of applications per role that reached shortlist or beyond."
              >
                <RoleSuccessChart data={roleSuccessData} />
              </AnalyticsCard>

              <AnalyticsCard
                title="Referral Impact"
                subtitle="Compare shortlist success for referral and non-referral applications."
              >
                <ReferralImpactChart data={referralImpactData} />
              </AnalyticsCard>
            </section>

            <AnalyticsCard
              title="Tracked Applications"
              subtitle="Update status or remove entries without leaving the page."
            >
              <ApplicationList applications={applications} busyId={busyId} onStatusChange={onStatusChange} onDelete={onDelete} />
            </AnalyticsCard>
          </>
        )}

        <ApplicationModal open={isModalOpen} isSaving={isSaving} onClose={() => setIsModalOpen(false)} onSubmit={onCreate} />
      </AppShell>
    </AuthGuard>
  );
}
