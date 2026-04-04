import { LucideIcon, TrendingUp } from "lucide-react";

type StatItemProps = {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
};

export function StatItem({ label, value, delta, icon: Icon = TrendingUp }: StatItemProps) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-3.5 transition duration-300 hover:border-emerald-300/25 hover:bg-slate-900/90">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        {delta ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-100">
            <Icon className="h-3.5 w-3.5" />
            {delta}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
