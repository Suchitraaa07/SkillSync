"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/components/applications/ChartEmptyState";

type ApplicationsOverTimeChartProps = {
  data: { label: string; value: number }[];
};

const tooltipStyle = {
  background: "#0b1224",
  border: "1px solid rgba(56, 189, 248, 0.35)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

export function ApplicationsOverTimeChart({ data }: ApplicationsOverTimeChartProps) {
  if (!data.length) {
    return <ChartEmptyState message="Add your first application to start tracking weekly momentum." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#7dd3fc" }}
            formatter={(value) => [`${Number(value ?? 0)}`, "Applications"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ r: 3, fill: "#67e8f9" }}
            activeDot={{ r: 5, fill: "#dbeafe" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
