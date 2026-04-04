import { ReactNode } from "react";

type AnalyticsCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AnalyticsCard({ title, subtitle, action, children, className = "" }: AnalyticsCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-700/65 bg-[linear-gradient(160deg,rgba(17,24,39,0.94),rgba(9,14,24,0.98)_65%,rgba(2,6,18,1))] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-500/65 hover:shadow-[0_24px_56px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/8 to-transparent" />
      <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
