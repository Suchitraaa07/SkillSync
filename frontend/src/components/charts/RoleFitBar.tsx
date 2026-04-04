"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RoleFit = { role: string; fit: number };

const COLORS = ["#22d3ee", "#818cf8", "#f59e0b", "#f97316"];

export function RoleFitBar({ data }: { data: RoleFit[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis
            dataKey="role"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1224",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
          />
          <Bar dataKey="fit" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.role} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
