"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type SkillPoint = { skill: string; strength: number };

export function SkillRadar({ data }: { data: SkillPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
          <Radar name="Skill" dataKey="strength" stroke="#dc2626" fill="#fca5a5" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
