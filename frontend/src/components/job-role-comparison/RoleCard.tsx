import { ProgressBar } from "./ProgressBar";
import { RoleMatch } from "./types";

type RoleCardProps = {
  role: RoleMatch;
  isTop: boolean;
  statusLabel: string;
  onTestMyself: (role: RoleMatch) => void;
  isTesting: boolean;
  scoreDelta?: number;
};

const toneForMatch = (match: number) => {
  if (match >= 80) {
    return {
      text: "text-emerald-200",
      badge: "border-emerald-400/35 bg-emerald-500/20 text-emerald-100",
      glow: "from-emerald-500/22",
      barTone: "green" as const,
    };
  }
  if (match >= 50) {
    return {
      text: "text-amber-200",
      badge: "border-amber-400/35 bg-amber-500/20 text-amber-100",
      glow: "from-amber-500/22",
      barTone: "yellow" as const,
    };
  }
  return {
    text: "text-rose-200",
    badge: "border-rose-400/35 bg-rose-500/20 text-rose-100",
    glow: "from-rose-500/22",
    barTone: "red" as const,
  };
};

export function RoleCard({ role, isTop, statusLabel, onTestMyself, isTesting, scoreDelta }: RoleCardProps) {
  const tone = toneForMatch(role.match);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_28px_70px_rgba(0,0,0,0.5)] ${
        isTop
          ? "scale-[1.01] border-indigo-300/55 bg-[linear-gradient(150deg,rgba(79,70,229,0.38),rgba(14,23,45,0.8)_50%,rgba(10,14,28,0.95))]"
          : "border-slate-300/20 bg-[linear-gradient(150deg,rgba(30,41,59,0.6),rgba(15,23,42,0.82)_55%,rgba(2,6,23,0.95))]"
      } ${isTesting ? "ring-2 ring-cyan-300/80 shadow-[0_0_0_2px_rgba(125,211,252,0.5),0_28px_70px_rgba(0,0,0,0.5)]" : ""}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tone.glow} to-transparent`} />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl transition duration-500 group-hover:bg-white/10" />
      <div className="pointer-events-none absolute inset-0 border border-white/10 opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent_70%)]" />

      <div className="relative flex items-start justify-between gap-2">
        <h4 className="text-lg font-semibold text-white">{role.name}</h4>
        <div className="flex items-center gap-2">
          {typeof scoreDelta === "number" && scoreDelta > 0 ? (
            <span className="rounded-full border border-cyan-300/35 bg-cyan-400/20 px-2.5 py-1 text-xs font-semibold text-cyan-100">
              +{scoreDelta}
            </span>
          ) : null}
          {isTop ? (
            <span className="rounded-full border border-indigo-300/45 bg-indigo-500/25 px-2.5 py-1 text-xs font-semibold text-indigo-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              Recommended
            </span>
          ) : null}
        </div>
      </div>

      <p className={`relative mt-5 text-5xl font-bold tracking-tight drop-shadow-[0_6px_18px_rgba(0,0,0,0.3)] ${tone.text}`}>
        {role.match}%
      </p>

      <ProgressBar value={role.match} tone={tone.barTone} />

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className={`relative inline-flex rounded-full border px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ${tone.badge}`}>
          {statusLabel}
        </p>

        <button
          onClick={() => onTestMyself(role)}
          className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/25"
        >
          Test Myself
        </button>
      </div>
    </article>
  );
}

