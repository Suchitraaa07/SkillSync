type ProjectionCardProps = {
  current: number;
  projected: number;
  fullRoadmap: number;
};

export function ProjectionCard({ current, projected, fullRoadmap }: ProjectionCardProps) {
  return (
    <div className="relative rounded-2xl bg-linear-to-r from-emerald-300/70 via-cyan-300/55 to-amber-300/75 p-px shadow-[0_0_45px_rgba(16,185,129,0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_55px_rgba(16,185,129,0.22)]">
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,rgba(9,13,27,0.95),rgba(14,20,33,0.95))] p-5">
        <div className="pointer-events-none absolute -left-10 top-6 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl" />

        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Highlight Feature</p>
        <h3 className="mt-1 bg-linear-to-r from-emerald-100 via-cyan-100 to-amber-100 bg-clip-text text-2xl font-semibold text-transparent">
          30-Day Projection
        </h3>

        <div className="mt-4 grid gap-2 text-sm text-slate-200">
          <div className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/50 px-3 py-2">
            <span>Current Score</span>
            <strong className="text-slate-100">{current}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
            <span>Projected</span>
            <strong>{projected}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-amber-100">
            <span>With Full Roadmap</span>
            <strong>{fullRoadmap}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
