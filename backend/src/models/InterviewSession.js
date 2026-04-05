const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    technicalScore: { type: Number, required: true, min: 0, max: 100 },
    communicationScore: { type: Number, required: true, min: 0, max: 100 },
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    overallInterviewScore: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, default: "" },
    readinessBefore: { type: Number, default: 0 },
    readinessAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
