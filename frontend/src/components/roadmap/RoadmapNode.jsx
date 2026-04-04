"use client";

const STATUS_STYLES = {
  pending: "bg-amber-200 border-amber-300 text-slate-900",
  completed: "bg-emerald-200 border-emerald-300 text-slate-900",
  locked: "bg-slate-300 border-slate-400 text-slate-700",
};

export function RoadmapNode({ label, size = "subtopic", status = "pending", selected = false, onClick }) {
  const sizing = size === "main" ? "min-h-[60px] min-w-[220px] px-5 py-3 text-base" : "min-h-[48px] min-w-[160px] px-4 py-2.5 text-sm";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const canClick = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canClick}
      className={[
        "relative rounded-xl border-2 text-center font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition",
        canClick ? "hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.22)]" : "",
        selected ? "ring-2 ring-violet-500/75" : "",
        sizing,
        statusStyle,
      ].join(" ")}
    >
      <span>{label || "Untitled"}</span>
      {status === "completed" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">v</span>
      ) : null}
      {status === "locked" ? (
        <span className="absolute -left-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-[10px] text-white">o</span>
      ) : null}
    </button>
  );
}
