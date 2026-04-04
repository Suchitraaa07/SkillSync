type ProgressBarProps = {
  value: number;
  tone: "green" | "yellow" | "red";
};

const toneClasses: Record<ProgressBarProps["tone"], string> = {
  green: "bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.55)]",
  yellow: "bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.55)]",
  red: "bg-rose-400 shadow-[0_0_24px_rgba(251,113,133,0.55)]",
};

export function ProgressBar({ value, tone }: ProgressBarProps) {
  return (
    <div className="relative mt-4 h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
      <div
        className={`h-full rounded-full transition-all duration-700 ${toneClasses[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

