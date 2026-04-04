const { extractSkills, dedupe, normalize } = require("./nlpService");
const { parseResumeData } = require("../utils/parseResumeData");

const ROLE_SKILLS = {
  "Full Stack Developer": ["javascript", "react", "node.js", "mongodb", "sql", "git"],
  "Frontend Developer": ["html", "css", "javascript", "react", "next.js", "git"],
  "Backend Developer": ["node.js", "express", "mongodb", "sql", "rest api", "git"],
  "Data Analyst": ["python", "sql", "excel", "power bi", "data analysis", "pandas"],
  "AI Engineer": ["python", "machine learning", "deep learning", "nlp", "numpy", "scikit-learn"],
};

const SKILL_ALIASES = {
  javascript: ["javascript", "js"],
  "node.js": ["node.js", "nodejs", "node"],
  "rest api": ["rest api", "api"],
  "data analysis": ["data analysis", "analytics"],
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning", "dl"],
};

const hasSkill = (requiredSkill, extractedSet, plainText) => {
  const variants = SKILL_ALIASES[requiredSkill] || [requiredSkill];
  return variants.some((variant) => {
    const normalizedVariant = normalize(variant);
    if (extractedSet.has(normalizedVariant)) return true;
    const escaped = normalizedVariant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(plainText);
  });
};

const extractResumeSkills = (resumeText = "") => {
  const nlpSkills = extractSkills(resumeText);
  const keywordSkills = parseResumeData(resumeText).skills;
  const merged = dedupe([...nlpSkills, ...keywordSkills]);
  return merged;
};

const readinessLevelFromScore = (score) => {
  if (score >= 80) return "Highly Ready";
  if (score >= 60) return "Moderately Ready";
  return "Needs Improvement";
};

const analyzeReadinessForRole = ({ resumeText = "", selectedRole = "" }) => {
  const requiredSkills = ROLE_SKILLS[selectedRole];
  if (!requiredSkills) {
    throw new Error("Selected role is not supported");
  }

  const normalizedText = String(resumeText || "").toLowerCase();
  const extractedSkills = extractResumeSkills(resumeText);
  const extractedSkillSet = new Set(extractedSkills.map((skill) => normalize(skill)));

  const matchedSkills = requiredSkills.filter((requiredSkill) =>
    hasSkill(requiredSkill, extractedSkillSet, normalizedText)
  );
  const missingSkills = requiredSkills.filter((requiredSkill) => !matchedSkills.includes(requiredSkill));
  const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    score,
    readinessLevel: readinessLevelFromScore(score),
    matchedSkills,
    missingSkills,
    totalGaps: missingSkills.length,
  };
};

module.exports = {
  ROLE_SKILLS,
  analyzeReadinessForRole,
};

