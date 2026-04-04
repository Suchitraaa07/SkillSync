"use client";

const STATUS_STYLES = {
  not_started: "bg-[linear-gradient(145deg,#0f172a,#111827,#2e1065)] border-white/10 text-[#e5e7eb]",
  in_progress: "bg-[linear-gradient(145deg,#111827,#1e1b4b,#4c1d95)] border-[#facc15]/55 text-[#e5e7eb]",
  completed: "bg-[linear-gradient(145deg,#111827,#052e26,#2e1065)] border-[#22c55e]/55 text-[#e5e7eb]",
  locked: "bg-[linear-gradient(145deg,#0f172a,#111827,#312e81)] border-[#6b7280]/55 text-[#9ca3af]",
};

export function NodeCard({ label, size = "subtopic", status = "not_started", selected = false, onClick }) {
  const sizing = size === "main" ? "min-h-[60px] min-w-[220px] px-5 py-3 text-base" : "min-h-[48px] min-w-[150px] px-4 py-2 text-sm";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.not_started;
  const canClick = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canClick}
      className={[
        "relative rounded-2xl border text-center font-semibold backdrop-blur-sm",
        "shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300 ease-out",
        canClick ? "hover:-translate-y-[3px] hover:shadow-[0_0_28px_rgba(139,92,246,0.32)]" : "",
        selected
          ? "scale-[1.05] border-[#8b5cf6] shadow-[0_0_24px_rgba(139,92,246,0.6)]"
          : "border-white/10",
        sizing,
        statusStyle,
      ].join(" ")}
    >
      <span>{label || "Untitled"}</span>
      {status === "not_started" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6b7280] text-[10px] text-white" />
      ) : null}
      {status === "in_progress" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#facc15] text-[10px] font-bold text-slate-900">~</span>
      ) : null}
      {status === "completed" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-white">v</span>
      ) : null}
      {status === "locked" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#6b7280] text-[10px] text-white">o</span>
      ) : null}
    </button>
  );
}
