import { ReactNode } from "react";
import { ChevronUp } from "lucide-react";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { TrendChart } from "@/components/progress/TrendChart";

type TrendPoint = {
  label: string;
  primary: number;
};

type Stat = {
  label: string;
  value: string;
};

type CircularScoreCardProps = {
  title: string;
  subtitle: string;
  score: number;
  trend: TrendPoint[];
  trendSummary: string;
  stats: Stat[];
  ringColor?: string;
  ringGlow?: string;
  scoreTextColor?: string;
  footer?: ReactNode;
};

export function CircularScoreCard({
  title,
  subtitle,
  score,
  trend,
  trendSummary,
  stats,
  ringColor = "#34d399",
  ringGlow = "rgba(52,211,153,0.25)",
  scoreTextColor = "text-emerald-100",
  footer,
}: CircularScoreCardProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <ProgressCard title={title} subtitle={subtitle} className="overflow-hidden h-full">
      <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute h-40 w-40 rounded-full bg-emerald-500/18 blur-2xl" />
          <div
            className="grid h-44 w-44 place-items-center rounded-full border border-white/10 bg-slate-950/75"
            style={{
              background: `conic-gradient(from 180deg, ${ringColor} ${safeScore * 3.6}deg, rgba(51,65,85,0.55) 0deg)`,
              boxShadow: `0 0 35px ${ringGlow}`,
            }}
          >
            <div className="grid h-34 w-34 place-items-center rounded-full bg-slate-950/95 text-center">
              <p className={`text-4xl font-bold ${scoreTextColor}`}>{safeScore}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">out of 100</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            <ChevronUp className="h-3.5 w-3.5" />
            {trendSummary}
          </p>
          <TrendChart data={trend} variant="line" height={200} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-700/65 bg-slate-900/60 px-3.5 py-3 transition duration-300 hover:border-emerald-300/25">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </ProgressCard>
  );
}
