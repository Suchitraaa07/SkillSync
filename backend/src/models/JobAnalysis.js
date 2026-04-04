const mongoose = require("mongoose");

const JobAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sourceUrl: { type: String, default: "" },
    roleTitle: { type: String, default: "Target Role" },
    jobDescription: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    inferredSkills: { type: [String], default: [] },
    skillGap: {
      missingSkills: { type: [String], default: [] },
      weakSkills: { type: [String], default: [] },
      strongSkills: { type: [String], default: [] },
    },
    readiness: {
      score: { type: Number, default: 0 },
      category: { type: String, default: "Not Ready" },
      explanation: { type: String, default: "" },
      components: {
        skillMatch: { type: Number, default: 0 },
        projectRelevance: { type: Number, default: 0 },
        experienceScore: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobAnalysis", JobAnalysisSchema);
