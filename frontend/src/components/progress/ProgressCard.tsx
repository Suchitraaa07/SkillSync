import { ReactNode } from "react";

type ProgressCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function ProgressCard({ title, subtitle, children, className = "" }: ProgressCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-700/65 bg-[linear-gradient(150deg,rgba(17,24,39,0.94),rgba(10,14,24,0.94)_55%,rgba(4,8,18,0.98))] p-5 shadow-[0_16px_45px_rgba(0,0,0,0.35)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-slate-500/65 hover:shadow-[0_24px_56px_rgba(0,0,0,0.45)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-white/8 to-transparent" />
      <div className="relative">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="relative mt-4">{children}</div>
    </section>
  );
}
