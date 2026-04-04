const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { analyzeProfiles, normalizeUrl } = require("../services/profileIntelligenceService");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  resumeSkills: user.resumeSkills,
  experienceYears: user.experienceYears,
  gamificationLevel: user.gamificationLevel,
  xp: user.xp,
  profileLinks: {
    linkedin: user.profileLinks?.linkedin || "",
    github: user.profileLinks?.github || "",
    leetcode: user.profileLinks?.leetcode || "",
    updatedAt: user.profileLinks?.updatedAt || null,
  },
});

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
    const token = signToken(user);

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Signup failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

const me = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: sanitizeUser(user) });
};

const updateProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const linkedin = normalizeUrl(req.body?.linkedin);
    const github = normalizeUrl(req.body?.github);
    const leetcode = normalizeUrl(req.body?.leetcode);

    user.profileLinks = {
      linkedin,
      github,
      leetcode,
      updatedAt: new Date(),
    };

    await user.save();
    return res.json({
      message: "Profiles updated",
      profileLinks: user.profileLinks,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update profiles" });
  }
};

const getProfileIntelligence = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const latestReadiness = user.readinessHistory?.length
      ? user.readinessHistory[user.readinessHistory.length - 1].score
      : 0;

    const analysis = await analyzeProfiles({
      linkedin: user.profileLinks?.linkedin,
      github: user.profileLinks?.github,
      leetcode: user.profileLinks?.leetcode,
      readinessScore: latestReadiness,
    });

    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to analyze connected profiles" });
  }
};

module.exports = { signup, login, me, updateProfiles, getProfileIntelligence };
