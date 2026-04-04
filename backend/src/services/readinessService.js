const { semanticSimilarity } = require("./semanticService");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const readinessCategory = (score) => {
  if (score < 50) return "Not Ready";
  if (score < 75) return "Moderate";
  return "Ready";
};

const projectRelevanceScore = async (projects, jobDescription) => {
  if (!projects?.length) return 0;
  const similarities = await Promise.all(
    projects.map((project) => semanticSimilarity(project, jobDescription))
  );

  const avg = similarities.reduce((acc, v) => acc + v, 0) / similarities.length;
  return clamp(Math.round(avg * 100), 0, 100);
};

const computeReadiness = async ({ userSkills, jobSkills, projects, experienceYears, jobDescription }) => {
  const skillMatch = jobSkills.length
    ? (userSkills.filter((s) => jobSkills.includes(s)).length / jobSkills.length) * 100
    : 0;

  const projectRelevance = await projectRelevanceScore(projects, jobDescription);
  const experienceScore = clamp((experienceYears / 3) * 100, 0, 100);

  const score =
    skillMatch * 0.5 +
    projectRelevance * 0.3 +
    experienceScore * 0.2;

  return {
    score: Math.round(score),
    category: readinessCategory(score),
    components: {
      skillMatch: Math.round(skillMatch),
      projectRelevance,
      experienceScore: Math.round(experienceScore),
    },
  };
};

const gamificationFromScore = (score) => {
  if (score < 50) return { level: "Beginner", xp: 120 };
  if (score < 65) return { level: "Learner", xp: 240 };
  if (score < 80) return { level: "Builder", xp: 420 };
  return { level: "Pro", xp: 700 };
};

module.exports = {
  computeReadiness,
  readinessCategory,
  gamificationFromScore,
};
