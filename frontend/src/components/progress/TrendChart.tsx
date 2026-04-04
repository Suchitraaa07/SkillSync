"use client";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendDatum = {
  label: string;
  primary: number;
  secondary?: number;
};

type TrendChartProps = {
  data: TrendDatum[];
  variant?: "line" | "dual" | "mini";
  height?: number;
};

const tooltipStyle = {
  background: "#0b1224",
  border: "1px solid rgba(99, 102, 241, 0.35)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

export function TrendChart({ data, variant = "line", height = 220 }: TrendChartProps) {
  if (variant === "dual") {
    return (
      <div style={{ height }} className="w-full">
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a5b4fc" }} />
            <Bar dataKey="primary" barSize={22} fill="rgba(99,102,241,0.4)" radius={[10, 10, 0, 0]} />
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ fill: "#67e8f9", r: 2.5 }}
              activeDot={{ r: 4, fill: "#cffafe" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (variant === "mini") {
    return (
      <div style={{ height }} className="w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="miniTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "dataMax + 1"]} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a5b4fc" }} />
            <Area type="monotone" dataKey="primary" stroke="#38bdf8" strokeWidth={2} fill="url(#miniTrend)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={32} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#a5b4fc" }} />
          <Area type="monotone" dataKey="primary" stroke="#60a5fa" strokeWidth={2.8} fill="url(#growthArea)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
