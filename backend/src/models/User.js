const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    resumeText: { type: String, default: "" },
    resumeSkills: { type: [String], default: [] },
    resumeProjects: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    readinessHistory: [
      {
        score: Number,
        category: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    gamificationLevel: { type: String, default: "Beginner" },
    xp: { type: Number, default: 0 },
    profileLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      leetcode: { type: String, default: "" },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
