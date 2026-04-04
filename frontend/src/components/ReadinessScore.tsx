import { useEffect, useState } from "react";

type ReadinessScoreProps = {
  score: number;
  readinessLevel: string;
};

const colorMeta = (score: number) => {
  if (score >= 80) {
    return {
      text: "text-emerald-200",
      ring: "#34d399",
      bar: "bg-emerald-400",
      badge: "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
    };
  }
  if (score >= 60) {
    return {
      text: "text-amber-200",
      ring: "#fbbf24",
      bar: "bg-amber-400",
      badge: "border-amber-300/35 bg-amber-500/15 text-amber-100",
    };
  }
  return {
    text: "text-rose-200",
    ring: "#fb7185",
    bar: "bg-rose-400",
    badge: "border-rose-300/35 bg-rose-500/15 text-rose-100",
  };
};

export function ReadinessScore({ score, readinessLevel }: ReadinessScoreProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const tone = colorMeta(safeScore);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= safeScore) {
        setDisplayScore(safeScore);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [safeScore]);

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(99,102,241,0.2),rgba(30,41,59,0.55)_30%,rgba(15,23,42,0.85)_62%,rgba(2,6,23,0.95))] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.38)] backdrop-blur-xl transition duration-300 hover:scale-[1.01] hover:shadow-[0_24px_75px_rgba(99,102,241,0.24)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-8 h-28 w-28 rounded-full bg-fuchsia-400/14 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent opacity-40" />
      <h3 className="text-3xl font-semibold text-white">Readiness Score</h3>
      <div className="mt-4 h-px bg-gradient-to-r from-indigo-300/35 via-fuchsia-300/25 to-transparent" />

      <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:flex-row sm:justify-start">
        <div
          className="grid h-36 w-36 place-items-center rounded-full border border-white/10 bg-slate-950/70 transition-all duration-700"
          style={{
            background: `conic-gradient(from 180deg, ${tone.ring} ${displayScore * 3.6}deg, #22d3ee 0deg, rgba(51,65,85,0.55) 0deg)`,
            boxShadow: `0 0 28px ${tone.ring}40`,
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-slate-950 text-center">
            <span className={`text-4xl font-bold ${tone.text}`}>{displayScore}%</span>
          </div>
        </div>

        <div className="w-full sm:max-w-md">
          <p
            className={`inline-flex rounded-full border px-4 py-1.5 text-base font-semibold ${tone.badge} ${
              readinessLevel === "Highly Ready" ? "animate-pulse" : ""
            }`}
          >
            {readinessLevel}
          </p>
          <p className="mt-3 text-xl leading-relaxed text-slate-200">
            This score represents how closely your extracted resume skills align with the selected role.
          </p>

          <div className="mt-4 h-4 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
            <div
              className={`h-full ${tone.bar} transition-all duration-700`}
              style={{ width: `${displayScore}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-400">Current readiness: {displayScore}%</p>
        </div>
      </div>
    </section>
  );
}
