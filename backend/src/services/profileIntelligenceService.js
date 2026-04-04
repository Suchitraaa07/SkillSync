const axios = require("axios");
const cheerio = require("cheerio");

const normalizeUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) return "";
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
};

const parseUsernameFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toISODate = (date) => date.toISOString().slice(0, 10);

const getLastNDates = (days) => {
  const result = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    result.push(toISODate(d));
  }

  return result;
};

const buildMomentum = (values) => {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const avg = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0);
  return Number((avg(secondHalf) - avg(firstHalf)).toFixed(1));
};

const longestPositiveStreak = (values) => {
  let best = 0;
  let current = 0;

  values.forEach((value) => {
    if (value > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });

  return best;
};

const fetchGithubContributions = async (username) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    const response = await axios.get(`https://github.com/users/${username}/contributions`, {
      params: { from: toISODate(start), to: toISODate(end) },
      timeout: 12000,
      headers: {
        "User-Agent": "SkillSync-AI",
        Accept: "text/html",
      },
    });

    const $ = cheerio.load(String(response.data || ""));
    const map = new Map();

    $("rect[data-date]").each((_, el) => {
      const date = $(el).attr("data-date");
      const count = Number($(el).attr("data-count") || 0);
      if (date) map.set(date, count);
    });

    const last30Dates = getLastNDates(30);
    const daily = last30Dates.map((date) => ({ date, count: map.get(date) || 0 }));
    const totalCommits30d = daily.reduce((sum, item) => sum + item.count, 0);

    return {
      daily,
      totalCommits30d,
      longestStreakDays: longestPositiveStreak(daily.map((d) => d.count)),
      momentumPerDay: buildMomentum(daily.map((d) => d.count)),
    };
  } catch {
    return {
      daily: getLastNDates(30).map((date) => ({ date, count: 0 })),
      totalCommits30d: 0,
      longestStreakDays: 0,
      momentumPerDay: 0,
    };
  }
};

const fetchGithub = async (url) => {
  if (!url) {
    return { connected: false, username: "", stats: null, message: "GitHub not connected" };
  }

  const username = parseUsernameFromUrl(url);
  if (!username) {
    return { connected: true, username: "", stats: null, message: "Invalid GitHub URL" };
  }

  try {
    const [userRes, reposRes, contributionStats] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { timeout: 10000 }),
      axios.get(`https://api.github.com/users/${username}/repos`, {
        params: { per_page: 100, sort: "updated" },
        timeout: 10000,
      }),
      fetchGithubContributions(username),
    ]);

    const repos = Array.isArray(reposRes.data) ? reposRes.data : [];
    const totalStars = repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);

    return {
      connected: true,
      username,
      stats: {
        followers: Number(userRes.data?.followers || 0),
        publicRepos: Number(userRes.data?.public_repos || 0),
        totalStars,
        totalCommits30d: contributionStats.totalCommits30d,
        longestStreakDays: contributionStats.longestStreakDays,
        momentumPerDay: contributionStats.momentumPerDay,
        dailyContributions: contributionStats.daily,
      },
      message: "GitHub stats fetched",
    };
  } catch (error) {
    return {
      connected: true,
      username,
      stats: null,
      message: error?.response?.status === 404 ? "GitHub profile not found" : "GitHub stats unavailable",
    };
  }
};

const fetchLeetCode = async (url) => {
  if (!url) {
    return { connected: false, username: "", stats: null, message: "LeetCode not connected" };
  }

  const username = parseUsernameFromUrl(url);
  if (!username) {
    return { connected: true, username: "", stats: null, message: "Invalid LeetCode URL" };
  }

  const profileQuery = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const calendarQuery = `
    query userProfileCalendar($username: String!, $year: Int) {
      matchedUser(username: $username) {
        userCalendar(year: $year) {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `;

  const contestQuery = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
      }
    }
  `;

  try {
    const [profileRes, calendarRes, contestRes] = await Promise.all([
      axios.post(
        "https://leetcode.com/graphql",
        { query: profileQuery, variables: { username } },
        {
          timeout: 12000,
          headers: {
            "content-type": "application/json",
            referer: "https://leetcode.com",
          },
        }
      ),
      axios.post(
        "https://leetcode.com/graphql",
        { query: calendarQuery, variables: { username, year: new Date().getFullYear() } },
        {
          timeout: 12000,
          headers: {
            "content-type": "application/json",
            referer: "https://leetcode.com",
          },
        }
      ).catch(() => ({ data: { data: { matchedUser: { userCalendar: null } } } })),
      axios.post(
        "https://leetcode.com/graphql",
        { query: contestQuery, variables: { username } },
        {
          timeout: 12000,
          headers: {
            "content-type": "application/json",
            referer: "https://leetcode.com",
          },
        }
      ).catch(() => ({ data: { data: { userContestRanking: null } } })),
    ]);

    const matched = profileRes.data?.data?.matchedUser;
    if (!matched) {
      return { connected: true, username, stats: null, message: "LeetCode profile not found" };
    }

    const ac = Array.isArray(matched.submitStats?.acSubmissionNum)
      ? matched.submitStats.acSubmissionNum
      : [];

    const all = ac.find((item) => String(item?.difficulty || "").toLowerCase() === "all");
    const easy = ac.find((item) => String(item?.difficulty || "").toLowerCase() === "easy");
    const medium = ac.find((item) => String(item?.difficulty || "").toLowerCase() === "medium");
    const hard = ac.find((item) => String(item?.difficulty || "").toLowerCase() === "hard");

    const userCalendar = calendarRes.data?.data?.matchedUser?.userCalendar;
    const submissionCalendarRaw = userCalendar?.submissionCalendar;
    let submissionCalendar = {};
    try {
      submissionCalendar = submissionCalendarRaw ? JSON.parse(submissionCalendarRaw) : {};
    } catch {
      submissionCalendar = {};
    }

    const last30Dates = getLastNDates(30);
    const dailySubmissions = last30Dates.map((date) => {
      const unix = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
      return {
        date,
        count: Number(submissionCalendar[String(unix)] || 0),
      };
    });

    const contestRating = Number(contestRes.data?.data?.userContestRanking?.rating || 0);

    return {
      connected: true,
      username,
      stats: {
        ranking: Number(matched.profile?.ranking || 0),
        reputation: Number(matched.profile?.reputation || 0),
        solved: Number(all?.count || 0),
        mediumSolved: Number(medium?.count || 0),
        easySolved: Number(easy?.count || 0),
        hardSolved: Number(hard?.count || 0),
        contestRating,
        currentStreakDays: Number(userCalendar?.streak || 0),
        dailySubmissions,
        momentumPerDay: buildMomentum(dailySubmissions.map((d) => d.count)),
      },
      message: "LeetCode stats fetched",
    };
  } catch {
    return {
      connected: true,
      username,
      stats: null,
      message: "LeetCode stats unavailable",
    };
  }
};

const fetchLinkedIn = async (url) => {
  if (!url) {
    return { connected: false, username: "", stats: null, message: "LinkedIn not connected" };
  }

  const username = parseUsernameFromUrl(url);
  if (!username) {
    return { connected: true, username: "", stats: null, message: "Invalid LinkedIn URL" };
  }

  // LinkedIn does not provide open public profile APIs for this use case.
  return {
    connected: true,
    username,
    stats: null,
    message: "LinkedIn connected. Public metrics require LinkedIn partner API access.",
  };
};

const analyzeProfiles = async ({ linkedin, github, leetcode, readinessScore = 0 }) => {
  const normalized = {
    linkedin: normalizeUrl(linkedin),
    github: normalizeUrl(github),
    leetcode: normalizeUrl(leetcode),
  };

  const [linkedinData, githubData, leetcodeData] = await Promise.all([
    fetchLinkedIn(normalized.linkedin),
    fetchGithub(normalized.github),
    fetchLeetCode(normalized.leetcode),
  ]);

  const connectedCount = [normalized.linkedin, normalized.github, normalized.leetcode].filter(Boolean).length;

  const githubRepos = githubData.stats?.publicRepos || 0;
  const githubStars = githubData.stats?.totalStars || 0;
  const lcSolved = leetcodeData.stats?.solved || 0;
  const lcMedium = leetcodeData.stats?.mediumSolved || 0;

  const insights = [];
  if (lcSolved >= 150 && githubRepos < 6) {
    insights.push("Strong coding practice detected, but GitHub project depth is low. Build and publish 2-3 production projects.");
  }
  if (githubRepos >= 8 && lcSolved > 0 && lcSolved < 120) {
    insights.push("Good project activity, but coding-round readiness can improve. Increase DSA consistency.");
  }
  if (githubStars >= 20) {
    insights.push("Your open-source visibility is growing. Highlight starred work in your resume.");
  }
  if (!insights.length) {
    insights.push("Profile signals are moderate. Improve both project quality and interview problem-solving consistency.");
  }
  if (connectedCount < 3) {
    insights.push("Connect all profiles for richer multi-platform analysis.");
  }

  const githubSignal = clamp(35 + githubRepos * 3 + Math.min(20, githubStars), 20, 95);
  const lcSignal = leetcodeData.stats
    ? clamp(25 + lcSolved * 0.22 + lcMedium * 0.28 + (leetcodeData.stats.ranking > 0 ? 15 : 0), 18, 97)
    : 0;
  const linkedinSignal = normalized.linkedin ? 58 : 0;

  const activeSignals = [githubSignal, lcSignal, linkedinSignal].filter((n) => n > 0);
  const avgSignal = activeSignals.length
    ? activeSignals.reduce((sum, value) => sum + value, 0) / activeSignals.length
    : Math.max(35, readinessScore * 0.6);

  const shortlistChance = clamp(Math.round(readinessScore * 0.56 + avgSignal * 0.44), 20, 96);
  const topPercentile = clamp(Math.round(100 - avgSignal * 0.72), 7, 95);
  const dsaPercentile = leetcodeData.stats
    ? clamp(Math.round(100 - lcSignal * 0.82), 5, 98)
    : null;

  return {
    profileLinks: normalized,
    connectedCount,
    providers: {
      linkedin: linkedinData,
      github: githubData,
      leetcode: leetcodeData,
    },
    crossPlatform: {
      insights,
      strengths: {
        linkedin: linkedinSignal,
        github: githubSignal,
        leetcode: lcSignal,
      },
    },
    benchmarking: {
      topPercentile,
      dsaPercentile,
      shortlistChance,
    },
    githubGrowth: {
      score: githubSignal,
      totalRepositories: githubData.stats?.publicRepos || 0,
      totalCommits30d: githubData.stats?.totalCommits30d || 0,
      longestStreakDays: githubData.stats?.longestStreakDays || 0,
      profileStrengthScore: githubSignal,
      momentumPerDay: githubData.stats?.momentumPerDay || 0,
      dailySeries: githubData.stats?.dailyContributions || getLastNDates(30).map((date) => ({ date, count: 0 })),
    },
    leetcodeProgress: {
      score: lcSignal,
      totalProblemsSolved: leetcodeData.stats?.solved || 0,
      easySolved: leetcodeData.stats?.easySolved || 0,
      mediumSolved: leetcodeData.stats?.mediumSolved || 0,
      hardSolved: leetcodeData.stats?.hardSolved || 0,
      contestRating: leetcodeData.stats?.contestRating || 0,
      currentStreakDays: leetcodeData.stats?.currentStreakDays || 0,
      momentumPerDay: leetcodeData.stats?.momentumPerDay || 0,
      dailySeries: leetcodeData.stats?.dailySubmissions || getLastNDates(30).map((date) => ({ date, count: 0 })),
    },
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { analyzeProfiles, normalizeUrl };
