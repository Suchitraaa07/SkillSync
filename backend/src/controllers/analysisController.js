const JobAnalysis = require("../models/JobAnalysis");
const User = require("../models/User");
const { parseResumeBuffer } = require("../services/resumeService");
const { analyzeJobDescription } = require("../services/jobService");
const { buildSkillGap } = require("../services/skillGapService");
const { computeReadiness, gamificationFromScore } = require("../services/readinessService");
const { generateRoadmap } = require("../services/roadmapService");
const { simulateFutureReadiness } = require("../services/simulatorService");
const { getExplainableFeedback, generateQuestions } = require("../services/aiService");
const { analyzeReadinessForRole, ROLE_SKILLS } = require("../services/readinessAnalysisService");

const ROLE_SKILL_MAP = {
  "SDE Intern": ["javascript", "typescript", "node.js", "data structures", "algorithms"],
  "Frontend Developer Intern": ["javascript", "typescript", "react", "next.js", "css"],
  "Backend Developer Intern": ["node.js", "express", "mongodb", "sql", "api testing"],
  "Data Analyst Intern": ["python", "sql", "data analysis", "excel", "power bi"],
  "QA Engineer Intern": ["testing", "automation", "selenium", "postman", "api testing"],
  "Full Stack Intern": ["javascript", "react", "node.js", "mongodb", "rest api"],
};

const SKILL_ALIASES = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  "node.js": ["node.js", "nodejs", "node"],
  "data structures": ["data structures", "data structure", "dsa"],
  algorithms: ["algorithms", "algorithm"],
  react: ["react", "reactjs", "react.js"],
  "next.js": ["next.js", "nextjs", "next"],
  css: ["css", "tailwind", "bootstrap"],
  testing: ["testing", "test automation", "unit testing", "integration testing", "qa"],
  automation: ["automation", "automated testing", "test automation"],
  selenium: ["selenium"],
  postman: ["postman"],
  "api testing": ["api testing", "rest api", "api"],
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasSkillMatch = ({ requiredSkill, userSkills, resumeText }) => {
  const variants = SKILL_ALIASES[requiredSkill] || [requiredSkill];
  return variants.some((variant) => {
    const normalized = variant.toLowerCase().trim();
    if (userSkills.has(normalized)) return true;
    const pattern = new RegExp(`\\b${escapeRegex(normalized)}\\b`, "i");
    return pattern.test(resumeText);
  });
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

  const normalizedUserSkills = new Set(
    (user.resumeSkills || []).map((skill) => String(skill).trim().toLowerCase())
  );
  const normalizedResumeText = String(user.resumeText || "").toLowerCase();
  const hasResumeData = Boolean(normalizedResumeText.trim()) && normalizedUserSkills.size > 0;

  if (!hasResumeData) {
    return res.json({
      needsResumeUpload: true,
      message: "Upload your resume in Resume Analysis first to unlock role comparison.",
      roleFit: [],
    });
  }

  const roleFit = Object.entries(ROLE_SKILL_MAP).map(([role, skills]) => {
    const matched = skills.filter((skill) =>
      hasSkillMatch({
        requiredSkill: skill,
        userSkills: normalizedUserSkills,
        resumeText: normalizedResumeText,
      })
    ).length;
    const fit = Math.round((matched / skills.length) * 100);
    return { role, fit };
  });

  return res.json({
    needsResumeUpload: false,
    extractedSkills: [...normalizedUserSkills],
    roleFit,
  });
};

const analyzeReadiness = async (req, res) => {
  try {
    const { resumeText = "", selectedRole = "" } = req.body || {};
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ message: "resumeText is required" });
    }

    if (!selectedRole || typeof selectedRole !== "string") {
      return res.status(400).json({ message: "selectedRole is required" });
    }

    if (!ROLE_SKILLS[selectedRole]) {
      return res.status(400).json({
        message: "Unsupported role selected",
        supportedRoles: Object.keys(ROLE_SKILLS),
      });
    }

    const result = analyzeReadinessForRole({ resumeText, selectedRole });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Readiness analysis failed" });
  }
};

const generateQuestionsForRole = async (req, res) => {
  try {
    const { role, skills = [] } = req.body || {};
    if (!role || typeof role !== "string") {
      return res.status(400).json({ message: "Role is required" });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 30)
      : [];

    const questions = await generateQuestions(role, normalizedSkills);
    return res.json({ role, questions });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to generate questions" });
  }
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

const extensionResumeAnalyze = async (req, res) => {
  try {
    const resumeText = String(req.body?.resumeText || "");
    const profile = req.body?.profile || {};

    if (!resumeText.trim()) {
      return res.status(400).json({ message: "resumeText is required" });
    }

    const text = resumeText.toLowerCase();
    const highlights = [];
    const missing = [];
    let score = 35;

    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText) || Boolean(profile.email);
    const hasPhone = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/.test(resumeText) || Boolean(profile.phone);
    const hasLinkedin = /linkedin\.com\//.test(text) || Boolean(profile.linkedin);
    const hasGithub = /github\.com\//.test(text) || Boolean(profile.github);
    const hasProjects = /project|portfolio|built|developed/.test(text);
    const hasExperience = /experience|intern|worked|freelance/.test(text);
    const hasEducation = /education|b\.?tech|bachelor|university|college/.test(text);
    const hasSkillsSection = /skills|technical skills|tech stack/.test(text);

    if (hasEmail) {
      score += 8;
      highlights.push("Email present");
    } else {
      missing.push("Add professional email");
    }

    if (hasPhone) {
      score += 6;
      highlights.push("Phone number present");
    } else {
      missing.push("Add phone number");
    }

    if (hasLinkedin) {
      score += 7;
      highlights.push("LinkedIn profile present");
    } else {
      missing.push("Add LinkedIn URL");
    }

    if (hasGithub) {
      score += 7;
      highlights.push("GitHub profile present");
    } else {
      missing.push("Add GitHub URL");
    }

    if (hasProjects) {
      score += 10;
      highlights.push("Project section detected");
    } else {
      missing.push("Add 2-3 project bullets with measurable impact");
    }

    if (hasExperience) {
      score += 8;
      highlights.push("Experience section detected");
    } else {
      missing.push("Add internship/freelance/experience details");
    }

    if (hasEducation) {
      score += 8;
      highlights.push("Education section detected");
    } else {
      missing.push("Add education details");
    }

    if (hasSkillsSection) {
      score += 8;
      highlights.push("Skills section detected");
    } else {
      missing.push("Add a clear skills section");
    }

    const recommendedKeywords =
      text.match(/javascript|typescript|react|node\.js|python|sql|mongodb|aws|docker|git/g) || [];

    return res.json({
      score: Math.min(100, Math.max(0, score)),
      highlights: [...new Set(highlights)],
      missing: [...new Set(missing)],
      extractedSkills: [...new Set(recommendedKeywords)],
      recommendation:
        score >= 75
          ? "Resume looks strong for internship applications. Keep tailoring per role."
          : "Improve the missing sections, then retry analysis for a stronger auto-apply profile.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Extension resume analysis failed" });
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
  analyzeReadiness,
  generateQuestionsForRole,
  resumeOptimizer,
  extensionAnalyze,
  extensionResumeAnalyze,
};
