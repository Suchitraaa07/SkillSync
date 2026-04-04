"use client";

export function ConnectorLines({ orientation = "vertical", length = 24, dashed = false, className = "" }) {
  const lineClass = dashed ? "border-dashed" : "border-solid";
  const style = typeof length === "number" ? (orientation === "vertical" ? { height: `${length}px` } : { width: `${length}px` }) : orientation === "vertical" ? { height: length } : { width: length };

  if (orientation === "horizontal") {
    return <div className={`${lineClass} border-t-2 border-slate-400/80 ${className}`} style={style} />;
  }

  return <div className={`${lineClass} border-l-2 border-slate-400/80 ${className}`} style={style} />;
}
