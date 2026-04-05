"use client";

import { ROLE_OPTIONS } from "@/utils/roadmapRoleMap";

export function RoleSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 backdrop-blur">
      <label htmlFor="roadmap-role" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Learning Role
      </label>
      <select
        id="roadmap-role"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[220px] rounded-xl border border-slate-600 bg-[#111827] px-3.5 py-2 text-sm text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
      >
        {ROLE_OPTIONS.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </div>
  );
}
