"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { createdAt: string; score: number };

export function ReadinessLine({ data }: { data: Point[] }) {
  const normalized = data.map((item, idx) => ({
    name: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : `#${idx + 1}`,
    score: item.score,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={normalized}>
          <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
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
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: "12px",
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#a5b4fc" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#60a5fa"
            strokeWidth={3}
            dot={{ fill: "#93c5fd", r: 3 }}
            activeDot={{ r: 5, fill: "#dbeafe" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
