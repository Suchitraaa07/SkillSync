"use client";

import { ConnectorLines } from "@/components/roadmap/ConnectorLines";

export function RoadmapContainer({ children }) {
  return (
    <div className="relative max-h-[760px] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950/65 p-4">
      <div className="pointer-events-none absolute bottom-4 left-1/2 top-4 hidden -translate-x-1/2 md:block">
        <ConnectorLines orientation="vertical" length="100%" className="rounded-full border-blue-300/70" />
      </div>
      <div className="relative z-10 space-y-8">{children}</div>
    </div>
  );
}
