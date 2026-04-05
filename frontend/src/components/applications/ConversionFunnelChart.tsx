"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/components/applications/ChartEmptyState";

type ConversionFunnelChartProps = {
  data: { label: string; value: number }[];
};

const COLORS = ["#38bdf8", "#34d399", "#f59e0b", "#a78bfa"];

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  if (!data.some((item) => item.value > 0)) {
    return <ChartEmptyState message="Your funnel will appear here as soon as applications start moving through stages." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{
              background: "#0b1224",
              border: "1px solid rgba(129, 140, 248, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value) => [`${Number(value ?? 0)}`, "Reached"]}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={34}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
