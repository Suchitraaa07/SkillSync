"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/components/applications/ChartEmptyState";

type RoleSuccessChartProps = {
  data: { label: string; value: number; total: number }[];
};

export function RoleSuccessChart({ data }: RoleSuccessChartProps) {
  if (!data.length) {
    return <ChartEmptyState message="Role success rate needs a few applications before patterns become meaningful." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1224",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value, _name, item) => [
              `${Number(value ?? 0)}%`,
              `${(item && typeof item === "object" && "payload" in item && item.payload && typeof item.payload === "object" && "total" in item.payload
                ? Number((item.payload as { total?: number }).total ?? 0)
                : 0)} applications`,
            ]}
          />
          <Bar dataKey="value" fill="#34d399" radius={[0, 12, 12, 0]} barSize={24}>
            <LabelList dataKey="value" position="right" formatter={(value) => `${Number(value ?? 0)}%`} fill="#a7f3d0" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
