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

type ReferralImpactChartProps = {
  data: { label: string; value: number }[];
};

const COLORS = ["#a78bfa", "#38bdf8"];

export function ReferralImpactChart({ data }: ReferralImpactChartProps) {
  if (!data.some((item) => item.value > 0)) {
    return <ChartEmptyState message="Referral impact will appear once your applications create a measurable pattern." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{
              background: "#0b1224",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value) => [`${Number(value ?? 0)}%`, "Success rate"]}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={42}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
