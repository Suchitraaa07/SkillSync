"use client";

export function Connector({ orientation = "vertical", length = 20, dashed = false, className = "" }) {
  const line = dashed ? "border-dashed" : "border-solid";
  const sizeValue = typeof length === "number" ? `${length}px` : length;
  const style = orientation === "vertical" ? { height: sizeValue } : { width: sizeValue };

  if (orientation === "horizontal") {
    return <div className={`border-t-2 ${line} border-[rgba(203,213,225,0.28)] rounded-full ${className}`} style={style} />;
  }

  return <div className={`border-l-2 ${line} border-[rgba(203,213,225,0.28)] rounded-full ${className}`} style={style} />;
}
