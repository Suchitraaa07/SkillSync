"use client";

import { Trash2 } from "lucide-react";
import {
  APPLICATION_STATUSES,
  ApplicationItem,
  ApplicationStatus,
} from "@/components/applications/types";

type ApplicationListProps = {
  applications: ApplicationItem[];
  busyId: string | null;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: ApplicationStatus) {
  switch (status) {
    case "Offer":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
    case "Interview":
      return "border-amber-400/30 bg-amber-500/15 text-amber-100";
    case "Shortlisted":
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-100";
    case "Rejected":
      return "border-rose-400/30 bg-rose-500/15 text-rose-100";
    default:
      return "border-indigo-400/30 bg-indigo-500/15 text-indigo-100";
  }
}

export function ApplicationList({ applications, busyId, onStatusChange, onDelete }: ApplicationListProps) {
  if (!applications.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
        <div>
          <p className="text-base font-medium text-slate-200">No applications yet</p>
          <p className="mt-2 text-sm text-slate-400">Add your first application and SkillSync will generate the analytics automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => {
        const isBusy = busyId === application._id;

        return (
          <article
            key={application._id}
            className="rounded-2xl border border-slate-700/65 bg-slate-950/50 p-4 transition duration-300 hover:border-slate-500/65 hover:bg-slate-900/70"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-100">{application.company}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(application.status)}`}>
                    {application.status}
                  </span>
                  {application.referral ? (
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-100">
                      Referral
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-300">{application.role}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Applied {formatDate(application.dateApplied)}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={application.status}
                  disabled={isBusy}
                  onChange={(event) => onStatusChange(application._id, event.target.value as ApplicationStatus)}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onDelete(application._id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
