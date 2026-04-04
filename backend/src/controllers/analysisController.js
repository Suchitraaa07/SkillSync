const JobAnalysis = require("../models/JobAnalysis");
const User = require("../models/User");
const { parseResumeBuffer } = require("../services/resumeService");
const { analyzeJobDescription } = require("../services/jobService");
const { buildSkillGap } = require("../services/skillGapService");
const { computeReadiness, gamificationFromScore } = require("../services/readinessService");
const { generateRoadmap } = require("../services/roadmapService");
const { simulateFutureReadiness } = require("../services/simulatorService");
const { getExplainableFeedback } = require("../services/aiService");

const ROLE_SKILL_MAP = {
  "Data Analyst": ["sql", "python", "data analysis", "excel", "power bi"],
  "Web Dev": ["javascript", "react", "next.js", "node.js", "mongodb"],
  "ML Engineer": ["python", "machine learning", "deep learning", "numpy", "scikit-learn"],
};

const getLatestAnalysis = async (userId) => {
  return JobAnalysis.findOne({ userId }).sort({ createdAt: -1 });
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF file is required" });
    }

    const parsed = await parseResumeBuffer(req.file.buffer);
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        resumeText: parsed.text,
        resumeSkills: parsed.skills,
        resumeProjects: parsed.projects,
        experienceYears: parsed.experienceYears,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found. Please login again." });
    }

    return res.json({
      message: "Resume uploaded and analyzed",
      data: {
        skills: user.resumeSkills,
        projects: user.resumeProjects,
        experienceYears: user.experienceYears,
      },
    });
  } catch (error) {
    if (
      error.message === "Invalid resume file" ||
      error.message === "Only valid PDF resumes are supported"
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Resume analysis failed" });
  }
};

const analyzeJob = async (req, res) => {
  try {
    const { description, url, roleTitle } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const job = await analyzeJobDescription({ description, url });
    const targetSkills = [...job.requiredSkills, ...job.inferredSkills];
    const skillGap = buildSkillGap(user.resumeSkills, targetSkills);
    const readiness = await computeReadiness({
      userSkills: user.resumeSkills,
      jobSkills: targetSkills,
      projects: user.resumeProjects,
      experienceYears: user.experienceYears,
      jobDescription: job.jobDescription,
    });

    const explanation = await getExplainableFeedback({
      missingSkills: skillGap.missingSkills,
      weakSkills: skillGap.weakSkills,
      strongSkills: skillGap.strongSkills,
      readiness,
    });

    const saved = await JobAnalysis.create({
      userId: user._id,
      sourceUrl: job.sourceUrl,
      roleTitle: roleTitle || "Target Role",
      jobDescription: job.jobDescription,
      requiredSkills: job.requiredSkills,
      inferredSkills: job.inferredSkills,
      skillGap,
      readiness: { ...readiness, explanation },
    });

    const game = gamificationFromScore(readiness.score);
    user.readinessHistory.push({ score: readiness.score, category: readiness.category });
    user.gamificationLevel = game.level;
    user.xp = Math.max(user.xp, game.xp);
    await user.save();

    return res.json({ message: "Job analyzed", analysis: saved });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Job analysis failed" });
  }
};

const getSkillGap = async (req, res) => {
  const latest = await getLatestAnalysis(req.user.userId);
  if (!latest) return res.status(404).json({ message: "No job analysis found" });
  return res.json(latest.skillGap);
};

const getReadinessScore = async (req, res) => {
  const latest = await getLatestAnalysis(req.user.userId);
  const user = await User.findById(req.user.userId);
  if (!latest || !user) return res.status(404).json({ message: "No readiness data found" });

  return res.json({
    readiness: latest.readiness,
    history: user.readinessHistory.slice(-12),
    gamification: {
      level: user.gamificationLevel,
      xp: user.xp,
    },
  });
};

const getRoadmap = async (req, res) => {
  const latest = await getLatestAnalysis(req.user.userId);
  if (!latest) return res.status(404).json({ message: "No job analysis found" });

  const roadmap = generateRoadmap(latest.skillGap.missingSkills);
  return res.json({ roadmap });
};

const simulateFuture = async (req, res) => {
  const latest = await getLatestAnalysis(req.user.userId);
  const user = await User.findById(req.user.userId);
  if (!latest || !user) return res.status(404).json({ message: "No analysis found for simulation" });

  const { skillsToLearn = [] } = req.body;
  const predicted = await simulateFutureReadiness({
    currentSkills: user.resumeSkills,
    additionalSkills: skillsToLearn,
    jobSkills: [...latest.requiredSkills, ...latest.inferredSkills],
    projects: user.resumeProjects,
    experienceYears: user.experienceYears,
    jobDescription: latest.jobDescription,
  });

  return res.json({
    currentScore: latest.readiness.score,
    newScore: predicted.score,
    improvement: predicted.score - latest.readiness.score,
    category: predicted.category,
  });
};

const getFitHeatmap = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const roleFit = Object.entries(ROLE_SKILL_MAP).map(([role, skills]) => {
    const matched = skills.filter((s) => user.resumeSkills.includes(s)).length;
    const fit = Math.round((matched / skills.length) * 100);
    return { role, fit };
  });

  return res.json({ roleFit });
};

const resumeOptimizer = async (req, res) => {
  const latest = await getLatestAnalysis(req.user.userId);
  const user = await User.findById(req.user.userId);
  if (!latest || !user) {
    return res.json({
      needsSetup: true,
      message: "Upload resume and analyze a job first",
      bullets: [
        "Upload your resume to extract skills, projects, and experience.",
        "Analyze a target job description to generate your personalized optimization tips.",
      ],
      strongSkills: [],
      missingSkills: [],
      currentSkills: user?.resumeSkills || [],
    });
  }

  return res.json({
    needsSetup: false,
    bullets: [
      `Prioritize adding ${latest.skillGap.missingSkills.slice(0, 3).join(", ")} to projects or coursework.`,
      "Quantify outcomes in project bullets (e.g., latency reduced by 25%).",
      "Add one role-aligned capstone section matching target internship domain.",
    ],
    strongSkills: latest.skillGap.strongSkills,
    missingSkills: latest.skillGap.missingSkills,
    currentSkills: user.resumeSkills,
  });
};

const extensionAnalyze = async (req, res) => {
  try {
    const { description = "" } = req.body;
    const requiredSkills = description
      .toLowerCase()
      .match(/javascript|typescript|react|node\.js|python|sql|mongodb|aws|docker|machine learning/g) || [];

    return res.json({
      fitScore: Math.min(95, 35 + requiredSkills.length * 8),
      missingSkills: [...new Set(requiredSkills)].slice(0, 5),
      recommendation: requiredSkills.length >= 4 ? "Strong Apply" : "Apply with Preparation",
    });
  } catch (error) {
    return res.status(500).json({ message: "Extension analysis failed" });
  }
};

module.exports = {
  uploadResume,
  analyzeJob,
  getSkillGap,
  getReadinessScore,
  getRoadmap,
  simulateFuture,
  getFitHeatmap,
  resumeOptimizer,
  extensionAnalyze,
};
