export type ConnectedProfiles = {
  linkedin: string;
  github: string;
  leetcode: string;
};

export type ProfileSignals = {
  strengths: {
    linkedin: number;
    github: number;
    leetcode: number;
  };
  connectedCount: number;
  insights: string[];
  benchmark: {
    topPercentile: number;
    dsaPercentile: number;
    shortlistChance: number;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const stringScore = (value: string, seed: number) => {
  if (!value) return 0;
  let hash = seed;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000003;
  }
  return 45 + (hash % 51);
};

const extractHandle = (url: string) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.split("/").filter(Boolean);
    return path[path.length - 1] || parsed.hostname;
  } catch {
    const path = url.split("/").filter(Boolean);
    return path[path.length - 1] || url;
  }
};

export const computeProfileSignals = (
  profiles: ConnectedProfiles,
  readinessScore: number
): ProfileSignals => {
  const linkedinHandle = extractHandle(profiles.linkedin);
  const githubHandle = extractHandle(profiles.github);
  const leetcodeHandle = extractHandle(profiles.leetcode);

  const linkedin = profiles.linkedin ? stringScore(linkedinHandle, 17) : 0;
  const github = profiles.github ? stringScore(githubHandle, 29) : 0;
  const leetcode = profiles.leetcode ? stringScore(leetcodeHandle, 41) : 0;

  const connectedCount = [profiles.linkedin, profiles.github, profiles.leetcode].filter(
    Boolean
  ).length;

  const insights: string[] = [];
  if (leetcode >= 70 && github > 0 && github < 60) {
    insights.push("LeetCode strong + GitHub weak: add 2 real-world repositories with readme demos.");
  }
  if (github >= 70 && leetcode > 0 && leetcode < 60) {
    insights.push("GitHub strong + DSA consistency low: solve 3-4 medium problems weekly.");
  }
  if (linkedin > 0 && linkedin < 60) {
    insights.push("LinkedIn presence is light: optimize headline, summary, and project highlights.");
  }
  if (connectedCount < 3) {
    insights.push("Connect all profiles for sharper cross-platform recommendations.");
  }
  if (!insights.length) {
    insights.push("Your profile signals are balanced. Keep shipping projects and documenting outcomes.");
  }

  const averageSignal =
    connectedCount > 0 ? (linkedin + github + leetcode) / connectedCount : Math.max(30, readinessScore * 0.6);

  const topPercentile = clamp(Math.round(100 - averageSignal * 0.72), 8, 92);
  const dsaPercentile = clamp(Math.round(100 - (leetcode || averageSignal) * 0.85), 6, 95);
  const shortlistChance = clamp(
    Math.round(readinessScore * 0.58 + averageSignal * 0.42),
    22,
    97
  );

  return {
    strengths: {
      linkedin,
      github,
      leetcode,
    },
    connectedCount,
    insights,
    benchmark: {
      topPercentile,
      dsaPercentile,
      shortlistChance,
    },
  };
};
