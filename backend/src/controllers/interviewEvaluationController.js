const User = require("../models/User");
const JobAnalysis = require("../models/JobAnalysis");
const InterviewSession = require("../models/InterviewSession");
const { readinessCategory } = require("../services/readinessService");
const {
  streamOpenAIEvaluation,
  calculateOverallInterviewScore,
  calculateReadinessScore,
} = require("../services/interviewEvaluationService");

const writeStreamEvent = (res, payload) => {
  res.write(`${JSON.stringify(payload)}\n`);
};

const evaluateInterview = async (req, res) => {
  try {
    const { userId, question, answer } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ message: "question is required" });
    }

    if (!answer || typeof answer !== "string") {
      return res.status(400).json({ message: "answer is required" });
    }

    const authenticatedUserId = req.user?.userId;
    const effectiveUserId = authenticatedUserId || userId;

    if (!effectiveUserId || typeof effectiveUserId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(effectiveUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const evaluation = await streamOpenAIEvaluation({
      question,
      answer,
      onToken: (token) => writeStreamEvent(res, { type: "token", content: token }),
    });

    const overallInterviewScore = calculateOverallInterviewScore(evaluation);
    const previousReadiness = user.readinessHistory?.length
      ? Number(user.readinessHistory[user.readinessHistory.length - 1].score) || 0
      : 0;
    const newReadiness = calculateReadinessScore({
      previousReadiness,
      overallInterviewScore,
    });
    const category = readinessCategory(newReadiness);

    user.readinessHistory.push({ score: newReadiness, category });
    await user.save();

    await JobAnalysis.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          "readiness.score": newReadiness,
          "readiness.category": category,
        },
      },
      { sort: { createdAt: -1 } }
    );

    await InterviewSession.create({
      userId: user._id,
      question: question.trim(),
      answer: answer.trim(),
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      confidenceScore: evaluation.confidenceScore,
      overallInterviewScore,
      feedback: evaluation.feedback,
      readinessBefore: previousReadiness,
      readinessAfter: newReadiness,
    });

    writeStreamEvent(res, {
      type: "final",
      data: {
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        confidenceScore: evaluation.confidenceScore,
        overallInterviewScore,
        feedback: evaluation.feedback,
        previousReadiness,
        newReadiness,
        readinessCategory: category,
      },
    });

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message || "Interview evaluation failed" });
    }

    writeStreamEvent(res, {
      type: "error",
      message: error.message || "Interview evaluation failed",
    });
    return res.end();
  }
};

module.exports = { evaluateInterview };
