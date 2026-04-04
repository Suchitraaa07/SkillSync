"use client";

import { useEffect, useMemo, useState } from "react";
import { CircularScoreCard } from "@/components/progress/CircularScoreCard";

type TrendPoint = {
  label: string;
  primary: number;
};

export type GithubMetrics = {
  totalRepositories: number;
  commits30d: number;
  pullRequests30d: number;
  starsReceived: number;
  longestStreak: number;
  contributions30d: TrendPoint[];
};

export type LeetCodeMetrics = {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestParticipation: number;
  contestRating: number;
  currentStreak: number;
  solvedTrend30d: TrendPoint[];
};

type ProgressTrackerCardsProps = {
  githubData?: GithubMetrics;
  leetCodeData?: LeetCodeMetrics;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const buildDayLabel = (index: number) => `D${String(index + 1).padStart(2, "0")}`;

const githubScore = (data: GithubMetrics) => {
  const commitScore = clamp((data.commits30d / 120) * 100) * 0.3;
  const prScore = clamp((data.pullRequests30d / 20) * 100) * 0.2;
  const repoScore = clamp((data.totalRepositories / 15) * 100) * 0.2;
  const starsScore = clamp((data.starsReceived / 80) * 100) * 0.1;
  const streakScore = clamp((data.longestStreak / 30) * 100) * 0.2;
  return Math.round(commitScore + prScore + repoScore + starsScore + streakScore);
};

const ratioBalanceScore = (easy: number, medium: number, hard: number) => {
  const total = Math.max(1, easy + medium + hard);
  const easyPct = (easy / total) * 100;
  const mediumPct = (medium / total) * 100;
  const hardPct = (hard / total) * 100;

  // Target balance: 45% easy, 40% medium, 15% hard.
  const diff = Math.abs(easyPct - 45) + Math.abs(mediumPct - 40) + Math.abs(hardPct - 15);
  return clamp(100 - diff * 1.2);
};

const leetcodeScore = (data: LeetCodeMetrics) => {
  const solvedScore = clamp((data.totalSolved / 800) * 100) * 0.4;
  const balanceScore = ratioBalanceScore(data.easySolved, data.mediumSolved, data.hardSolved) * 0.2;
  const contestScore = clamp((data.contestParticipation / 12) * 100) * 0.2;
  const streakScore = clamp((data.currentStreak / 30) * 100) * 0.2;
  return Math.round(solvedScore + balanceScore + contestScore + streakScore);
};

const defaultGithubMetrics: GithubMetrics = {
    totalRepositories: 18,
    commits30d: 146,
    pullRequests30d: 23,
    starsReceived: 41,
    longestStreak: 19,
    contributions30d: Array.from({ length: 30 }, (_, index) => ({
      label: buildDayLabel(index),
      primary: [2, 4, 5, 3, 7, 8, 6, 4, 5, 9, 7, 6, 5, 10, 8, 7, 6, 5, 9, 11, 10, 8, 7, 6, 9, 12, 10, 8, 7, 9][index],
    })),
  };

const defaultLeetCodeMetrics: LeetCodeMetrics = {
    totalSolved: 412,
    easySolved: 188,
    mediumSolved: 176,
    hardSolved: 48,
    contestParticipation: 9,
    contestRating: 1728,
    currentStreak: 24,
    solvedTrend30d: Array.from({ length: 30 }, (_, index) => ({
      label: buildDayLabel(index),
      primary: [4, 3, 5, 4, 6, 7, 5, 4, 5, 6, 7, 5, 4, 6, 8, 7, 6, 5, 6, 7, 8, 6, 5, 6, 7, 9, 8, 6, 5, 7][index],
    })),
  };

export function ProgressTrackerCards({ githubData, leetCodeData }: ProgressTrackerCardsProps) {
  const [githubMetrics, setGithubMetrics] = useState<GithubMetrics>(githubData || defaultGithubMetrics);
  const [leetcodeMetrics, setLeetcodeMetrics] = useState<LeetCodeMetrics>(leetCodeData || defaultLeetCodeMetrics);

  useEffect(() => {
    if (githubData) {
      setGithubMetrics(githubData);
    }
  }, [githubData]);

  useEffect(() => {
    if (leetCodeData) {
      setLeetcodeMetrics(leetCodeData);
    }
  }, [leetCodeData]);

  const githubGrowthScore = useMemo(() => githubScore(githubMetrics), [githubMetrics]);
  const leetCodeGrowthScore = useMemo(() => leetcodeScore(leetcodeMetrics), [leetcodeMetrics]);

  const githubTrendSummary = useMemo(() => {
    const source = githubMetrics.contributions30d;
    const start = source[0]?.primary || 0;
    const end = source[source.length - 1]?.primary || 0;
    const delta = end - start;
    return `${delta >= 0 ? "+" : ""}${delta} commits/day momentum over 30 days`;
  }, [githubMetrics.contributions30d]);

  const leetcodeTrendSummary = useMemo(() => {
    const source = leetcodeMetrics.solvedTrend30d;
    const start = source[0]?.primary || 0;
    const end = source[source.length - 1]?.primary || 0;
    const delta = end - start;
    return `${delta >= 0 ? "+" : ""}${delta} problems/day momentum over 30 days`;
  }, [leetcodeMetrics.solvedTrend30d]);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <CircularScoreCard
        title="GitHub Growth"
        subtitle="Repository & Contribution Activity"
        score={githubGrowthScore}
        trend={githubMetrics.contributions30d}
        trendSummary={githubTrendSummary}
        stats={[
          { label: "Public Repositories", value: String(githubMetrics.totalRepositories) },
          { label: "Total Commits (Last 30 Days)", value: String(githubMetrics.commits30d) },
          { label: "Longest Streak", value: `${githubMetrics.longestStreak} days` },
          { label: "Profile Strength Score", value: `${githubGrowthScore}/100` },
        ]}
        ringColor="#34d399"
        ringGlow="rgba(52,211,153,0.25)"
        scoreTextColor="text-emerald-100"
      />

      <CircularScoreCard
        title="LeetCode Progress"
        subtitle="Problem Solving Consistency"
        score={leetCodeGrowthScore}
        trend={leetcodeMetrics.solvedTrend30d}
        trendSummary={leetcodeTrendSummary}
        stats={[
          { label: "Total Problems Solved", value: String(leetcodeMetrics.totalSolved) },
          {
            label: "Easy / Medium / Hard",
            value: `${leetcodeMetrics.easySolved} / ${leetcodeMetrics.mediumSolved} / ${leetcodeMetrics.hardSolved}`,
          },
          { label: "Contest Rating", value: String(leetcodeMetrics.contestRating) },
          { label: "Current Streak", value: `${leetcodeMetrics.currentStreak} days` },
        ]}
        ringColor="#f59e0b"
        ringGlow="rgba(245,158,11,0.24)"
        scoreTextColor="text-amber-100"
      />
    </section>
  );
}
