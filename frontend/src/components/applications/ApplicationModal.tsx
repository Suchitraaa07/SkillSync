"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import {
  APPLICATION_STATUSES,
  ApplicationFormValues,
  ApplicationStatus,
} from "@/components/applications/types";

type ApplicationModalProps = {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
};

const COMMON_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer Intern",
  "Data Analyst",
  "Product Manager",
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ApplicationModal({ open, isSaving, onClose, onSubmit }: ApplicationModalProps) {
  const [form, setForm] = useState<ApplicationFormValues>({
    company: "",
    role: "",
    status: "Applied",
    referral: false,
    dateApplied: todayValue(),
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      company: "",
      role: "",
      status: "Applied",
      referral: false,
      dateApplied: todayValue(),
    });
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700/70 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(9,13,24,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Quick Add</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">Add application</h2>
            <p className="mt-1 text-sm text-slate-400">Only the essentials so you can log a job in a few seconds.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-950/80 p-2 text-slate-300 transition hover:text-white"
            aria-label="Close application form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Company Name</span>
              <input
                required
                maxLength={120}
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Google"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Role</span>
              <input
                required
                maxLength={120}
                list="application-role-options"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="Frontend Developer"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
              />
              <datalist id="application-role-options">
                {COMMON_ROLES.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as ApplicationStatus }))
                }
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Date Applied</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                <input
                  readOnly
                  value={form.dateApplied}
                  className="w-full bg-transparent outline-none"
                  aria-label="Date applied"
                />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-100">Referral</p>
              <p className="text-xs text-slate-400">Turn on if this application came through a referral.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.referral}
              onClick={() => setForm((prev) => ({ ...prev, referral: !prev.referral }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                form.referral ? "bg-emerald-500/85" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  form.referral ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl border border-cyan-300/25 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
